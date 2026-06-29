import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";

export function SavingsKpiCard({ label, value, icon: Icon, meta }: { label: string; value: number; icon: LucideIcon; meta?: string }) {
  return (
    <Card className="cf-kpi">
      <div className="cf-kpi-top">
        <span>{label}</span>
        <Icon className="cf-kpi-ico" size={20} />
      </div>
      <div className="cf-kpi-val"><Money value={value} size="lg" /></div>
      {meta && <div className="cf-row-sub">{meta}</div>}
    </Card>
  );
}
