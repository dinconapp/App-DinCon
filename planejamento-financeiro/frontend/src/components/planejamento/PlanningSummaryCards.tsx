"use client";

import { AlertTriangle, Ban, CalendarClock, CheckCircle2, Clock3, Info, Plus, RotateCcw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge, type StatusKey } from "@/components/ui/StatusBadge";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { getBills, payBill, receiveIncome, unpayBill, unreceiveIncome, type Bill } from "@/services/billService";
import type { Budget } from "@/types/budget";
import type { Transaction } from "@/types/transaction";
import { isLooseTransaction } from "@/utils/financial-classification";
import { truncateText } from "@/utils/text";
import { TransactionFormModal } from "@/components/transacoes/TransactionFormModal";
import { BudgetFormModal } from "./BudgetFormModal";

type PaymentStatus = {
  value: StatusKey;
  label: string;
  detail: string;
};

export function PlanningPage({ userId, monthKey, actionToken, onDone }: { userId: string; monthKey: string; actionToken: number; onDone: (message: string, tone?: "success" | "error") => void }) {
  const { items, loading, save, remove, reload: reloadBudgets } = useBudgets(userId);
  const tx = useTransactions(userId, monthKey);
  const { items: categories, reload: reloadCategories } = useCategories();
  const [editing, setEditing] = useState<Budget | null | undefined>(undefined);
  const [transactionEditing, setTransactionEditing] = useState<Transaction | null | undefined>(undefined);
  const [newBudgetKind, setNewBudgetKind] = useState<"income" | "expense">("income");
  const [newBudgetHasDueDate, setNewBudgetHasDueDate] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [bills, setBills] = useState<{ pending: Bill[]; paid: Bill[] }>({ pending: [], paid: [] });
  const [billsLoading, setBillsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (actionToken) setEditing(null);
  }, [actionToken]);

  async function loadBills() {
    setBillsLoading(true);
    try {
      setBills(await getBills(userId, monthKey));
    } catch {
      setBills({ pending: [], paid: [] });
    } finally {
      setBillsLoading(false);
    }
  }

  useEffect(() => {
    void loadBills();
  }, [userId, monthKey]);

  const groups = useMemo(() => ({
    fixed: items.filter((item) => item.kind === "expense" && item.budget_type === "fixed" && activeInMonth(item, monthKey)),
    variable: items.filter((item) => item.kind === "expense" && item.budget_type === "variable" && activeInMonth(item, monthKey)),
    income: items.filter((item) => item.kind === "income" && activeInMonth(item, monthKey))
  }), [items, monthKey]);
  const activeTransactions = useMemo(() => tx.items.filter((item) => item.status !== "canceled"), [tx.items]);
  const avulsoTransactions = useMemo(() => tx.items.filter(isLooseTransaction), [tx.items]);
  const calculationTransactions = useMemo(() => activeTransactions.filter(isLooseTransaction), [activeTransactions]);
  const transactionExpenses = useMemo(() => calculationTransactions.filter((item) => item.kind === "expense"), [calculationTransactions]);
  const transactionIncome = useMemo(() => calculationTransactions.filter((item) => item.kind === "income"), [calculationTransactions]);
  const looseIncomeTransactions = useMemo(() => transactionIncome.filter((item) => !item.budget_id), [transactionIncome]);
  const paidBillIds = useMemo(() => new Set(bills.paid.map((item) => item.budget_id)), [bills.paid]);
  const paidExpenseTransactionsByBudgetId = useMemo(() => {
    const map = new Map<string, Transaction>();
    activeTransactions
      .filter((item) => item.kind === "expense" && item.status === "paid" && item.budget_id)
      .forEach((item) => {
        const budgetId = item.budget_id as string;
        const current = map.get(budgetId);
        if (!current || current.transaction_date < item.transaction_date) {
          map.set(budgetId, item);
        }
      });
    return map;
  }, [activeTransactions]);
  const paidExpenseBudgetIds = useMemo(() => new Set(paidExpenseTransactionsByBudgetId.keys()), [paidExpenseTransactionsByBudgetId]);
  const receivedIncomeIds = useMemo(() => new Set(activeTransactions.filter((item) => item.kind === "income" && item.status === "paid" && item.budget_id).map((item) => item.budget_id as string)), [activeTransactions]);
  const expenseBudgetItems = useMemo(() => [...groups.fixed, ...groups.variable], [groups.fixed, groups.variable]);
  const receivedIncomeItems = useMemo(() => groups.income.filter((item) => receivedIncomeIds.has(item.id)), [groups.income, receivedIncomeIds]);
  const openExpenseBudgetItems = useMemo(() => expenseBudgetItems.filter((item) => !paidBillIds.has(item.id)), [expenseBudgetItems, paidBillIds]);
  const overdueExpenseBudgetItems = useMemo(() => openExpenseBudgetItems.filter((item) => getBudgetPaymentStatus(item, monthKey, paidBillIds, paidExpenseTransactionsByBudgetId, receivedIncomeIds).value === "overdue"), [openExpenseBudgetItems, monthKey, paidBillIds, paidExpenseTransactionsByBudgetId, receivedIncomeIds]);
  const pendingExpenseBudgetItems = useMemo(() => openExpenseBudgetItems.filter((item) => getBudgetPaymentStatus(item, monthKey, paidBillIds, paidExpenseTransactionsByBudgetId, receivedIncomeIds).value === "pending"), [openExpenseBudgetItems, monthKey, paidBillIds, paidExpenseTransactionsByBudgetId, receivedIncomeIds]);
  const overdueTransactionExpenses = useMemo(() => transactionExpenses.filter((item) => isOverdueTransaction(item)), [transactionExpenses]);
  const pendingTransactionExpenses = useMemo(() => transactionExpenses.filter((item) => item.status === "pending" && !isOverdueTransaction(item)), [transactionExpenses]);
  const totalBudget = (rows: Budget[]) => rows.reduce((sum, item) => sum + item.amount, 0);
  const sumTx = (rows: Transaction[], status?: Transaction["status"]) => rows.reduce((sum, item) => sum + (status && item.status !== status ? 0 : item.amount), 0);
  // A previsao do mes considera cada despesa prevista uma unica vez, sem duplicar por status.
  const plannedIncome = totalBudget(groups.income) + sumTx(looseIncomeTransactions);
  const receivedIncome = totalBudget(receivedIncomeItems) + sumTx(looseIncomeTransactions, "paid");
  const plannedExpense = totalBudget(expenseBudgetItems) + sumTx(transactionExpenses);
  const paidExpense = sumTx(transactionExpenses, "paid")
    + groups.fixed.filter((item) => paidBillIds.has(item.id)).reduce((sum, item) => sum + item.amount, 0)
    + groups.variable.filter((item) => paidExpenseBudgetIds.has(item.id)).reduce((sum, item) => sum + item.amount, 0);
  const overdueExpense = overdueExpenseBudgetItems.reduce((sum, item) => sum + item.amount, 0) + overdueTransactionExpenses.reduce((sum, item) => sum + item.amount, 0);
  const pendingExpense = pendingExpenseBudgetItems.reduce((sum, item) => sum + item.amount, 0) + pendingTransactionExpenses.reduce((sum, item) => sum + item.amount, 0);
  const projectedBalance = plannedIncome - plannedExpense;
  const realizedBalance = receivedIncome - paidExpense;

  async function deleteItem(item: Budget) {
    if (!window.confirm(`Remover "${item.description}"? Lançamentos vinculados também serão removidos.`)) return;
    try {
      await remove(item.id);
      await Promise.all([tx.reload(), loadBills(), reloadCategories()]);
      onDone("Item removido");
    } catch {
      onDone("Não foi possível remover o item. Tente novamente.", "error");
    }
  }

  async function toggleBill(item: Budget) {
    if (item.budget_type === "variable") {
      if (togglingId === item.id) return;
      setTogglingId(item.id);
      try {
        if (paidExpenseBudgetIds.has(item.id)) {
          await unpayBill(userId, monthKey, item.id);
          onDone("Despesa voltou para pendente.");
        } else {
          await payBill(userId, monthKey, item.id);
          onDone("Despesa marcada como paga.");
        }
        await Promise.all([tx.reload(), loadBills(), reloadBudgets()]);
      } catch {
        onDone("Nao foi possivel atualizar a despesa. Tente novamente.", "error");
      } finally {
        setTogglingId(null);
      }
      return;
    }

    try {
      if (paidBillIds.has(item.id)) {
        await unpayBill(userId, monthKey, item.id);
        onDone("Conta voltou para pendente.");
      } else {
        await payBill(userId, monthKey, item.id);
        onDone("Conta marcada como paga.");
      }
      await Promise.all([tx.reload(), loadBills(), reloadBudgets()]);
    } catch {
      onDone("Não foi possível atualizar a conta. Tente novamente.", "error");
    }
  }

  async function toggleIncome(item: Budget) {
    try {
      if (receivedIncomeIds.has(item.id)) {
        await unreceiveIncome(userId, monthKey, item.id);
        onDone("Receita voltou para prevista.");
      } else {
        await receiveIncome(userId, monthKey, item.id);
        onDone("Receita marcada como recebida.");
      }
      await Promise.all([tx.reload(), loadBills(), reloadBudgets()]);
    } catch {
      onDone("Não foi possível atualizar a receita. Tente novamente.", "error");
    }
  }

  async function handleSave(payload: Parameters<typeof save>[0], id?: string) {
    try {
      await save(payload, id);
      await Promise.all([tx.reload(), loadBills()]);
      onDone(payload.kind === "income" ? "Receita salva com sucesso." : "Despesa salva com sucesso.");
    } catch {
      onDone("Não foi possível salvar o item. Tente novamente.", "error");
    }
  }

  if (loading || tx.loading || billsLoading) return <div className="cf-card">Carregando fluxo de caixa...</div>;
  return (
    <div className="cf-grid">
      <Card title="Previsão Mês">
        <p className="cf-panel-description">Receita prevista, despesa prevista e saldo previsto para o mês selecionado.</p>
        <div className="cf-grid cf-summary-grid cf-summary-grid-3">
          <CashFlowKpi title="Receita Prevista" value={plannedIncome} tone="income" icon={<TrendingUp size={19} />} detail={`${groups.income.length + looseIncomeTransactions.length} registros`} />
          <CashFlowKpi title="Despesa Prevista" value={plannedExpense} tone="expense" icon={<TrendingDown size={19} />} detail={`${expenseBudgetItems.length + transactionExpenses.length} registros`} />
          <CashFlowKpi title="Saldo Previsto" value={projectedBalance} tone={projectedBalance >= 0 ? "income" : "expense"} icon={<Wallet size={19} />} detail={`Receita prevista menos despesa prevista`} />
        </div>
      </Card>

      <Card title="Resumo do mês">
        <p className="cf-panel-description">Receita recebida e saldo do mês já realizado.</p>
        <div className="cf-grid cf-summary-grid cf-summary-grid-5">
          <CashFlowKpi title="Receita Recebida" value={receivedIncome} tone="income" icon={<CheckCircle2 size={19} />} detail={`${receivedIncomeItems.length} registros`} />
          <StatusMetric label="Saídas pagas" value={paidExpense} helper="Saídas realizadas no mês" tone="paid" />
          <StatusMetric label="Saídas em aberto" value={pendingExpense} helper="Saídas ainda em aberto" tone="pending" />
          <StatusMetric label="Saídas vencidas" value={overdueExpense} helper="Vencimentos em atraso" tone="overdue" />
          <StatusMetric label="Saldo Mês" value={realizedBalance} helper="Receita recebida menos despesas pagas" tone={realizedBalance >= 0 ? "income" : "expense"} />
        </div>
      </Card>

      <div className="cf-grid cf-three">
        <CashFlowSection title="Contas fixas" description="Compromissos recorrentes com vencimento no mês." count={groups.fixed.length}>
          {!groups.fixed.length && <EmptyState message="Nenhuma conta fixa cadastrada para este mês." />}
          {groups.fixed.map((item) => (
            <CashFlowBudgetRow
              key={item.id}
              item={item}
              monthKey={monthKey}
              status={getBudgetPaymentStatus(item, monthKey, paidBillIds, paidExpenseTransactionsByBudgetId, receivedIncomeIds)}
              onEdit={() => setEditing(item)}
              onDelete={() => deleteItem(item)}
              onTogglePaid={() => toggleBill(item)}
              busy={togglingId === item.id}
            />
          ))}
        </CashFlowSection>

        <CashFlowSection title="Receitas previstas" description="Valores que você espera receber neste mês." count={groups.income.length}>
          {!groups.income.length && <EmptyState message="Nenhuma receita prevista para este mês. Cadastre uma receita prevista para acompanhar seus recebimentos." />}
          {groups.income.map((item) => (
            <CashFlowBudgetRow
              key={item.id}
              item={item}
              monthKey={monthKey}
              status={getBudgetPaymentStatus(item, monthKey, paidBillIds, paidExpenseTransactionsByBudgetId, receivedIncomeIds)}
              onEdit={() => setEditing(item)}
              onDelete={() => deleteItem(item)}
              onTogglePaid={() => toggleIncome(item)}
              busy={togglingId === item.id}
            />
          ))}
        </CashFlowSection>

        <CashFlowSection title="Despesas variáveis" description="Gastos planejados que não entram como contas fixas do mês." count={groups.variable.length}>
          {!groups.variable.length && <EmptyState message="Nenhuma despesa variável cadastrada para este mês." />}
          {groups.variable.map((item) => (
            <CashFlowBudgetRow
              key={item.id}
              item={item}
              monthKey={monthKey}
              status={getBudgetPaymentStatus(item, monthKey, paidBillIds, paidExpenseTransactionsByBudgetId, receivedIncomeIds)}
              onEdit={() => setEditing(item)}
              onDelete={() => deleteItem(item)}
              onTogglePaid={() => toggleBill(item)}
              busy={togglingId === item.id}
            />
          ))}
        </CashFlowSection>
      </div>

      <div className="cf-grid">
        <CashFlowSection title="Lançamentos avulsos" description="Entradas e gastos realizados fora das previsões fixas." count={avulsoTransactions.length}>
          {!avulsoTransactions.length && <EmptyState message="Nenhum lançamento avulso encontrado neste mês." />}
          {avulsoTransactions.map((item) => <CashFlowTransactionRow key={item.id} item={item} />)}
        </CashFlowSection>
      </div>
      <div className="cf-fab-wrap">
        {fabOpen && (
          <div className="cf-fab-menu">
            <button type="button" onClick={() => { setNewBudgetKind("income"); setNewBudgetHasDueDate(false); setEditing(null); setFabOpen(false); }}>
              <span>Nova receita prevista</span>
              <InfoTooltip text="Use para salário, aluguel recebido ou outra receita esperada no mês." />
            </button>
            <button type="button" onClick={() => { setNewBudgetKind("expense"); setNewBudgetHasDueDate(true); setEditing(null); setFabOpen(false); }}>
              <span>Nova conta fixa</span>
              <InfoTooltip text="Use para compromissos recorrentes, como aluguel, energia, internet e cartão." />
            </button>
            <button type="button" onClick={() => { setTransactionEditing(null); setFabOpen(false); }}>
              <span>Novo lançamento avulso</span>
              <InfoTooltip text="Use para entradas e gastos realizados fora das previsões fixas." />
            </button>
          </div>
        )}
        <button className="cf-fab" type="button" onClick={() => setFabOpen((value) => !value)} aria-label="Adicionar no fluxo de caixa" aria-expanded={fabOpen}>
          <Plus size={30} strokeWidth={2.6} />
        </button>
      </div>
      {editing !== undefined && <BudgetFormModal userId={userId} monthKey={monthKey} initial={editing} defaultKind={newBudgetKind} defaultBudgetType="fixed" defaultHasDueDate={newBudgetHasDueDate} categories={categories} onClose={() => setEditing(undefined)} onSave={handleSave} />}
      {transactionEditing !== undefined && (
        <TransactionFormModal
          userId={userId}
          monthKey={monthKey}
          categories={categories}
          initial={transactionEditing}
          onClose={() => setTransactionEditing(undefined)}
          onSave={async (payload, id) => {
            await tx.save(payload, id);
            await Promise.all([loadBills(), reloadCategories()]);
            onDone("Lançamento salvo com sucesso.");
          }}
        />
      )}
    </div>
  );
}

