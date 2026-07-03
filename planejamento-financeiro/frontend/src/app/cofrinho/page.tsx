import { Suspense } from "react";
import { FinanceShell } from "@/components/layout/FinanceShell";

export default function CofrinhoPage() {
  return (
    <Suspense fallback={<div className="cf-card">Carregando...</div>}>
      <FinanceShell active="cofrinho" />
    </Suspense>
  );
}
