"use client";

import Link from "next/link";
import { CalendarDays, ClipboardList, LayoutDashboard, PiggyBank, ReceiptText } from "lucide-react";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard", label: "Dashboard" },
  { href: "/planejamento", icon: CalendarDays, key: "planejamento", label: "Fluxo de Caixa" },
  { href: "/transacoes", icon: ReceiptText, key: "transacoes", label: "Lançamentos" },
  { href: "/contas", icon: ClipboardList, key: "contas", label: "Contas" },
  { href: "/cofrinho", icon: PiggyBank, key: "cofrinho", label: "Cofrinho" }
];

export function MobileNav({ active }: { active: string }) {
  return (
    <nav className="cf-mobile-nav">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.key} href={item.href} className={active === item.key ? "active" : ""} aria-label={item.label}>
            <Icon size={19} />
          </Link>
        );
      })}
    </nav>
  );
}
