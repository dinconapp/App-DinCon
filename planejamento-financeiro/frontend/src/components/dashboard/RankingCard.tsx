import type { CSSProperties } from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function RankingCard({ label, position }: { label: string; position: number }) {
  return (
    <Card title="Ranking de economia">
      <div className="cf-row-main">
        <span className="cf-dot" style={{ "--c": "#F4C25A" } as CSSProperties}><Trophy size={18} /></span>
        <div>
          <div className="cf-row-title">{label}</div>
          <div className="cf-row-sub">Posicao {position || "-"}</div>
        </div>
      </div>
    </Card>
  );
}
