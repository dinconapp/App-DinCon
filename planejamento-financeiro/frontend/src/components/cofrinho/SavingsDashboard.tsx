"use client";

import { Landmark, PiggyBank, Plus, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { useSavings } from "@/hooks/useSavings";
import type { SavingsInvestment } from "@/types/savings";
import { SavingsDistributionChart } from "./SavingsDistributionChart";
import { SavingsEmptyState } from "./SavingsEmptyState";
import { SavingsInvestmentFormModal } from "./SavingsInvestmentFormModal";
import { SavingsInvestmentList } from "./SavingsInvestmentList";
import { SavingsKpiCard } from "./SavingsKpiCard";
import { SavingsProjectionChart } from "./SavingsProjectionChart";

export function SavingsDashboard({ userId, actionToken, onDone }: { userId: string; actionToken: number; onDone: (message: string) => void }) {
  const { data, loading, error, save, remove } = useSavings(userId, 12);
  const [editing, setEditing] = useState<SavingsInvestment | null | undefined>(undefined);

  useEffect(() => {
    if (actionToken > 0) setEditing(null);
  }, [actionToken]);

  const fab = (
    <button className="cf-fab" type="button" onClick={() => setEditing(null)} aria-label="Novo investimento">
      <Plus size={30} strokeWidth={2.6} />
    </button>
  );

  const modal = editing !== undefined && (
    <SavingsInvestmentFormModal
      userId={userId}
      initial={editing}
      onClose={() => setEditing(undefined)}
      onSave={async (payload, id) => {
        await save(payload, id);
        onDone("Investimento salvo");
      }}
    />
  );

  if (loading) return <><div className="cf-card">Carregando Cofrinho...</div>{fab}{modal}</>;
  if (error || !data) return <><div className="cf-card">{error ?? "Cofrinho indisponível."}</div>{fab}{modal}</>;

  return (
    <div className="cf-grid">
      <div className="cf-grid cf-kpis">
        <SavingsKpiCard label="Total investido" value={data.total_invested_now} icon={Wallet} />
        <SavingsKpiCard label="Aporte mensal" value={data.total_monthly_contribution} icon={Plus} />
        <SavingsKpiCard label="Saldo projetado" value={data.projected_balance} icon={PiggyBank} meta="12 meses" />
        <SavingsKpiCard label="Rendimento projetado" value={data.projected_interest} icon={TrendingUp} />
      </div>

      {data.investments.length === 0 ? (
        <SavingsEmptyState />
      ) : (
        <>
          <div className="cf-grid cf-two">
            <SavingsProjectionChart data={data.projection} />
            <SavingsDistributionChart investments={data.investments} projection={data.projection} />
          </div>
          <div className="cf-grid cf-two">
            <SavingsInvestmentList items={data.investments} onEdit={setEditing} onDelete={async (item) => { await remove(item); onDone("Investimento removido"); }} />
            <Card title="Resumo de rendimento" meta={<Landmark size={18} />}>
              <div className="cf-row">
                <div>
                  <div className="cf-row-title">Melhor projeção</div>
                  <div className="cf-row-sub">{data.best_projection?.name ?? "Sem investimento"}</div>
                </div>
                <Money value={data.best_projection?.projected_balance ?? 0} size="sm" />
              </div>
              <div className="cf-row">
                <div>
                  <div className="cf-row-title">Investimentos ativos</div>
                  <div className="cf-row-sub">Quantidade cadastrada</div>
                </div>
                <strong>{data.investments_count}</strong>
              </div>
              <div className="cf-row">
                <div>
                  <div className="cf-row-title">Rendimento projetado</div>
                  <div className="cf-row-sub">Acumulado no periodo</div>
                </div>
                <Money value={data.projected_interest} size="sm" />
              </div>
            </Card>
          </div>
        </>
      )}

      {fab}
      {modal}
    </div>
  );
}
