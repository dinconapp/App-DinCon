"use client";

import { Suspense } from "react";
import { FinanceShell } from "@/components/layout/FinanceShell";
import { LoggedSubscriptionContent } from "@/components/billing/LoggedSubscriptionContent";

export default function MySubscriptionPage() {
  return (
    <Suspense fallback={<div className="cf-card">Carregando...</div>}>
      <FinanceShell active="perfil">
        <LoggedSubscriptionContent />
      </FinanceShell>
    </Suspense>
  );
}
