"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DateInput } from "@/components/ui/DateInput";
import { Modal } from "@/components/ui/Modal";
import type { Category } from "@/types/category";
import type { Transaction, TransactionPayload } from "@/types/transaction";

const NEW_CATEGORY_VALUE = "__new__";

export function TransactionFormModal({ userId, monthKey, categories, initial, onClose, onSave }: { userId: string; monthKey: string; categories: Category[]; initial?: Transaction | null; onClose: () => void; onSave: (payload: TransactionPayload, id?: string) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const categoryInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<TransactionPayload>({
    user_id: userId,
    budget_id: initial?.budget_id ?? null,
    category_id: initial?.category_id ?? "",
    category_name: initial?.category_name ?? "",
    kind: initial?.kind ?? "expense",
    title: initial?.title ?? "",
    amount: initial?.amount ?? 0,
    transaction_date: initial?.transaction_date ?? `${monthKey}-15`,
    status: initial?.status ?? "paid"
  });
  const availableCategories = useMemo(() => categories.filter((category) => category.type === form.kind), [categories, form.kind]);
  const isNewCategory = form.category_name?.trim().length ? true : false;
  const categorySelectValue = isNewCategory ? NEW_CATEGORY_VALUE : (form.category_id ?? "");

  useEffect(() => {
    if (categorySelectValue === NEW_CATEGORY_VALUE) {
      categoryInputRef.current?.focus();
    }
  }, [categorySelectValue]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const categoryName = form.category_name?.trim() || "";
    const categoryId = categoryName ? null : (form.category_id || null);
    if (form.kind === "expense" && !categoryId && !categoryName) {
      setError("Selecione ou cadastre uma categoria para o gasto.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSave({ ...form, category_id: categoryId, category_name: categoryName || null }, initial?.id);
      onClose();
    } catch {
      setError("Nao foi possivel salvar o lancamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={initial ? "Editar lancamento" : "Novo lancamento"} onClose={onClose}>
      <form className="cf-form" onSubmit={submit}>
        <label>Descricao<input className="cf-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
        <div className="cf-grid cf-two">
          <label>Tipo<select className="cf-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as TransactionPayload["kind"], category_id: "", category_name: "" })}><option value="expense">Gasto</option><option value="income">Entrada</option></select></label>
          <label>Status<select className="cf-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TransactionPayload["status"] })}><option value="paid">Pago</option><option value="pending">Pendente</option><option value="canceled">Cancelado</option></select></label>
        </div>
        <label>Categoria
          <select
            className="cf-select"
            value={categorySelectValue}
            onChange={(e) => setForm({
              ...form,
              category_id: e.target.value === NEW_CATEGORY_VALUE ? "" : e.target.value,
              category_name: e.target.value === NEW_CATEGORY_VALUE ? (form.category_name ?? "") : ""
            })}
          >
            <option value="">{form.kind === "income" ? "Sem categoria" : "Selecione"}</option>
            {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            <option value={NEW_CATEGORY_VALUE}>Adicionar nova categoria</option>
          </select>
          {categorySelectValue === NEW_CATEGORY_VALUE && (
            <input
              ref={categoryInputRef}
              className="cf-input"
              value={form.category_name ?? ""}
              onChange={(e) => setForm({ ...form, category_name: e.target.value, category_id: "" })}
              placeholder="Digite o nome da categoria"
            />
          )}
        </label>
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
