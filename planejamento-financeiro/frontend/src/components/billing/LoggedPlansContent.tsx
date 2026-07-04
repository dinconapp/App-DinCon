"use client";

import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/components/billing/billingFormat";
import { getBillingPlans, getUserBilling } from "@/services/billingService";
import { getSession } from "@/services/authService";
import type { BillingOverview, BillingPlan } from "@/types/billing";

export function LoggedPlansContent() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    Promise.all([
      getBillingPlans(),
      session?.id ? getUserBilling(session.id) : Promise.resolve(null),
    ])
      .then(([nextPlans, nextBilling]) => {
        setPlans(nextPlans.filter((plan) => ["free", "pro"].includes(plan.code)));
        setBilling(nextBilling);
      })
      .catch(() => setError("Nao foi possivel carregar os planos."))
      .finally(() => setLoading(false));
  }, []);

  const currentPlanCode = billing?.current_plan?.code ?? "free";
  const hasActiveSubscription = Boolean(billing?.has_active_subscription);

  return (
    <section className="cf-billing-wrap">
      <div className="cf-card-head">
        <div className="cf-title">
          <h1>Planos DinCon</h1>
          <p>Escolha entre o Plano Gratuito e o Plano WhatsApp dentro da área autenticada.</p>
        </div>
        <Link href="/minha-assinatura" className="cf-btn primary">Minha assinatura</Link>
      </div>
      {loading && <div className="cf-card">Carregando planos...</div>}
      {error && <div className="cf-auth-error">{error}</div>}
      {!loading && (
        <div className="cf-grid cf-two">
          {plans.map((plan) => (
            <PlanCard
              key={plan.code}
              plan={plan}
              currentPlanCode={currentPlanCode}
              hasActiveSubscription={hasActiveSubscription}
              canPurchase={billing?.can_purchase ?? true}
              canRenewEarly={billing?.can_renew_early ?? false}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PlanCard({
  plan,
  currentPlanCode,
  hasActiveSubscription,
  canPurchase,
  canRenewEarly,
}: {
  plan: BillingPlan;
  currentPlanCode: string;
  hasActiveSubscription: boolean;
  canPurchase: boolean;
  canRenewEarly: boolean;
}) {
  const isFree = plan.code === "free";
  const isCurrent = currentPlanCode === plan.code;
  const router = useRouter();
  const cta = useMemo(() => {
    if (isFree) return "Atual";
    if (canRenewEarly) return "Renovar antecipadamente";
    if (hasActiveSubscription && isCurrent) return "Você já possui um plano vigente.";
    if (hasActiveSubscription) return "Plano vigente";
    if (!canPurchase) return "Plano vigente";
    return "Assinar";
  }, [canRenewEarly, canPurchase, hasActiveSubscription, isCurrent, isFree]);

  const disabled = isFree || (!canPurchase && !canRenewEarly) || (hasActiveSubscription && !canRenewEarly);
  const ctaHref = isFree ? "/dashboard" : `/checkout?plan=${plan.code}${canRenewEarly ? "&renewal=true" : ""}`;

  function handlePurchase() {
    if (!isFree && canRenewEarly && !window.confirm("Você já possui um plano vigente. Deseja renovar antecipadamente?")) {
      return;
    }
    router.push(ctaHref);
  }

  return (
    <Card className={plan.code === "pro" ? "cf-plan-highlight" : ""}>
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
        {disabled ? (
          <Button className="w-full" disabled>{cta}</Button>
        ) : (
          <Button variant="primary" className="w-full" onClick={handlePurchase}>{isFree ? "Atual" : `${cta} ${plan.name}`}</Button>
        )}
      </div>
    </Card>
  );
}
