"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";

function formatCurrency(value: number) {
  return `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function DarkChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value?: number; name?: string; payload?: { category?: string } }> }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const label = item.name ?? item.payload?.category ?? "";
  const value = Number(item.value ?? 0);

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="text-sm font-semibold text-slate-100">{label}</p>
      <p className="text-xs text-slate-300">{formatCurrency(value)}</p>
    </div>
  );
}

export function CategoryDonutChart({ data }: { data: Array<{ category: string; amount: number; color: string }> }) {
  return (
    <Card title="Para onde foi o dinheiro">
      <div className="cf-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="category" innerRadius={58} outerRadius={92} paddingAngle={3}>
              {data.map((entry) => <Cell key={entry.category} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<DarkChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
