import { Money } from "@/components/ui/Money";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import type { Budget } from "@/types/budget";

export function BudgetRow({ item, onEdit, onDelete }: { item: Budget; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className={`cf-row cf-row-${item.kind}`}>
      <div style={{ minWidth: 0 }}>
        <div className="cf-row-title">{item.description}</div>
        <div className="cf-row-sub">{item.category_name} - {getBudgetFrequencyLabel(item)}</div>
      </div>
      <div className="cf-actions">
        <Money value={item.amount} size="sm" tone={item.kind === "income" ? "income" : "expense"} />
        <RowActionsMenu onEdit={onEdit} onDelete={onDelete} deleteLabel="Remover" />
      </div>
    </div>
  );
}

function getBudgetFrequencyLabel(item: Budget) {
  if (item.kind === "expense" && item.budget_type === "fixed" && item.end_month) {
    return "Programável";
  }
  return item.budget_type === "fixed" ? "Fixo" : "Variável";
}
