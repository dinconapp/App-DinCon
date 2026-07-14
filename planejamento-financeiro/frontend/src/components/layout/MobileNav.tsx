"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ClipboardList, LayoutDashboard, Lightbulb, PiggyBank, ReceiptText } from "lucide-react";
import { resolveMonthKey } from "@/utils/month";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard", label: "Dashboard" },
  { href: "/fluxo-de-caixa", icon: CalendarDays, key: "planejamento", label: "Fluxo de Caixa" },
  { href: "/transacoes", icon: ReceiptText, key: "transacoes", label: "Lançamentos" },
  { href: "/contas", icon: ClipboardList, key: "contas", label: "Contas" },
  { href: "/cofrinho", icon: PiggyBank, key: "cofrinho", label: "Cofrinho" },
  { href: "/caixa-de-sugestoes", icon: Lightbulb, key: "sugestoes", label: "Sugestões" }
];

export function MobileNav({ active }: { active: string }) {
  const searchParams = useSearchParams();
  const month = resolveMonthKey(searchParams.get("month"));
  const withMonth = (href: string) => `${href}?month=${month}`;

  return (
    <nav className="cf-mobile-nav">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.key} href={withMonth(item.href)} className={active === item.key ? "active" : ""} aria-label={item.label}>
            <Icon size={19} />
          </Link>
        );
      })}
    </nav>
  );
}
