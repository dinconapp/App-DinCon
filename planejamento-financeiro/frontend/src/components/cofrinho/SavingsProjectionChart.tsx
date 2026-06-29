"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import type { SavingsProjectionPoint } from "@/types/savings";

export function SavingsProjectionChart({ data }: { data: SavingsProjectionPoint[] }) {
  return (
    <Card title="Projeção mensal">
      <div className="cf-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="month_label" stroke="#8F99A8" fontSize={12} />
            <YAxis stroke="#8F99A8" fontSize={12} tickFormatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`} />
            <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={{ background: "#10151D", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
            <Area type="monotone" dataKey="projected_balance" name="Saldo projetado" stroke="#43E6A3" fill="rgba(67,230,163,.18)" strokeWidth={2} />
            <Area type="monotone" dataKey="accumulated_interest" name="Rendimento" stroke="#9D8BFF" fill="rgba(157,139,255,.14)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
