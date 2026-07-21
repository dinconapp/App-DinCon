"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { Toast } from "@/components/ui/Toast";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useMonth } from "@/hooks/useMonth";
import { useToast } from "@/hooks/useToast";
import { getSession } from "@/services/authService";
import { DashboardPage } from "@/components/dashboard/DashboardSummary";
import { PlanningPage } from "@/components/planejamento/PlanningSummaryCards";
import { TransactionsPage } from "@/components/transacoes/TransactionList";
import { BillsPage } from "@/components/contas/BillsList";
import { SavingsDashboard } from "@/components/cofrinho/SavingsDashboard";
import { ProfilePageClean } from "@/components/perfil/ProfilePageClean";
import { SuggestionsPage } from "@/components/sugestoes/SuggestionsPage";

export function FinanceShell({
  active,
  children,
}: {
  active: "dashboard" | "planejamento" | "transacoes" | "contas" | "cofrinho" | "perfil" | "assinatura" | "planos" | "sugestoes";
  children?: ReactNode;
}) {
  const [userInitial, setUserInitial] = useState("U");
  const [userId, setUserId] = useState<string | null>(null);
  const { monthKey, previousMonth, nextMonth } = useMonth();
  const { toast, showToast } = useToast();
  const [actionToken, setActionToken] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setUserId(getSession()?.id ?? null);
  }, []);

  return (
    <AuthGuard>
      <div className="cf-app">
        <div className={`cf-shell${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
          <Sidebar active={active} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
          <main className="cf-main">
            {userId ? (
              <>
                <Topbar active={active} userId={userId} monthKey={monthKey} onPrevious={previousMonth} onNext={nextMonth} onAction={() => setActionToken((value) => value + 1)} />
                {children ?? (
                  <>
                    {active === "dashboard" && <DashboardPage userId={userId} monthKey={monthKey} />}
                    {active === "planejamento" && <PlanningPage userId={userId} monthKey={monthKey} actionToken={actionToken} onDone={showToast} />}
                    {active === "transacoes" && <TransactionsPage userId={userId} monthKey={monthKey} actionToken={actionToken} onDone={showToast} />}
                    {active === "contas" && <BillsPage userId={userId} monthKey={monthKey} onDone={showToast} />}
                    {active === "cofrinho" && <SavingsDashboard userId={userId} actionToken={actionToken} onDone={showToast} />}
                    {active === "perfil" && <ProfilePageClean userId={userId} onInitial={setUserInitial} onDone={showToast} />}
                    {active === "sugestoes" && <SuggestionsPage userId={userId} onDone={showToast} />}
                  </>
                )}
              </>
            ) : (
              <div className="cf-card">Carregando usuario...</div>
            )}
          </main>
        </div>
        <MobileNav active={active} />
        <Toast toast={toast} />
      </div>
    </AuthGuard>
  );
}


