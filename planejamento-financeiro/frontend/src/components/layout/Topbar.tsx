"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, KeyRound, LogOut, Plus, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggleButton } from "@/components/ui/ThemeToggleButton";
import { MonthNavigator } from "@/components/ui/MonthNavigator";
import { signOut } from "@/services/authService";
import { getUser } from "@/services/userService";
import type { User as AppUser } from "@/types/user";

const titles: Record<string, { title: string; subtitle: string; action?: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Resumo financeiro do mês selecionado." },
  planejamento: { title: "Fluxo de Caixa", subtitle: "Compare receitas previstas, contas fixas e lançamentos realizados." },
  transacoes: { title: "Lançamentos", subtitle: "Consulte tudo que entrou e saiu no mês." },
  contas: { title: "Contas", subtitle: "Acompanhe contas fixas pendentes, pagas e atrasadas." },
  cofrinho: { title: "Cofrinho", subtitle: "Projete seus investimentos e acompanhe a evolução mês a mês." },
  sugestoes: { title: "Caixa de Sugestões", subtitle: "Central para registrar ideias, melhorias e observações do produto." },
  perfil: { title: "Perfil", subtitle: "Gerencie seus dados pessoais, segurança, integrações e assinatura." }
};

export function Topbar({
  active,
  userId,
  monthKey,
  onPrevious,
  onNext,
  onAction
}: {
  active: string;
  userId: string;
  monthKey: string;
  onPrevious: () => void;
  onNext: () => void;
  onAction?: () => void;
}) {
  const data = titles[active] ?? titles.dashboard;
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void getUser(userId).then(setUser).catch(() => setUser(null));
  }, [userId]);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  function logout() {
    signOut();
    router.push("/login");
  }

  const userName = user?.name || "Minha conta";

  return (
    <header className="cf-topbar">
      <div className="cf-title">
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </div>
      <div className="cf-actions">
        <ThemeToggleButton />
        {active !== "perfil" && active !== "cofrinho" && active !== "sugestoes" && <MonthNavigator monthKey={monthKey} onPrevious={onPrevious} onNext={onNext} />}
        {data.action && onAction && <Button variant="primary" icon={<Plus size={17} />} onClick={onAction}>{data.action}</Button>}
        <div className="cf-account-menu" ref={menuRef}>
          <button className="cf-account-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            <span className="cf-account-avatar">{userName.slice(0, 1).toUpperCase()}</span>
            <span>{userName}</span>
            <ChevronDown size={16} />
          </button>
          {open && (
            <div className="cf-account-dropdown">
              <Link href="/perfil" onClick={() => setOpen(false)}>
                <User size={16} />
                Dados cadastrais
              </Link>
              <Link href="/trocar-senha" onClick={() => setOpen(false)}>
                <KeyRound size={16} />
                Trocar senha
              </Link>
              <Link href="/minha-assinatura" onClick={() => setOpen(false)}>
                <CreditCard size={16} />
                Minha assinatura
              </Link>
              <button type="button" onClick={logout}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
