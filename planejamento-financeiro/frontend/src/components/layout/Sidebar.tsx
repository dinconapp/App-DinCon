"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ClipboardList, LayoutDashboard, PiggyBank, ReceiptText } from "lucide-react";
import { resolveMonthKey } from "@/utils/month";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/fluxo-de-caixa", label: "Fluxo de Caixa", icon: CalendarDays, key: "planejamento" },
  { href: "/transacoes", label: "Lançamentos", icon: ReceiptText, key: "transacoes" },
  { href: "/contas", label: "Contas", icon: ClipboardList, key: "contas" },
  { href: "/cofrinho", label: "Cofrinho", icon: PiggyBank, key: "cofrinho" }
];

export function Sidebar({ active }: { active: string; initial?: string }) {
  const searchParams = useSearchParams();
  const month = resolveMonthKey(searchParams.get("month"));
  const withMonth = (href: string) => `${href}?month=${month}`;

  return (
    <aside className="cf-sidebar">
      <div className="cf-brand">
        <img
          src="/logo/dincon_logo_dark_mode.png"
          alt="Díncon - Controle Financeiro Inteligente"
          className="cf-brand-logo"
        />
      </div>
      <nav className="cf-nav">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.key} className={active === item.key ? "active" : ""} href={withMonth(item.href)}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
