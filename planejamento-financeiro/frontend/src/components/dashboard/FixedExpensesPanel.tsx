import type { CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import type { DashboardLine } from "@/types/dashboard";

export function FixedExpensesPanel({ items }: { items: DashboardLine[] }) {
  return (
    <Card title="Gastos fixos">
      {!items.length && <EmptyState message="Nenhum gasto fixo cadastrado." />}
      {items.map((item) => {
        const percent = item.amount > 0 ? Math.min(100, ((item.realized ?? 0) / item.amount) * 100) : 0;
        return (
          <div className="cf-row cf-row-expense" key={item.id}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="cf-row-title">{item.description}</div>
              <div className="cf-row-sub">{item.category}</div>
              <div className="cf-progress" style={{ "--c": item.color ?? "#34E0A1" } as CSSProperties}><span style={{ width: `${percent}%` }} /></div>
            </div>
            <Money value={item.amount} size="sm" tone="expense" />
          </div>
        );
      })}
    </Card>
  );
}
