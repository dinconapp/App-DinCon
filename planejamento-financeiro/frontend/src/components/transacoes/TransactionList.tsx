"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { isLooseTransaction } from "@/utils/financial-classification";
import type { Transaction } from "@/types/transaction";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionFormModal } from "./TransactionFormModal";
import { TransactionRow } from "./TransactionRow";

export function TransactionsPage({ userId, monthKey, actionToken, onDone }: { userId: string; monthKey: string; actionToken: number; onDone: (message: string, tone?: "success" | "error") => void }) {
  const tx = useTransactions(userId, monthKey);
  const { items: categories, reload: reloadCategories } = useCategories();
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined);
  const visibleItems = useMemo(() => tx.items.filter(isLooseTransaction), [tx.items]);
  const visibleTotals = useMemo(() => visibleItems.reduce((acc, item) => {
    if (item.kind === "income") {
      acc.total_income += item.amount;
    } else {
      acc.total_expense += item.amount;
    }
    return acc;
  }, { total_income: 0, total_expense: 0 }), [visibleItems]);

  useEffect(() => {
    if (actionToken) setEditing(null);
  }, [actionToken]);

  async function remove(item: Transaction) {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    try {
      await tx.remove(item.id);
      onDone("Lançamento removido com sucesso.");
    } catch {
      onDone("Não foi possível remover o lançamento. Tente novamente.", "error");
    }
  }
  const filteredBalance = visibleTotals.total_income - visibleTotals.total_expense;

  return (
    <div className="cf-grid">
      <SectionHeader title="Lançamentos do mês" description="Consulte entradas, gastos, status e origem dos lançamentos registrados no período." />
      <TransactionFilters categories={categories} filters={tx.filters} onChange={tx.setFilters} />
      <div className="cf-grid cf-three">
        <Card title="Entradas filtradas"><Money value={visibleTotals.total_income} tone="income" /></Card>
        <Card title="Gastos filtrados"><Money value={visibleTotals.total_expense} tone="expense" /></Card>
        <Card title="Saldo filtrado"><Money value={filteredBalance} tone={filteredBalance >= 0 ? "income" : "expense"} /></Card>
      </div>
      <Card title="Lançamentos">
        {tx.loading && <div>Carregando...</div>}
        {!tx.loading && !visibleItems.length && <EmptyState message="Nenhum lançamento encontrado com os filtros atuais." />}
        {visibleItems.map((item) => <TransactionRow key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => remove(item)} />)}
      </Card>
      <button className="cf-fab" type="button" onClick={() => setEditing(null)} aria-label="Novo lançamento">
        <Plus size={30} strokeWidth={2.6} />
      </button>
      {editing !== undefined && <TransactionFormModal userId={userId} monthKey={monthKey} categories={categories} initial={editing} onClose={() => setEditing(undefined)} onSave={async (payload, id) => { await tx.save(payload, id); await reloadCategories(); onDone("Lançamento salvo com sucesso."); }} />}
    </div>
  );
}
