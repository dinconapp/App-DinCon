import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import type { DashboardLine } from "@/types/dashboard";

export function BillsPanel({ pending, paid }: { pending: DashboardLine[]; paid: DashboardLine[] }) {
  const rows = [...pending, ...paid];
  return (
    <Card title="Contas do mês">
      {!rows.length && <EmptyState message="Nenhuma conta com vencimento." />}
      {rows.map((item) => (
        <div className="cf-row" key={item.id}>
          <div>
            <div className="cf-row-title">{item.description}</div>
            <div className="cf-row-sub">{item.paid ? "Paga" : `Vence dia ${item.due_day ?? "-"}`}</div>
          </div>
          <Money value={item.amount} size="sm" />
        </div>
      ))}
    </Card>
  );
}
