"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import type { SavingsInvestment, SavingsInvestmentPayload } from "@/types/savings";

export function SavingsInvestmentFormModal({
  userId,
  initial,
  onClose,
  onSave,
}: {
  userId: string;
  initial?: SavingsInvestment | null;
  onClose: () => void;
  onSave: (payload: SavingsInvestmentPayload, id?: string) => Promise<void>;
}) {
  const todayMonth = new Date().toISOString().slice(0, 7);
  const [noEndDate, setNoEndDate] = useState(!initial?.end_month);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SavingsInvestmentPayload>({
    user_id: userId,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    initial_amount: initial?.initial_amount ?? 0,
    monthly_contribution: initial?.monthly_contribution ?? 0,
    interest_type: initial?.interest_type ?? "compound",
    interest_rate: initial?.interest_rate ?? 0,
    interest_period: initial?.interest_period ?? "monthly",
    start_month: initial?.start_month ?? todayMonth,
    end_month: initial?.end_month ?? null,
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const endMonth = noEndDate ? null : form.end_month;
    if (!form.name.trim()) return setError("Informe o nome do investimento.");
    if (endMonth && endMonth < form.start_month) return setError("Mês final não pode ser menor que o mês inicial.");
    await onSave({ ...form, name: form.name.trim(), description: form.description?.trim() || null, end_month: endMonth }, initial?.id);
    onClose();
  }

  return (
    <Modal title={initial ? "Editar investimento" : "Novo investimento"} onClose={onClose}>
      <form className="cf-form" onSubmit={submit}>
        <label>Nome do investimento<input className="cf-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Descrição<input className="cf-input" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="cf-grid cf-two">
          <label>Valor inicial<CurrencyInput value={form.initial_amount} onChange={(initial_amount) => setForm({ ...form, initial_amount })} required /></label>
          <label>Aporte mensal<CurrencyInput value={form.monthly_contribution} onChange={(monthly_contribution) => setForm({ ...form, monthly_contribution })} /></label>
        </div>
        <div className="cf-grid cf-three">
          <label>Tipo de rendimento<select className="cf-select" value={form.interest_type} onChange={(e) => setForm({ ...form, interest_type: e.target.value as SavingsInvestmentPayload["interest_type"] })}><option value="none">Sem rendimento</option><option value="simple">Juros simples</option><option value="compound">Juros compostos</option></select></label>
          <label>Percentual de rendimento<input className="cf-input" type="number" min="0" step="0.0001" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: Number(e.target.value) })} /></label>
          <label>Período do rendimento<select className="cf-select" value={form.interest_period} onChange={(e) => setForm({ ...form, interest_period: e.target.value as SavingsInvestmentPayload["interest_period"] })}><option value="monthly">Mensal</option><option value="yearly">Anual</option></select></label>
        </div>
        <div className="cf-grid cf-two">
          <label>Mês de início<input className="cf-input" type="month" value={form.start_month} onChange={(e) => setForm({ ...form, start_month: e.target.value })} required /></label>
          <label>Mês de término<input className="cf-input" type="month" value={form.end_month ?? ""} disabled={noEndDate} onChange={(e) => setForm({ ...form, end_month: e.target.value || null })} /></label>
        </div>
        <label><span><input type="checkbox" checked={noEndDate} onChange={(e) => setNoEndDate(e.target.checked)} /> Sem data de término</span></label>
        {error && <div className="cf-auth-error">{error}</div>}
        <Button variant="primary" type="submit">Salvar investimento</Button>
      </form>
    </Modal>
  );
}
