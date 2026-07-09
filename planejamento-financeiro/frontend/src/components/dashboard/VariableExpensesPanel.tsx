import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import type { DashboardLine } from "@/types/dashboard";

export function VariableExpensesPanel({ items }: { items: DashboardLine[] }) {
  const seen = new Set<string>();
  const visibleItems = items.filter((item) => {
    const key = item.source_type && item.source_id ? `${item.source_type}:${item.source_id}` : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <Card title="Gastos variaveis">
      {!visibleItems.length && <EmptyState message="Nenhuma meta variavel cadastrada." />}
      {visibleItems.map((item) => {
        const value = item.source_type === "transaction" ? item.realized ?? item.amount : item.amount;
        return (
          <div className="cf-row cf-row-expense" key={item.source_type && item.source_id ? `${item.source_type}:${item.source_id}` : item.id}>
            <div>
              <div className="cf-row-title">{item.description}</div>
              <div className="cf-row-sub">{item.category}</div>
            </div>
            <Money value={value} size="sm" tone="expense" />
          </div>
        );
      })}
    </Card>
  );
}
