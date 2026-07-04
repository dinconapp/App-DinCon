"use client";

import { Suspense } from "react";
import { FinanceShell } from "@/components/layout/FinanceShell";
import { LoggedPlansContent } from "@/components/billing/LoggedPlansContent";

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="cf-card">Carregando...</div>}>
      <FinanceShell active="perfil">
        <LoggedPlansContent />
      </FinanceShell>
    </Suspense>
  );
}
