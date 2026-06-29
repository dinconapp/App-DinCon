"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import type { Projection } from "@/types/projection";

export function BalanceProjectionChart({ projection }: { projection: Projection | null }) {
  return (
    <Card title="Projeção do saldo">
      <div className="cf-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projection?.items ?? []} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9D8BFF" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#9D8BFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month_short" tick={{ fill: "#8F99A8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
            <Area type="monotone" dataKey="balance" stroke="#B5A6FF" strokeWidth={2.5} fill="url(#saldoFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
