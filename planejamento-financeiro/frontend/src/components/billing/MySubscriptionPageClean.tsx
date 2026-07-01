"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBillingDate, formatPaymentMethod, formatPrice } from "@/components/billing/billingFormat";
import { getSession } from "@/services/authService";
import { getUserBilling } from "@/services/billingService";
import type { BillingApprovedPayment, BillingOverview } from "@/types/billing";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function MySubscriptionPageClean() {
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session?.id) return;
    getUserBilling(session.id)
      .then(setBilling)
      .catch(() => setError("Nao foi possivel carregar sua assinatura."))
      .finally(() => setLoading(false));
  }, []);

  const payments = billing?.approved_payments ?? billing?.payments ?? [];

  return (
    <AuthGuard>
      <main className="cf-app cf-billing-page">
        <section className="cf-billing-wrap">
          <div className="cf-card-head">
            <div className="cf-title">
              <h1>Minha assinatura</h1>
              <p>Consulte seu plano atual e pagamentos aprovados.</p>
            </div>
            <Link href="/planos"><Button variant="primary">Ver planos</Button></Link>
          </div>
          {loading && <div className="cf-card">Carregando assinatura...</div>}
          {error && <div className="cf-auth-error">{error}</div>}
          {!loading && billing && (
            <div className="cf-grid cf-two">
              <Card title="Seu plano">
                <div className="cf-grid">
                  <div className="cf-row">
                    <div>
                      <div className="cf-row-title">{billing.has_active_subscription ? `Seu ${billing.current_plan.name} está ativo.` : "Você está no Plano Gratuito."}</div>
                      <div className="cf-row-sub">{billing.has_active_subscription ? billing.current_plan.description : "Use a plataforma Din Con com todas as funcionalidades principais."}</div>
                    </div>
                    <span className={billing.has_active_subscription ? "cf-billing-status paid" : "cf-billing-status pending"}>{billing.plan_name}</span>
                  </div>
                  <div className="cf-row"><span>Status</span><strong>{billing.has_active_subscription ? "Ativo" : "Gratuito"}</strong></div>
                  {billing.valid_until && <div className="cf-row"><span>Válido até</span><strong>{formatBillingDate(billing.valid_until)}</strong></div>}
                  <div className="cf-pix-actions">
                    {!billing.has_active_subscription ? (
                      <Link href="/planos"><Button variant="primary">Ativar WhatsApp</Button></Link>
                    ) : (
                      <Link href="/planos"><Button variant="primary">Renovar antecipadamente</Button></Link>
                    )}
                  </div>
                </div>
              </Card>
              <Card title="WhatsApps autorizados">
                <div className="cf-grid">
                  <div className="cf-row">
                    <div>
                      <div className="cf-row-title">WhatsApp liberado no Plano WhatsApp</div>
                      <div className="cf-row-sub">Cadastre vários números autorizados com apelidos.</div>
                    </div>
                    <span className={billing.whatsapp_enabled ? "cf-billing-status paid" : "cf-billing-status canceled"}>{billing.whatsapp_enabled ? "Ativo" : "Bloqueado"}</span>
                  </div>
                  <Link href="/perfil"><Button>Gerenciar WhatsApps</Button></Link>
                </div>
              </Card>
              <Card title="Pagamentos aprovados">
                {!payments.length && <div className="cf-empty">Nenhum pagamento aprovado encontrado.</div>}
                {payments.map((payment) => (
                  <ApprovedPaymentRow key={`${payment.id || payment.plan_name}-${payment.approved_at || ""}`} payment={payment} />
                ))}
              </Card>
              <Card title="Resumo">
                <div className="cf-grid">
                  <div className="cf-row"><span>Plano atual</span><strong>{billing.current_plan.name}</strong></div>
                  <div className="cf-row"><span>WhatsApp</span><strong>{billing.whatsapp_enabled ? "Liberado" : "Indisponível"}</strong></div>
                  <div className="cf-row"><span>Pode comprar</span><strong>{billing.can_purchase ? "Sim" : "Não"}</strong></div>
                  <div className="cf-row"><span>Pode renovar antecipadamente</span><strong>{billing.can_renew_early ? "Sim" : "Não"}</strong></div>
                </div>
              </Card>
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}

function ApprovedPaymentRow({ payment }: { payment: BillingApprovedPayment }) {
  return (
    <div className="cf-row" style={{ alignItems: "flex-start", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div className="cf-row-title">{payment.plan_name}</div>
        <div className="cf-row-sub">{formatPaymentMethod(payment.payment_method)} - {formatPrice(payment.amount_cents)}</div>
        {payment.approved_at && <div className="cf-row-sub">Aprovado em {formatBillingDate(payment.approved_at)}</div>}
        {payment.valid_until && <div className="cf-row-sub">Válido até {formatBillingDate(payment.valid_until)}</div>}
      </div>
      <span className="cf-billing-status paid">Aprovado</span>
    </div>
  );
}
