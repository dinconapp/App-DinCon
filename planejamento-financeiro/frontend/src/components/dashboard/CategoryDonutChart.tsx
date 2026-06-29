"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";

export function CategoryDonutChart({ data }: { data: Array<{ category: string; amount: number; color: string }> }) {
  return (
    <Card title="Para onde foi o dinheiro">
      <div className="cf-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="category" innerRadius={58} outerRadius={92} paddingAngle={3}>
              {data.map((entry) => <Cell key={entry.category} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
