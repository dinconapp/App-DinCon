import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { Money } from "@/components/ui/Money";
import { Card } from "@/components/ui/Card";

export function KpiCard({ label, value, icon: Icon, accent, meta, tone }: { label: string; value: number; icon: LucideIcon; accent: string; meta?: string; tone?: "income" | "expense" | "neutral" }) {
  return (
    <Card>
      <div className="cf-kpi" style={{ "--accent": accent } as CSSProperties}>
        <div className="cf-kpi-top">
          <span>{label}</span>
          <Icon size={18} />
        </div>
        <div className="cf-kpi-val"><Money value={value} size="lg" tone={tone} /></div>
        {meta && <div className="cf-row-sub">{meta}</div>}
      </div>
    </Card>
  );
}