function activeInMonth(item: Budget, monthKey: string) {
  if (item.start_month && item.start_month > monthKey) return false;
  if (item.end_month && item.end_month < monthKey) return false;
  return true;
}

function dueDateFor(monthKey: string, dueDay?: number | null) {
  if (!dueDay) return null;
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(dueDay, lastDay), 23, 59, 59);
}

function getBudgetPaymentStatus(item: Budget, monthKey: string, paidBillIds: Set<string>, paidExpenseTransactionsByBudgetId: Map<string, Transaction>, receivedIncomeIds: Set<string>): PaymentStatus {
  if (item.kind === "income") {
    if (receivedIncomeIds.has(item.id)) return { value: "received", label: "Recebido", detail: "Receita recebida" };
    if (!item.has_due_date || !item.due_day) return { value: "planned", label: "Previsto", detail: "Receita prevista" };

    const dueDate = dueDateFor(monthKey, item.due_day);
    if (dueDate && dueDate.getTime() < Date.now()) return { value: "overdue", label: "Atrasado", detail: `Recebimento previsto em atraso desde ${formatDateFromDate(dueDate)}` };
    return { value: "pending", label: "Pendente", detail: dueDate ? `Recebimento previsto para ${formatDateFromDate(dueDate)}` : "Aguardando recebimento" };
  }

  const paidExpenseTransaction = paidExpenseTransactionsByBudgetId.get(item.id);
  if (paidBillIds.has(item.id)) return { value: "paid", label: "Pago", detail: "Pagamento confirmado" };
  if (paidExpenseTransaction) return { value: "paid", label: "Pago", detail: `Pagamento confirmado em ${formatDate(paidExpenseTransaction.transaction_date)}` };
  if (!item.has_due_date || !item.due_day) return { value: "planned", label: "Previsto", detail: "Sem vencimento" };

  const dueDate = dueDateFor(monthKey, item.due_day);
  if (dueDate && dueDate.getTime() < Date.now()) return { value: "overdue", label: "Atrasado", detail: `Venceu em ${formatDateFromDate(dueDate)}` };
  return { value: "pending", label: "Pendente", detail: dueDate ? `Vence em ${formatDateFromDate(dueDate)}` : "Aguardando pagamento" };
}

