"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DateInput } from "@/components/ui/DateInput";
import { Modal } from "@/components/ui/Modal";
import type { Category } from "@/types/category";
import type { Transaction, TransactionPayload } from "@/types/transaction";

export function TransactionFormModal({ userId, monthKey, categories, initial, onClose, onSave }: { userId: string; monthKey: string; categories: Category[]; initial?: Transaction | null; onClose: () => void; onSave: (payload: TransactionPayload, id?: string) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TransactionPayload>({
    user_id: userId,
    budget_id: initial?.budget_id ?? null,
    category_id: initial?.category_id ?? "",
    kind: initial?.kind ?? "expense",
    title: initial?.title ?? "",
    amount: initial?.amount ?? 0,
    transaction_date: initial?.transaction_date ?? `${monthKey}-15`,
    status: initial?.status ?? "paid"
  });
  const availableCategories = useMemo(() => categories.filter((category) => category.type === form.kind), [categories, form.kind]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const categoryId = form.kind === "income" ? form.category_id || null : form.category_id || availableCategories[0]?.id;
    setSubmitting(true);
    setError("");
    try {
      await onSave({ ...form, category_id: categoryId }, initial?.id);
      onClose();
    } catch {
      setError("Não foi possível salvar o lançamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={initial ? "Editar lançamento" : "Novo lançamento"} onClose={onClose}>
      <form className="cf-form" onSubmit={submit}>
        <label>Descrição<input className="cf-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
        <div className="cf-grid cf-two">
          <label>Tipo<select className="cf-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as TransactionPayload["kind"], category_id: "" })}><option value="expense">Gasto</option><option value="income">Entrada</option></select></label>
          <label>Status<select className="cf-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TransactionPayload["status"] })}><option value="paid">Pago</option><option value="pending">Pendente</option><option value="canceled">Cancelado</option></select></label>
        </div>
        <label>Categoria<select className="cf-select" value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} required={form.kind === "expense"}><option value="">{form.kind === "income" ? "Sem categoria" : "Selecione"}</option>{availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <div className="cf-grid cf-two">
          <label>Valor<CurrencyInput value={form.amount} onChange={(amount) => setForm({ ...form, amount })} required /></label>
          <label>Data<DateInput value={form.transaction_date} onChange={(transaction_date) => setForm({ ...form, transaction_date })} required /></label>
        </div>
        {error && <div className="cf-auth-error">{error}</div>}
        <Button variant="primary" type="submit" disabled={submitting}>Salvar</Button>
      </form>
    </Modal>
  );
}
