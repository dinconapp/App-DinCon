"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/services/authService";
import { getUserBilling } from "@/services/billingService";
import type { BillingPayment, BillingSubscription } from "@/types/billing";
import { formatBillingDate, formatPaymentMethod, formatPaymentStatus, formatPrice, statusToneClass } from "@/components/billing/billingFormat";

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session?.id) return;
    getUserBilling(session.id)
      .then((payload) => {
        setSubscription(payload.subscription);
        setPayments(payload.payments);
      })
      .catch(() => setError("Não foi possível carregar sua assinatura."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <main className="cf-app cf-billing-page">
        <section className="cf-billing-wrap">
          <div className="cf-card-head">
            <div className="cf-title">
              <h1>Minha assinatura</h1>
              <p>Consulte seu plano, status e pagamentos recentes.</p>
            </div>
            <Link href="/planos"><Button variant="primary">Ver planos</Button></Link>
          </div>
          {loading && <div className="cf-card">Carregando assinatura...</div>}
          {error && <div className="cf-auth-error">{error}</div>}
          {!loading && (
            <div className="cf-grid cf-two">
              <Card title="Status da assinatura">
                {subscription ? (
                  <div className="cf-grid">
                    <div className="cf-row"><span>Status</span><span className={statusToneClass(subscription.status)}>{formatPaymentStatus(subscription.status)}</span></div>
                    <div className="cf-row"><span>Inicio</span><strong>{formatBillingDate(subscription.current_period_start)}</strong></div>
                    <div className="cf-row"><span>Fim do periodo</span><strong>{formatBillingDate(subscription.current_period_end)}</strong></div>
                  </div>
                ) : (
                  <div className="cf-empty">Nenhuma assinatura ativa.</div>
                )}
              </Card>
              <Card title="Pagamentos recentes">
                {!payments.length && <div className="cf-empty">Nenhum pagamento encontrado.</div>}
                {payments.map((payment) => (
                  <div className="cf-row" key={payment.id}>
                    <div>
                      <div className="cf-row-title">{formatPaymentMethod(payment.payment_method)} - {formatPrice(payment.amount_cents)}</div>
                      <div className="cf-row-sub">{formatBillingDate(payment.created_at)}</div>
                    </div>
                    <span className={statusToneClass(payment.status)}>{formatPaymentStatus(payment.status)}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
