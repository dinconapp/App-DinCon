import { Suspense } from "react";
import { FinanceShell } from "@/components/layout/FinanceShell";

export default function Page() {
  return (
    <Suspense fallback={<div className="cf-card">Carregando...</div>}>
      <FinanceShell active="dashboard" />
    </Suspense>
  );
}
