"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, QrCode } from "lucide-react";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/services/authService";
import { createCardCheckout, createPixCheckout, getBillingConfig, getBillingPayment, getBillingPlans } from "@/services/billingService";
import type { BillingConfig, BillingPayment, BillingPlan } from "@/types/billing";
import { formatBillingDate, formatPaymentMethod, formatPaymentStatus, formatPrice, statusToneClass } from "@/components/billing/billingFormat";

type Method = "pix" | "card";

type MercadoPagoClient = {
  createCardToken: (payload: Record<string, string | number>) => Promise<{ id: string }>;
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoClient;
  }
}

function CheckoutContent() {
  const params = useSearchParams();
  const selectedPlanCode = params.get("plan") || "pro";
  const session = getSession();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [method, setMethod] = useState<Method>("pix");
  const [payment, setPayment] = useState<BillingPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [card, setCard] = useState({
    number: "",
    name: "",
    month: "",
    year: "",
    cvv: "",
    document: "",
    paymentMethodId: "visa",
    installments: 1,
  });

  const plan = useMemo(() => plans.find((item) => item.code === selectedPlanCode) ?? plans.find((item) => item.code === "pro"), [plans, selectedPlanCode]);

  useEffect(() => {
    Promise.all([getBillingPlans(), getBillingConfig()])
      .then(([nextPlans, nextConfig]) => {
        setPlans(nextPlans);
        setConfig(nextConfig);
      })
      .catch(() => setError("Não foi possível carregar o checkout."));
  }, []);

  useEffect(() => {
    if (!config?.public_key || config.mock_mode || window.MercadoPago) return;
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onerror = () => setError("Não foi possível carregar o SDK do Mercado Pago.");
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [config]);

  useEffect(() => {
    if (!payment || payment.status !== "pending" || !session?.id) return;
    const timer = window.setInterval(() => {
      getBillingPayment(session.id, payment.id).then(setPayment).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [payment, session?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session?.id || !plan) return;
    setLoading(true);
    setError("");
    try {
      const next = method === "pix" ? await createPixCheckout(session.id, plan.code) : await payWithCard(session.id, plan.code);
      setPayment(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  async function payWithCard(userId: string, planCode: string) {
    if (config?.mock_mode) {
      return createCardCheckout({ user_id: userId, plan_code: planCode, mock: true, installments: card.installments, payment_method_id: card.paymentMethodId });
    }
    if (!config?.public_key || !window.MercadoPago) {
      throw new Error("Mercado Pago nao esta configurado ou ainda nao carregou.");
    }
    const [expirationMonth, expirationYear] = [card.month.padStart(2, "0"), card.year.length === 2 ? `20${card.year}` : card.year];
    const mp = new window.MercadoPago(config.public_key, { locale: "pt-BR" });
    const token = await mp.createCardToken({
      cardNumber: card.number.replace(/\D/g, ""),
      cardholderName: card.name,
      cardExpirationMonth: expirationMonth,
      cardExpirationYear: expirationYear,
      securityCode: card.cvv,
      identificationType: "CPF",
      identificationNumber: card.document.replace(/\D/g, ""),
    });
    return createCardCheckout({
      user_id: userId,
      plan_code: planCode,
      card_token: token.id,
      installments: card.installments,
      payment_method_id: card.paymentMethodId,
      payer_identification_type: "CPF",
      payer_identification_number: card.document.replace(/\D/g, ""),
    });
  }

  return (
    <AuthGuard>
      <main className="cf-app cf-billing-page">
        <section className="cf-billing-wrap">
          <div className="cf-card-head">
            <div className="cf-title">
              <h1>Checkout</h1>
              <p>Pagamento seguro via Mercado Pago.</p>
            </div>
            <Link href="/planos"><Button>Voltar aos planos</Button></Link>
          </div>
          {error && <div className="cf-auth-error">{error}</div>}
          {config?.mock_mode && <div className="cf-auth-success">Modo mock ativo. Nenhuma cobranca real sera criada.</div>}
          <div className="cf-grid cf-two">
            <Card title="Plano selecionado">
              <div className="cf-row">
                <div>
                  <div className="cf-row-title">{plan?.name ?? "Carregando..."}</div>
                  <div className="cf-row-sub">{plan?.description ?? "Buscando dados do plano."}</div>
                </div>
                <strong>{plan ? formatPrice(plan.price_cents) : "-"}</strong>
              </div>
              <div className="cf-grid" style={{ marginTop: 12 }}>
                {plan?.features.map((feature) => <div className="cf-chip" key={feature}>{feature}</div>)}
              </div>
            </Card>

            <Card title="Forma de pagamento">
              <form className="cf-form" onSubmit={submit}>
                <div className="cf-billing-tabs">
                  <button type="button" className={method === "pix" ? "active" : ""} onClick={() => setMethod("pix")}><QrCode size={17} /> Pix</button>
                  <button type="button" className={method === "card" ? "active" : ""} onClick={() => setMethod("card")}><CreditCard size={17} /> Cartao</button>
                </div>
                {method === "pix" ? (
                  <p className="cf-muted">Gere um QR Code Pix e acompanhe a confirmacao automaticamente.</p>
                ) : (
                  <div className="cf-grid">
                    <label>Numero do cartao<input className="cf-input" inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} required={!config?.mock_mode} /></label>
                    <label>Nome impresso<input className="cf-input" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} required={!config?.mock_mode} /></label>
                    <div className="cf-grid cf-three">
                      <label>Mês<input className="cf-input" inputMode="numeric" maxLength={2} value={card.month} onChange={(e) => setCard({ ...card, month: e.target.value })} required={!config?.mock_mode} /></label>
                      <label>Ano<input className="cf-input" inputMode="numeric" maxLength={4} value={card.year} onChange={(e) => setCard({ ...card, year: e.target.value })} required={!config?.mock_mode} /></label>
                      <label>CVV<input className="cf-input" inputMode="numeric" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} required={!config?.mock_mode} /></label>
                    </div>
                    <div className="cf-grid cf-two">
                      <label>CPF<input className="cf-input" inputMode="numeric" value={card.document} onChange={(e) => setCard({ ...card, document: e.target.value })} required={!config?.mock_mode} /></label>
                      <label>Bandeira<select className="cf-select" value={card.paymentMethodId} onChange={(e) => setCard({ ...card, paymentMethodId: e.target.value })}><option value="visa">Visa</option><option value="master">Mastercard</option><option value="amex">Amex</option></select></label>
                    </div>
                  </div>
                )}
                <Button variant="primary" type="submit" disabled={loading || !plan}>{loading ? "Processando..." : method === "pix" ? "Gerar Pix" : "Pagar com cartao"}</Button>
              </form>
            </Card>
          </div>
          {payment && <PaymentResult payment={payment} />}
        </section>
      </main>
    </AuthGuard>
  );
}

function PaymentResult({ payment }: { payment: BillingPayment }) {
  const showPix = payment.payment_method === "pix" && payment.status === "pending";
  return (
    <Card title="Resultado do pagamento">
      <div className="cf-grid cf-three">
        <div className="cf-row"><span>Metodo</span><strong>{formatPaymentMethod(payment.payment_method)}</strong></div>
        <div className="cf-row"><span>Valor</span><strong>{formatPrice(payment.amount_cents)}</strong></div>
        <div className="cf-row"><span>Status</span><span className={statusToneClass(payment.status)}>{formatPaymentStatus(payment.status)}</span></div>
      </div>
      {payment.expires_at && <p className="cf-muted">Valido ate {formatBillingDate(payment.expires_at)}</p>}
      {showPix && payment.qr_code_base64 && <img className="cf-pix-qr" src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code Pix" />}
      {showPix && payment.qr_code && (
        <div className="cf-grid" style={{ marginTop: 12 }}>
          <Button type="button" onClick={() => navigator.clipboard.writeText(payment.qr_code || "")}>Copiar codigo Pix</Button>
          <textarea className="cf-input cf-pix-code" readOnly value={payment.qr_code} />
        </div>
      )}
      {payment.checkout_url && <a className="cf-btn" href={payment.checkout_url} target="_blank" rel="noreferrer">Abrir checkout Mercado Pago</a>}
    </Card>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="cf-card">Carregando checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
