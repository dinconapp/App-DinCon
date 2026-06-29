import { Card } from "@/components/ui/Card";
import type { SavingsInvestment } from "@/types/savings";
import { SavingsInvestmentRow } from "./SavingsInvestmentRow";

export function SavingsInvestmentList({ items, onEdit, onDelete }: { items: SavingsInvestment[]; onEdit: (item: SavingsInvestment) => void; onDelete: (item: SavingsInvestment) => void }) {
  return (
    <Card title="Investimentos">
      {items.map((item) => (
        <SavingsInvestmentRow key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
      ))}
    </Card>
  );
}
