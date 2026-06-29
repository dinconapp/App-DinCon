import { CalendarRange, Landmark } from "lucide-react";
import type { CSSProperties } from "react";
import { Money } from "@/components/ui/Money";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import type { SavingsInvestment } from "@/types/savings";

const interestLabels = {
  none: "Sem rendimento",
  simple: "Juros simples",
  compound: "Juros compostos",
};

export function SavingsInvestmentRow({ item, onEdit, onDelete }: { item: SavingsInvestment; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="cf-row">
      <div className="cf-row-main">
        <span className="cf-dot" style={{ "--c": "#43E6A3" } as CSSProperties}><Landmark size={17} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="cf-row-title">{item.name}</div>
          <div className="cf-row-sub">
            {interestLabels[item.interest_type]} - {item.interest_rate.toLocaleString("pt-BR")}%
            {item.interest_period === "yearly" ? " ao ano" : " ao mes"}
          </div>
          <div className="cf-row-sub"><CalendarRange size={12} /> {item.start_month} {item.end_month ? `ate ${item.end_month}` : "sem termino"}</div>
        </div>
      </div>
      <div className="cf-actions">
        <div style={{ textAlign: "right" }}>
          <Money value={item.initial_amount} size="sm" />
          <div className="cf-row-sub">aporte <Money value={item.monthly_contribution} size="sm" /></div>
        </div>
        <RowActionsMenu onEdit={onEdit} onDelete={onDelete} deleteLabel="Remover" />
      </div>
    </div>
  );
}
