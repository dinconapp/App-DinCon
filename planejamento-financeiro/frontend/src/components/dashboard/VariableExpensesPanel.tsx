import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import type { DashboardLine } from "@/types/dashboard";

export function VariableExpensesPanel({ items }: { items: DashboardLine[] }) {
  return (
    <Card title="Gastos variaveis">
      {!items.length && <EmptyState message="Nenhuma meta variavel cadastrada." />}
      {items.map((item) => {
        const value = item.budget_type === "transaction" ? item.realized ?? item.amount : item.amount;
        return (
          <div className="cf-row cf-row-expense" key={item.id}>
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
