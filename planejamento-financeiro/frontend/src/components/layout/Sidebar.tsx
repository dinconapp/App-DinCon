"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, Lightbulb, PiggyBank, ReceiptText } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";
import { resolveMonthKey } from "@/utils/month";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/fluxo-de-caixa", label: "Fluxo de Caixa", icon: CalendarDays, key: "planejamento" },
  { href: "/transacoes", label: "Lançamentos", icon: ReceiptText, key: "transacoes" },
  { href: "/contas", label: "Contas", icon: ClipboardList, key: "contas" },
  { href: "/cofrinho", label: "Cofrinho", icon: PiggyBank, key: "cofrinho" },
  { href: "/caixa-de-sugestoes", label: "Caixa de Sugestões", icon: Lightbulb, key: "sugestoes" }
];

export function Sidebar({ active, collapsed, onToggle }: { active: string; collapsed: boolean; onToggle: () => void }) {
  const searchParams = useSearchParams();
  const month = resolveMonthKey(searchParams.get("month"));
  const withMonth = (href: string) => `${href}?month=${month}`;
  const { theme } = useThemeMode();

  return (
    <aside className={`cf-sidebar${collapsed ? " is-collapsed" : ""}`}>
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
            <Link key={item.key} className={active === item.key ? "active" : ""} href={withMonth(item.href)} aria-label={item.label} title={collapsed ? item.label : undefined}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button className="cf-sidebar-toggle" type="button" onClick={onToggle} aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        <span>{collapsed ? "Expandir menu" : "Recolher menu"}</span>
      </button>
    </aside>
  );
}
