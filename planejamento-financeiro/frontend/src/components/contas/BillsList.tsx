"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getBills, payBill, unpayBill, type Bill } from "@/services/billService";
import { BillRow } from "./BillRow";

export function BillsPage({ userId, monthKey, onDone }: { userId: string; monthKey: string; onDone: (message: string) => void }) {
  const [pending, setPending] = useState<Bill[]>([]);
  const [paid, setPaid] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getBills(userId, monthKey);
      setPending(data.pending);
      setPaid(data.paid);
    } catch {
      setPending([]);
      setPaid([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [userId, monthKey]);

  async function toggle(item: Bill) {
    if (item.paid) {
      await unpayBill(userId, monthKey, item.budget_id);
      onDone("Conta voltou para pendente.");
    } else {
      await payBill(userId, monthKey, item.budget_id);
      onDone("Conta marcada como paga.");
    }
    await load();
  }

  if (loading) return <div className="cf-card">Carregando contas...</div>;
  return (
    <div className="cf-grid">
      <SectionHeader title="Contas do mês" description="Acompanhe contas fixas pendentes, pagas e atrasadas." />
      <div className="cf-grid cf-two">
      <Card title="Contas a pagar">
        {!pending.length && <EmptyState message="Nenhuma conta pendente neste mês." />}
        {pending.map((item) => <BillRow key={item.budget_id} item={item} onToggle={() => toggle(item)} />)}
      </Card>
      <Card title="Contas pagas">
        {!paid.length && <EmptyState message="Nenhuma conta paga neste mês." />}
        {paid.map((item) => <BillRow key={item.budget_id} item={item} onToggle={() => toggle(item)} />)}
      </Card>
      </div>
    </div>
  );
}
