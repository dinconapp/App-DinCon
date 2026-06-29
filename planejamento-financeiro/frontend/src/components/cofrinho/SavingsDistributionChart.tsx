"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import type { SavingsInvestment, SavingsProjectionPoint } from "@/types/savings";

const colors = ["#43E6A3", "#9D8BFF", "#F4C25A", "#60A5FA", "#FF8A65", "#B9C1CF"];

export function SavingsDistributionChart({ investments, projection }: { investments: SavingsInvestment[]; projection: SavingsProjectionPoint[] }) {
  const total = projection.at(-1)?.projected_balance || 0;
  const data = investments.map((item, index) => ({
    name: item.name,
    value: total > 0 ? item.initial_amount + item.monthly_contribution : item.initial_amount,
    color: colors[index % colors.length],
  })).filter((item) => item.value > 0);

  return (
    <Card title="Participacao">
      <div className="cf-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={{ background: "#10151D", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
