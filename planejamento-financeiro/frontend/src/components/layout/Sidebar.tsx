"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ClipboardList, LayoutDashboard, PiggyBank, ReceiptText } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";
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
  const { theme } = useThemeMode();

  return (
    <aside className="cf-sidebar">
      <div className="cf-brand">
        <img
          src={theme === "dark" ? "/logo/dincon_logo_dark_mode.png" : "/logo/dincon_logo_light_transparente_final.png"}
          alt="Díncon - Controle Financeiro Inteligente"
          className={`cf-brand-logo ${theme === "dark" ? "cf-brand-logo-dark" : "cf-brand-logo-light"}`}
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
