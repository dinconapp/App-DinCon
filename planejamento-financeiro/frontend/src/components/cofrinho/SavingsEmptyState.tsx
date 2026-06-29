import { PiggyBank } from "lucide-react";
import type { CSSProperties } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export function SavingsEmptyState() {
  return (
    <div className="cf-card">
      <div className="cf-row-main" style={{ justifyContent: "center", marginBottom: 8 }}>
        <span className="cf-dot" style={{ "--c": "#43E6A3" } as CSSProperties}><PiggyBank size={18} /></span>
      </div>
      <EmptyState message="Nenhum investimento cadastrado. Crie seu primeiro investimento para visualizar a projeção." />
    </div>
  );
}
