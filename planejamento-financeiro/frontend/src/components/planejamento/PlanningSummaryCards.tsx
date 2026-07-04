"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Info, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
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
  const { items: categories } = useCategories();
  const [editing, setEditing] = useState<Budget | null | undefined>(undefined);
  const [transactionEditing, setTransactionEditing] = useState<Transaction | null | undefined>(undefined);
  const [newBudgetKind, setNewBudgetKind] = useState<"income" | "expense">("income");
  const [newBudgetHasDueDate, setNewBudgetHasDueDate] = useState(false);
  const [newBudgetTitle, setNewBudgetTitle] = useState("Nova receita prevista");
  const [fabOpen, setFabOpen] = useState(false);
  const [bills, setBills] = useState<{ pending: Bill[]; paid: Bill[] }>({ pending: [], paid: [] });
  const [billsLoading, setBillsLoading] = useState(true);

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
    income: items.filter((item) => item.kind === "income" && activeInMonth(item, monthKey))
  }), [items, monthKey]);
  const transactions = useMemo(() => tx.items.filter((item) => item.status !== "canceled"), [tx.items]);
  const avulsoTransactions = useMemo(() => transactions.filter(isLooseTransaction), [transactions]);
  const transactionExpenses = useMemo(() => avulsoTransactions.filter((item) => item.kind === "expense"), [avulsoTransactions]);
  const transactionIncome = useMemo(() => avulsoTransactions.filter((item) => item.kind === "income"), [avulsoTransactions]);
  const paidBillIds = useMemo(() => new Set(bills.paid.map((item) => item.budget_id)), [bills.paid]);
  const receivedIncomeIds = useMemo(() => new Set(transactions.filter((item) => item.kind === "income" && item.status === "paid" && item.budget_id).map((item) => item.budget_id as string)), [transactions]);
  const pendingBillIds = useMemo(() => new Set(bills.pending.map((item) => item.budget_id)), [bills.pending]);
  const total = (rows: Budget[]) => rows.reduce((sum, item) => sum + item.amount, 0);
  const sumTx = (rows: Transaction[], status?: Transaction["status"]) => rows.reduce((sum, item) => sum + (status && item.status !== status ? 0 : item.amount), 0);
  const plannedIncome = total(groups.income);
  const plannedExpense = total(groups.fixed) + sumTx(transactionExpenses);
  const paidExpense = sumTx(transactionExpenses, "paid") + groups.fixed.filter((item) => paidBillIds.has(item.id)).reduce((sum, item) => sum + item.amount, 0);
  const paidIncome = sumTx(transactionIncome, "paid") + groups.income.filter((item) => receivedIncomeIds.has(item.id)).reduce((sum, item) => sum + item.amount, 0);
  const overdueItems = groups.fixed.filter((item) => !paidBillIds.has(item.id) && pendingBillIds.has(item.id) && getBudgetPaymentStatus(item, monthKey, paidBillIds).value === "overdue");
  const overdueExpense = overdueItems.reduce((sum, item) => sum + item.amount, 0);
  const pendingExpense = Math.max(plannedExpense - paidExpense, 0);
  const projectedBalance = plannedIncome - plannedExpense;
  const realizedBalance = paidIncome - paidExpense;

  async function deleteItem(item: Budget) {
    if (!window.confirm(`Remover "${item.description}"? Lançamentos vinculados também serão removidos.`)) return;
    try {
      await remove(item.id);
      await Promise.all([tx.reload(), loadBills()]);
      onDone("Item removido");
    } catch {
      onDone("Não foi possível remover o item. Tente novamente.", "error");
    }
  }

  async function toggleBill(item: Budget) {
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
      onDone(payload.kind === "income" ? "Receita prevista salva com sucesso." : "Conta fixa salva com sucesso.");
    } catch {
      onDone("Não foi possível salvar o item. Tente novamente.", "error");
    }
  }

  if (loading || tx.loading || billsLoading) return <div className="cf-card">Carregando fluxo de caixa...</div>;
  return (
    <div className="cf-grid">
      <SectionHeader
        title="Resumo do mês"
        description="Previsto é o que foi cadastrado para o mês. Realizado é o que já foi lançado, pago ou recebido."
      />
      <div className="cf-grid cf-kpis">
        <CashFlowKpi title="Receitas previstas" value={plannedIncome} tone="income" icon={<TrendingUp size={19} />} detail={`${groups.income.length} registros`} />
        <CashFlowKpi title="Receitas recebidas" value={paidIncome} tone="income" icon={<CheckCircle2 size={19} />} detail="Receitas já realizadas" />
        <CashFlowKpi title="Contas pendentes" value={pendingExpense} tone="expense" icon={<Clock3 size={19} />} detail="Saídas em aberto" />
        <CashFlowKpi title="Saldo previsto" value={projectedBalance} tone={projectedBalance >= 0 ? "income" : "expense"} icon={<Wallet size={19} />} detail={`Realizado: ${formatCurrency(realizedBalance)}`} />
      </div>

      <Card title="Dashboard do fluxo" meta={<StatusLegend />}>
        <div className="cf-cashflow-dashboard">
          <StatusMetric label="Pago" value={paidExpense} helper="Saídas realizadas no mês" tone="paid" />
          <StatusMetric label="Pendente" value={pendingExpense} helper="Saídas ainda em aberto" tone="pending" />
          <StatusMetric label="Atrasado" value={overdueExpense} helper="Vencimentos em atraso" tone="overdue" />
          <StatusMetric label="Recebido" value={paidIncome} helper="Receitas realizadas" tone="income" />
        </div>
      </Card>

      <div className="cf-grid cf-two">
        <CashFlowSection title="Contas fixas" description="Compromissos recorrentes com vencimento no mês." count={groups.fixed.length}>
          {!groups.fixed.length && <EmptyState message="Nenhuma conta fixa cadastrada para este mês." />}
          {groups.fixed.map((item) => (
            <CashFlowBudgetRow
              key={item.id}
              item={item}
              monthKey={monthKey}
              status={getBudgetPaymentStatus(item, monthKey, paidBillIds)}
              onEdit={() => setEditing(item)}
              onDelete={() => deleteItem(item)}
              onTogglePaid={() => toggleBill(item)}
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
              status={receivedIncomeIds.has(item.id) ? { value: "received", label: "Recebido", detail: "Receita realizada" } : { value: "planned", label: "Previsto", detail: "Receita prevista" }}
              onEdit={() => setEditing(item)}
              onDelete={() => deleteItem(item)}
              onTogglePaid={() => toggleIncome(item)}
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
            <button type="button" onClick={() => { setNewBudgetKind("income"); setNewBudgetHasDueDate(false); setNewBudgetTitle("Nova receita prevista"); setEditing(null); setFabOpen(false); }}>
              <span>Nova receita prevista</span>
              <InfoTooltip text="Use para salário, aluguel recebido ou outra receita esperada no mês." />
            </button>
            <button type="button" onClick={() => { setNewBudgetKind("expense"); setNewBudgetHasDueDate(true); setNewBudgetTitle("Nova conta fixa"); setEditing(null); setFabOpen(false); }}>
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
      {editing !== undefined && <BudgetFormModal userId={userId} monthKey={monthKey} initial={editing} defaultKind={newBudgetKind} defaultBudgetType="fixed" defaultHasDueDate={newBudgetHasDueDate} title={editing ? undefined : newBudgetTitle} categories={categories} onClose={() => setEditing(undefined)} onSave={handleSave} />}
      {transactionEditing !== undefined && (
        <TransactionFormModal
          userId={userId}
          monthKey={monthKey}
          categories={categories}
          initial={transactionEditing}
          onClose={() => setTransactionEditing(undefined)}
          onSave={async (payload, id) => {
            await tx.save(payload, id);
            await loadBills();
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

function getBudgetPaymentStatus(item: Budget, monthKey: string, paidBillIds: Set<string>): PaymentStatus {
  if (paidBillIds.has(item.id)) return { value: "paid", label: "Pago", detail: "Pagamento confirmado" };
  if (!item.has_due_date || !item.due_day) return { value: "planned", label: "Previsto", detail: item.kind === "income" ? "Receita prevista" : "Sem vencimento" };

  const dueDate = dueDateFor(monthKey, item.due_day);
  if (dueDate && dueDate.getTime() < Date.now()) return { value: "overdue", label: "Atrasado", detail: `Venceu em ${formatDateFromDate(dueDate)}` };
  return { value: "pending", label: "Pendente", detail: dueDate ? `Vence em ${formatDateFromDate(dueDate)}` : "Aguardando pagamento" };
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
        <span>{title}</span>
        {icon}
      </div>
      <div className="cf-kpi-val"><Money value={value} size="md" tone={tone} /></div>
      <span className="cf-row-sub">{detail}</span>
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

function StatusLegend() {
  return (
    <div className="cf-status-legend">
      <StatusBadge status="paid" />
      <StatusBadge status="pending" />
      <StatusBadge status="overdue" />
    </div>
  );
}

function StatusMetric({ label, value, helper, tone }: { label: string; value: number; helper: string; tone: "paid" | "pending" | "overdue" | "income" }) {
  return (
    <div className={`cf-status-metric ${tone}`}>
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
      <small>{helper}</small>
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
  onTogglePaid
}: {
  item: Budget;
  monthKey: string;
  status: PaymentStatus;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePaid?: () => void;
}) {
  const dueDate = item.has_due_date ? dueDateFor(monthKey, item.due_day) : null;
  const canToggle = onTogglePaid && (
    (item.kind === "expense" && item.budget_type === "fixed" && item.has_due_date) ||
    item.kind === "income"
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
          <div className="cf-row-title">{item.description}</div>
          <div className="cf-row-sub">
            {item.category_name ?? "Sem categoria"} - {item.budget_type === "fixed" ? "Fixo" : "Variável"}
            {dueDate ? ` - venc. ${formatDateFromDate(dueDate)}` : ""}
          </div>
          <div className="cf-row-sub">{status.detail}</div>
        </div>
      </div>
      <div className="cf-cashflow-actions">
        <StatusBadge status={status.value} label={status.label} />
        <Money value={item.amount} size="sm" tone={item.kind === "income" ? "income" : "expense"} />
        {canToggle && (
          <Button square icon={status.value === "paid" ? <Clock3 size={16} /> : <CheckCircle2 size={16} />} onClick={onTogglePaid} aria-label={item.kind === "income" ? (status.value === "paid" ? "Voltar para previsto" : "Marcar como recebido") : (status.value === "paid" ? "Voltar para pendente" : "Marcar como pago")} />
        )}
        <RowActionsMenu onEdit={onEdit} onDelete={onDelete} deleteLabel="Remover" />
      </div>
    </div>
  );
}

function CashFlowTransactionRow({ item }: { item: Transaction }) {
  const isOverdue = item.status === "pending" && new Date(`${item.transaction_date}T23:59:59`).getTime() < Date.now();
  const status: PaymentStatus = item.status === "paid"
    ? item.kind === "income"
      ? { value: "received", label: "Recebido", detail: "Receita realizada" }
      : { value: "paid", label: "Pago", detail: "Lançamento realizado" }
    : isOverdue
      ? { value: "overdue", label: "Atrasado", detail: "Lançamento pendente com data vencida" }
      : { value: "pending", label: "Pendente", detail: "Lançamento em aberto" };

  return (
    <div className={`cf-row cf-row-${item.kind} cf-cashflow-row`}>
      <div className="cf-row-main">
        <div className={`cf-dot cf-dot-${status.value}`}>
          {status.value === "paid" && <CheckCircle2 size={17} />}
          {status.value === "received" && <CheckCircle2 size={17} />}
          {status.value === "overdue" && <AlertTriangle size={17} />}
          {status.value === "pending" && <Clock3 size={17} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="cf-row-title">{item.title}</div>
          <div className="cf-row-sub">{formatDate(item.transaction_date)} - {item.category_name ?? "Sem categoria"} - lançamento avulso</div>
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



