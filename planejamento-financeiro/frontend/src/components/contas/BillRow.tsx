import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Bill } from "@/services/billService";

export function BillRow({ item, onToggle }: { item: Bill; onToggle: () => void }) {
  return (
    <div className="cf-row cf-row-expense">
      <div>
        <div className="cf-row-title">{item.description}</div>
        <div className="cf-row-sub">{item.category_name} - vencimento dia {item.due_day ?? "-"}</div>
        <div className="cf-badge-line"><StatusBadge status={item.paid ? "paid" : "pending"} /></div>
      </div>
      <div className="cf-actions">
        <Money value={item.amount} size="sm" tone="expense" />
        <Button square icon={item.paid ? <RotateCcw size={16} /> : <Check size={16} />} onClick={onToggle} aria-label={item.paid ? "Voltar para pendente" : "Marcar como paga"} />
      </div>
    </div>
  );
}
