"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import type { Budget, BudgetPayload } from "@/types/budget";
import type { Category } from "@/types/category";

const daysOfMonth = Array.from({ length: 31 }, (_, index) => index + 1);

export function BudgetFormModal({
  userId,
  monthKey,
  initial,
  defaultKind = "expense",
  defaultBudgetType = "fixed",
  defaultHasDueDate,
  title,
  categories,
  onClose,
  onSave
}: {
  userId: string;
  monthKey: string;
  initial?: Budget | null;
  defaultKind?: BudgetPayload["kind"];
  defaultBudgetType?: BudgetPayload["budget_type"];
  defaultHasDueDate?: boolean;
  title?: string;
  categories: Category[];
  onClose: () => void;
  onSave: (payload: BudgetPayload, id?: string) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<BudgetPayload>({
    user_id: userId,
    description: initial?.description ?? "",
    kind: initial?.kind ?? defaultKind,
    category_id: initial?.category_id ?? "",
    category_name: initial?.category_name ?? "",
    budget_type: initial?.budget_type ?? defaultBudgetType,
    amount: initial?.amount ?? 0,
    start_month: initial?.start_month ?? monthKey,
    end_month: initial?.end_month ?? null,
    has_due_date: initial?.has_due_date ?? defaultHasDueDate ?? false,
    due_day: initial?.due_day ?? (defaultHasDueDate ? 1 : null)
  });
  const availableCategories = useMemo(() => categories.filter((category) => category.type === form.kind), [categories, form.kind]);
  const categorySelectValue = form.category_name?.trim() ? "__new__" : (form.category_id ?? "");
  const isRecurringFixedItem = form.budget_type === "fixed";
  const budgetName = getBudgetName(form.kind, form.budget_type);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const categoryName = form.category_name?.trim() || "";
    const categoryId = categoryName ? null : (form.category_id || null);
    if (!categoryId && !categoryName) {
      setError("Selecione ou cadastre uma categoria.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSave(
        {
          ...form,
          category_id: categoryId,
          category_name: categoryName || null,
          end_month: isRecurringFixedItem ? null : form.end_month,
          due_day: form.has_due_date ? form.due_day : null
        },
        initial?.id
      );
      onClose();
    } catch {
      setError("Nao foi possivel salvar a previsao. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title ?? (initial ? `Editar ${budgetName}` : `Nova ${budgetName}`)} onClose={onClose}>
      <form className="cf-form" onSubmit={submit}>
        <label>{form.kind === "income" ? "Nome da receita" : "Nome da despesa"}<input className="cf-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
        <div className="cf-grid cf-two">
          <label>Tipo<select className="cf-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as BudgetPayload["kind"], category_id: "", category_name: "", end_month: form.budget_type === "fixed" ? null : form.end_month })}><option value="expense">Despesa</option><option value="income">Receita</option></select></label>
          <label>Recorrencia<select className="cf-select" value={form.budget_type} onChange={(e) => setForm({ ...form, budget_type: e.target.value as BudgetPayload["budget_type"], end_month: e.target.value === "fixed" ? null : form.end_month })}><option value="fixed">Fixa</option><option value="variable">Variavel</option></select></label>
        </div>
        <label>Categoria
          <select
            className="cf-select"
            value={categorySelectValue}
            onChange={(e) => setForm({
              ...form,
              category_id: e.target.value === "__new__" ? "" : e.target.value,
              category_name: e.target.value === "__new__" ? form.category_name : ""
            })}
          >
            <option value="">Selecione</option>
            {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            <option value="__new__">Adicionar nova categoria</option>
          </select>
          {categorySelectValue === "__new__" && (
            <input
              className="cf-input"
              value={form.category_name ?? ""}
              onChange={(e) => setForm({ ...form, category_name: e.target.value, category_id: "" })}
              placeholder="Digite o nome da categoria"
            />
          )}
        </label>
        <div className="cf-grid cf-three">
          <label>{form.kind === "income" ? "Valor previsto" : "Valor da despesa"}<CurrencyInput value={form.amount} onChange={(amount) => setForm({ ...form, amount })} required /></label>
          <label>Comeca em<input className="cf-input" type="month" value={form.start_month ?? ""} onChange={(e) => setForm({ ...form, start_month: e.target.value || null })} /></label>
          <label>Termina em<input className="cf-input" type="month" value={isRecurringFixedItem ? "" : form.end_month ?? ""} onChange={(e) => setForm({ ...form, end_month: e.target.value || null })} disabled={isRecurringFixedItem} /></label>
        </div>
        {isRecurringFixedItem && <div className="cf-help-text">{form.kind === "income" ? "Receita fixa sem data final." : "Despesa fixa sem data final."}</div>}
        <label><span><input type="checkbox" checked={form.has_due_date} onChange={(e) => setForm({ ...form, has_due_date: e.target.checked, due_day: e.target.checked ? form.due_day ?? 1 : null })} /> Tem vencimento</span></label>
        {form.has_due_date && (
          <label>{form.kind === "income" ? "Dia previsto para receber" : "Dia de vencimento"}
            <select className="cf-select" value={form.due_day ?? 1} onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })} required>
              {daysOfMonth.map((day) => <option key={day} value={day}>{String(day).padStart(2, "0")}</option>)}
            </select>
          </label>
        )}
        {error && <div className="cf-auth-error">{error}</div>}
        <Button variant="primary" type="submit" disabled={submitting}>{form.kind === "income" ? (form.budget_type === "fixed" ? "Salvar receita prevista" : "Salvar receita programada") : (form.budget_type === "fixed" ? "Salvar conta fixa" : "Salvar despesa programada")}</Button>
      </form>
    </Modal>
  );
}

function getBudgetName(kind: BudgetPayload["kind"], budgetType: BudgetPayload["budget_type"]) {
  if (kind === "income") {
    return budgetType === "fixed" ? "receita prevista" : "receita programada";
  }

  return budgetType === "fixed" ? "conta fixa" : "despesa programada";
}
