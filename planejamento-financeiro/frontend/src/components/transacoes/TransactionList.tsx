"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/types/transaction";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionFormModal } from "./TransactionFormModal";
import { TransactionRow } from "./TransactionRow";

export function TransactionsPage({ userId, monthKey, actionToken, onDone }: { userId: string; monthKey: string; actionToken: number; onDone: (message: string, tone?: "success" | "error") => void }) {
  const tx = useTransactions(userId, monthKey);
  const { items: categories, reload: reloadCategories } = useCategories();
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined);

  useEffect(() => {
    if (actionToken) setEditing(null);
  }, [actionToken]);

  async function remove(item: Transaction) {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    try {
      await tx.remove(item.id);
      onDone("LanÃ§amento removido com sucesso.");
    } catch {
      onDone("NÃ£o foi possÃ­vel remover o lanÃ§amento. Tente novamente.", "error");
    }
  }
  const filteredBalance = tx.totals.total_income - tx.totals.total_expense;

  return (
    <div className="cf-grid">
      <SectionHeader title="LanÃ§amentos do mÃªs" description="Consulte entradas, gastos, status e origem dos lanÃ§amentos registrados no perÃ­odo." />
      <TransactionFilters categories={categories} filters={tx.filters} onChange={tx.setFilters} />
      <div className="cf-grid cf-three">
        <Card title="Entradas filtradas"><Money value={tx.totals.total_income} tone="income" /></Card>
        <Card title="Gastos filtrados"><Money value={tx.totals.total_expense} tone="expense" /></Card>
        <Card title="Saldo filtrado"><Money value={filteredBalance} tone={filteredBalance >= 0 ? "income" : "expense"} /></Card>
      </div>
      <Card title="LanÃ§amentos">
        {tx.loading && <div>Carregando...</div>}
        {!tx.loading && !tx.items.length && <EmptyState message="Nenhum lanÃ§amento encontrado com os filtros atuais." />}
        {tx.items.map((item) => <TransactionRow key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => remove(item)} />)}
      </Card>
      <button className="cf-fab" type="button" onClick={() => setEditing(null)} aria-label="Novo lanÃ§amento">
        <Plus size={30} strokeWidth={2.6} />
      </button>
      {editing !== undefined && <TransactionFormModal userId={userId} monthKey={monthKey} categories={categories} initial={editing} onClose={() => setEditing(undefined)} onSave={async (payload, id) => { await tx.save(payload, id); await reloadCategories(); onDone("LanÃ§amento salvo com sucesso."); }} />}
    </div>
  );
}
