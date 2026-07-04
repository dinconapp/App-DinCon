"use client";

import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { KpiCard } from "./KpiCard";
import { FixedExpensesPanel } from "./FixedExpensesPanel";
import { VariableExpensesPanel } from "./VariableExpensesPanel";
import { IncomePanel } from "./IncomePanel";
import { BillsPanel } from "./BillsPanel";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function DashboardPage({ userId, monthKey }: { userId: string; monthKey: string }) {
  const { data, loading, error } = useDashboard(userId, monthKey);
  if (loading) return <div className="cf-card">Carregando dashboard...</div>;
  if (error || !data) return <div className="cf-card">{error ?? "Dashboard indisponível."}</div>;

  return (
    <div className="cf-grid">
      <SectionHeader title="Resumo financeiro" description="Realizado é o que já foi lançado no mês. Previsto é o que está cadastrado no fluxo. Projetado é uma estimativa." />
      <div className="cf-grid cf-kpis">
        <KpiCard label="Entradas realizadas" value={data.total_income} icon={TrendingUp} accent="#34E0A1" meta={data.is_projected ? "previsto" : "realizado"} tone="income" />
        <KpiCard label="Gastos realizados" value={data.total_expense} icon={TrendingDown} accent="#FF6B7A" meta={data.is_projected ? "previsto" : "realizado"} tone="expense" />
        <KpiCard label="Economia" value={data.economy} icon={PiggyBank} accent="#F4C25A" meta={`${data.saving_rate.toFixed(1)}% de taxa`} />
        <KpiCard label="Saldo acumulado" value={data.accumulated_balance} icon={Wallet} accent="#9D8BFF" meta={data.month_label} />
      </div>
      <div className="cf-grid cf-three">
        <IncomePanel items={data.incomes} />
        <FixedExpensesPanel items={data.fixed_expenses} />
        <VariableExpensesPanel items={data.variable_expenses} />
      </div>
      <div className="cf-grid cf-two">
        <BillsPanel pending={data.pending_bills} paid={data.paid_bills} />
        <CategoryDonutChart data={data.expenses_by_category} />
      </div>
    </div>
  );
}
