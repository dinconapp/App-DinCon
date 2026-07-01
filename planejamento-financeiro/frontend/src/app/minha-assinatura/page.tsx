"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatBillingDate, formatPaymentMethod, formatPaymentStatus, formatPaymentStatusDetail, formatPrice, maskProviderPaymentId, statusToneClass } from "@/components/billing/billingFormat";
import { getSession } from "@/services/authService";
import { getBillingPayment, getUserBilling } from "@/services/billingService";
import type { BillingPayment, BillingSubscription } from "@/types/billing";

const WATCHABLE_STATUSES = new Set(["pending", "processing", "in_process"]);

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshingPaymentId, setRefreshingPaymentId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session?.id) return;
    sessionIdRef.current = session.id;
    getUserBilling(session.id)
      .then((payload) => {
        setSubscription(payload.subscription);
        setPayments(payload.payments);
      })
      .catch(() => setError("Nao foi possivel carregar sua assinatura."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    const watchablePayments = payments.filter((payment) => WATCHABLE_STATUSES.has(payment.status));
    if (!watchablePayments.length) return;

    const controller = new AbortController();
    const timer = window.setInterval(() => {
      watchablePayments.forEach((payment) => {
        void refreshPayment(sessionId, payment.id, controller.signal);
      });
    }, 5000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [payments]);

  async function refreshPayment(sessionId: string, paymentId: string, signal?: AbortSignal) {
    setRefreshingPaymentId(paymentId);
    try {
      const next = await getBillingPayment(sessionId, paymentId);
      if (signal?.aborted) return;
      setPayments((current) => current.map((item) => (item.id === next.id ? next : item)));
      if (next.status === "approved" || next.status === "paid") {
        const payload = await getUserBilling(sessionId);
        if (signal?.aborted) return;
        setSubscription(payload.subscription);
        setPayments(payload.payments);
      }
    } finally {
      if (!signal?.aborted) setRefreshingPaymentId(null);
    }
  }

  async function refreshPaymentManually(paymentId: string) {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    await refreshPayment(sessionId, paymentId);
  }

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
                    <div className="cf-row"><span>Início</span><strong>{formatBillingDate(subscription.current_period_start)}</strong></div>
                    <div className="cf-row"><span>Fim do período</span><strong>{formatBillingDate(subscription.current_period_end)}</strong></div>
                  </div>
                ) : (
                  <div className="cf-empty">Nenhuma assinatura ativa.</div>
                )}
              </Card>
              <Card title="Pagamentos recentes">
                {!payments.length && <div className="cf-empty">Nenhum pagamento encontrado.</div>}
                {payments.map((payment) => {
                  const watchable = WATCHABLE_STATUSES.has(payment.status);
                  return (
                    <div className="cf-row" key={payment.id} style={{ alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div className="cf-row-title">{formatPaymentMethod(payment.payment_method)} - {formatPrice(payment.amount_cents)}</div>
                        <div className="cf-row-sub">Criado em {formatBillingDate(payment.created_at)}</div>
                        <div className="cf-row-sub">Atualizado em {formatBillingDate(payment.updated_at)}</div>
                        <div className="cf-row-sub">Pagamento {maskProviderPaymentId(payment.provider_payment_id)}</div>
                        {payment.status_detail && <div className="cf-help-text">{formatPaymentStatusDetail(payment.status_detail)}</div>}
                      </div>
                      <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                        <span className={statusToneClass(payment.status, payment.status_detail)}>{formatPaymentStatus(payment.status, payment.status_detail)}</span>
                        {watchable && (
                          <Button type="button" onClick={() => refreshPaymentManually(payment.id)} disabled={refreshingPaymentId === payment.id}>
                            {refreshingPaymentId === payment.id ? "Consultando..." : "Consultar status"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
