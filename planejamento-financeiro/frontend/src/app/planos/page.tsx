"use client";

import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getBillingPlans } from "@/services/billingService";
import type { BillingPlan } from "@/types/billing";
import { formatPrice } from "@/components/billing/billingFormat";
import { PlansPageClean } from "@/components/billing/PlansPageClean";

export default function PlansPage() {
  return <PlansPageClean />;
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBillingPlans()
      .then(setPlans)
      .catch(() => setError("Não foi possível carregar os planos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <main className="cf-app cf-billing-page">
        <section className="cf-billing-wrap">
          <div className="cf-card-head">
            <div className="cf-title">
              <h1>Planos DinCon</h1>
              <p>Escolha um plano e pague com Pix ou cartao pelo Mercado Pago.</p>
            </div>
            <Link href="/minha-assinatura"><Button>Minha assinatura</Button></Link>
          </div>
          {loading && <div className="cf-card">Carregando planos...</div>}
          {error && <div className="cf-auth-error">{error}</div>}
          <div className="cf-grid cf-three">
            {plans.map((plan) => (
              <Card key={plan.code} className={plan.code === "pro" ? "cf-plan-highlight" : ""}>
                <div className="cf-row-main">
                  <span className="cf-dot" style={{ "--c": "#43E6A3" } as CSSProperties}><CreditCard size={18} /></span>
                  <div>
                    <div className="cf-row-title">{plan.name}</div>
                    <div className="cf-row-sub">{plan.billing_interval === "month" ? "Mensal" : plan.billing_interval}</div>
                  </div>
                </div>
                <div style={{ marginTop: 18 }}>
                  <div className="cf-money cf-money-lg">{formatPrice(plan.price_cents)}</div>
                  <p className="cf-muted">{plan.description}</p>
                </div>
                <div className="cf-grid" style={{ marginTop: 18 }}>
                  {plan.features.map((feature) => (
                    <div className="cf-row-main" key={feature}><Check size={16} color="#43E6A3" /><span>{feature}</span></div>
                  ))}
                </div>
                <div style={{ marginTop: 18 }}>
                  {plan.code === "free" ? (
                    <Link href="/dashboard"><Button className="w-full">Continuar gratis</Button></Link>
                  ) : (
                    <Link href={`/checkout?plan=${plan.code}`}><Button variant="primary" className="w-full">Assinar {plan.name}</Button></Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