function isOverdueTransaction(item: Transaction) {
  return item.kind === "expense" && item.status === "pending" && new Date(`${item.transaction_date}T23:59:59`).getTime() < Date.now();
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatDateFromDate(value: Date) {
  return value.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CashFlowKpi({ title, value, tone, icon, detail }: { title: string; value: number; tone: "income" | "expense"; icon: ReactNode; detail: string }) {
  return (
    <Card className={`cf-cashflow-kpi cf-cashflow-kpi-${tone}`}>
      <div className="cf-kpi-top">
        <span className="cf-kpi-title">{title}</span>
        {icon}
      </div>
      <div className="cf-kpi-val"><Money value={value} size="md" tone={tone} /></div>
      <span className="cf-row-sub cf-kpi-detail">{detail}</span>
    </Card>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="cf-info-tooltip" tabIndex={0} aria-label={text}>
      <Info size={15} />
      <span role="tooltip">{text}</span>
    </span>
  );
}

function StatusMetric({ label, value, helper, tone }: { label: string; value: number; helper: string; tone: "paid" | "pending" | "overdue" | "income" | "expense" }) {
  return (
    <div className={`cf-status-metric ${tone}`}>
      <span className="cf-status-label">{label}</span>
      <strong>{formatCurrency(value)}</strong>
      <small className="cf-status-helper">{helper}</small>
    </div>
  );
}

function CashFlowSection({ title, description, count, children }: { title: string; description?: string; count: number; children: ReactNode }) {
  return (
    <Card meta={<span className="cf-chip">{count}</span>}>
      <SectionHeader title={title} description={description} />
      <div className="cf-cashflow-list">{children}</div>
    </Card>
  );
}

function CashFlowBudgetRow({
  item,
  monthKey,
  status,
  onEdit,
  onDelete,
  onTogglePaid,
  busy
}: {
  item: Budget;
  monthKey: string;
  status: PaymentStatus;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePaid?: () => void;
  busy?: boolean;
}) {
  const dueDate = item.has_due_date ? dueDateFor(monthKey, item.due_day) : null;
  const canToggle = onTogglePaid && (
    item.kind === "income" ||
    item.kind === "expense"
  );

  return (
    <div className={`cf-row cf-row-${item.kind} cf-cashflow-row`}>
      <div className="cf-row-main">
        <div className={`cf-dot cf-dot-${status.value}`}>
          {status.value === "paid" && <CheckCircle2 size={17} />}
          {status.value === "received" && <CheckCircle2 size={17} />}
          {status.value === "overdue" && <AlertTriangle size={17} />}
          {status.value === "pending" && <Clock3 size={17} />}
          {status.value === "planned" && <CalendarClock size={17} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="cf-row-title" title={item.description}>{truncateText(item.description)}</div>
          <div className="cf-row-sub" title={`${item.category_name ?? "Sem categoria"} - ${getBudgetFrequencyLabel(item)}${dueDate ? ` - venc. ${formatDateFromDate(dueDate)}` : ""}`}>
            {truncateText(`${item.category_name ?? "Sem categoria"} - ${getBudgetFrequencyLabel(item)}${dueDate ? ` - venc. ${formatDateFromDate(dueDate)}` : ""}`)}
          </div>
          <div className="cf-row-sub">{status.detail}</div>
        </div>
      </div>
      <div className="cf-cashflow-actions">
        <StatusBadge status={status.value} label={status.label} />
        <Money value={item.amount} size="sm" tone={item.kind === "income" ? "income" : "expense"} />
        {canToggle && (
          <Button
            square
            icon={status.value === "paid" ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
            onClick={onTogglePaid}
            disabled={busy}
            aria-label={item.kind === "income"
              ? (status.value === "paid" ? "Voltar para previsto" : "Marcar como recebido")
              : (status.value === "paid" ? "Voltar para pendente" : "Marcar como pago")}
          />
        )}
        <RowActionsMenu onEdit={onEdit} onDelete={onDelete} deleteLabel="Remover" />
      </div>
    </div>
  );
}

function CashFlowTransactionRow({ item }: { item: Transaction }) {
  const status: PaymentStatus = item.status === "canceled"
    ? { value: "canceled", label: "Cancelado", detail: "Lançamento cancelado" }
    : item.status === "paid"
      ? item.kind === "income"
        ? { value: "received", label: "Recebido", detail: "Receita realizada" }
        : { value: "paid", label: "Pago", detail: "Lançamento realizado" }
      : item.status === "pending" && new Date(`${item.transaction_date}T23:59:59`).getTime() < Date.now()
        ? { value: "overdue", label: "Atrasado", detail: "Lançamento pendente com data vencida" }
        : { value: "pending", label: "Pendente", detail: "Lançamento em aberto" };

  return (
    <div className={`cf-row cf-row-${item.kind} cf-cashflow-row`}>
      <div className="cf-row-main">
        <div className={`cf-dot cf-dot-${status.value}`}>
          {status.value === "paid" && <CheckCircle2 size={17} />}
          {status.value === "received" && <CheckCircle2 size={17} />}
          {status.value === "canceled" && <Ban size={17} />}
          {status.value === "overdue" && <AlertTriangle size={17} />}
          {status.value === "pending" && <Clock3 size={17} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="cf-row-title" title={item.title}>{truncateText(item.title)}</div>
          <div className="cf-row-sub" title={`${formatDate(item.transaction_date)} - ${item.category_name ?? "Sem categoria"} - lançamento avulso`}>{truncateText(`${formatDate(item.transaction_date)} - ${item.category_name ?? "Sem categoria"} - lançamento avulso`)}</div>
          <div className="cf-row-sub">{status.detail}</div>
        </div>
      </div>
      <div className="cf-cashflow-actions">
        <StatusBadge status={status.value} label={status.label} />
        <Money value={item.amount} size="sm" tone={item.kind === "income" ? "income" : "expense"} />
      </div>
    </div>
  );
}

function getBudgetFrequencyLabel(item: Budget) {
  if (item.kind === "expense" && item.budget_type === "fixed" && item.end_month) {
    return "Programável";
  }
  return item.budget_type === "fixed" ? "Fixo" : "Variável";
}
