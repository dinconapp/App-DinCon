"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, Loader2, MapPin, QrCode, RefreshCw } from "lucide-react";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPaymentMethod, formatPaymentStatus, formatPaymentStatusDetail, formatPrice, statusToneClass } from "@/components/billing/billingFormat";
import { getSession } from "@/services/authService";
import { createCardCheckout, createPixCheckout, expireBillingPayment, getBillingConfig, getBillingPayment, getBillingPlans } from "@/services/billingService";
import { lookupCep } from "@/services/cepService";
import type { BillingAddress, BillingConfig, BillingPayment, BillingPlan } from "@/types/billing";
import { digitsOnly, formatCountdown, getRemainingSeconds, isActivePixStatus, parseExpirationMs } from "@/lib/pixCountdown.js";

type Method = "pix" | "card";

type MercadoPagoClient = {
  createCardToken: (payload: Record<string, string | number>) => Promise<{ id: string }>;
};

type CardAddressState = {
  zip_code: string;
  street_name: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  federal_unit: string;
};

const EMPTY_ADDRESS: CardAddressState = {
  zip_code: "",
  street_name: "",
  street_number: "",
  complement: "",
  neighborhood: "",
  city: "",
  federal_unit: "",
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoClient;
  }
}

function hasAddressValue(address: CardAddressState) {
  return Object.values(address).some((value) => value.trim().length > 0);
}

function isAddressComplete(address: CardAddressState) {
  if (!hasAddressValue(address)) return true;
  return Boolean(
    digitsOnly(address.zip_code).length === 8
      && address.street_name.trim()
      && address.street_number.trim()
      && address.neighborhood.trim()
      && address.city.trim()
      && address.federal_unit.trim().length === 2,
  );
}

function buildAddressPayload(address: CardAddressState): BillingAddress | undefined {
  if (!hasAddressValue(address)) return undefined;
  return {
    zip_code: digitsOnly(address.zip_code),
    street_name: address.street_name.trim(),
    street_number: address.street_number.trim(),
    neighborhood: address.neighborhood.trim(),
    city: address.city.trim(),
    federal_unit: address.federal_unit.trim().toUpperCase(),
    complement: address.complement.trim(),
  };
}

function splitFullName(value?: string | null) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name) return { first_name: "", last_name: "" };
  const parts = name.split(" ");
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

const CARD_ANALYSIS_TIMEOUT_MS = 5 * 60 * 1000;
const POLLING_STATUSES = new Set(["pending", "processing", "in_process"]);
const TERMINAL_STATUSES = new Set(["paid", "approved", "rejected", "cancelled", "canceled", "expired", "refunded", "charged_back", "failed"]);

function isPollingStatus(status: string) {
  return POLLING_STATUSES.has(String(status || "").toLowerCase());
}

function isTerminalStatus(status: string) {
  return TERMINAL_STATUSES.has(String(status || "").toLowerCase());
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
  const [address, setAddress] = useState<CardAddressState>(EMPTY_ADDRESS);
  const [cepStatus, setCepStatus] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [pixNow, setPixNow] = useState(() => Date.now());
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [pollToken, setPollToken] = useState(0);
  const cepLookupRef = useRef<number | null>(null);
  const lastCepLookupRef = useRef("");
  const expireSubmitRef = useRef<string | null>(null);
  const pollSessionRef = useRef<{ paymentId: string; startedAt: number } | null>(null);

  const plan = useMemo(() => plans.find((item) => item.code === selectedPlanCode) ?? plans.find((item) => item.code === "pro"), [plans, selectedPlanCode]);
  const pixExpirationAt = useMemo(() => parseExpirationMs(payment?.date_of_expiration ?? payment?.expires_at), [payment?.date_of_expiration, payment?.expires_at]);
  const remainingPixSeconds = payment?.payment_method === "pix" ? getRemainingSeconds(pixExpirationAt ?? 0, pixNow) : 0;
  const pixExpired = payment?.payment_method === "pix" && (payment?.status === "expired" || (payment ? isActivePixStatus(payment.status) && remainingPixSeconds === 0 : false));
  const paymentWatchable = Boolean(payment && isPollingStatus(payment.status));

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
    if (!session?.id || !payment || !paymentWatchable) {
      pollSessionRef.current = null;
      setPollTimedOut(false);
      return;
    }

    const samePayment = pollSessionRef.current?.paymentId === payment.id;
    const startedAt = samePayment ? pollSessionRef.current!.startedAt : Date.now();
    pollSessionRef.current = { paymentId: payment.id, startedAt };
    setPollTimedOut(false);

    const controller = new AbortController();
    const remaining = Math.max(0, CARD_ANALYSIS_TIMEOUT_MS - (Date.now() - startedAt));

    const refresh = async () => {
      if (controller.signal.aborted) return;
      try {
        const next = await getBillingPayment(session.id, payment.id);
        if (!controller.signal.aborted) setPayment(next);
      } catch {
        if (!controller.signal.aborted) return;
      }
    };

    const timer = window.setInterval(refresh, 5000);
    const timeout = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      setPollTimedOut(true);
      window.clearInterval(timer);
    }, remaining);

    refresh();

    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [payment?.id, payment?.status, paymentWatchable, pollToken, session?.id]);

  useEffect(() => {
    if (!payment || payment.payment_method !== "pix" || !isActivePixStatus(payment.status) || pixExpired) return;
    setPixNow(Date.now());
    const timer = window.setInterval(() => setPixNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [payment?.id, payment?.payment_method, payment?.status, pixExpired]);

  useEffect(() => {
    if (!session?.id || !payment || payment.payment_method !== "pix") return;
    if (!isActivePixStatus(payment.status)) {
      expireSubmitRef.current = null;
      return;
    }
    if (!pixExpired || expireSubmitRef.current === payment.id) return;
    expireSubmitRef.current = payment.id;
    expireBillingPayment(session.id, payment.id)
      .then(setPayment)
      .catch(() => {
        setPayment((current) => (current ? { ...current, status: "expired" } : current));
      });
  }, [payment?.id, payment?.payment_method, payment?.status, pixExpired, session?.id]);

  useEffect(() => {
    const cleanCep = digitsOnly(address.zip_code);
    if (cepLookupRef.current) {
      window.clearTimeout(cepLookupRef.current);
      cepLookupRef.current = null;
    }
    if (cleanCep.length !== 8) {
      setCepLoading(false);
      return;
    }
    if (cleanCep === lastCepLookupRef.current) return;
    setCepLoading(true);
    setCepStatus("");
    cepLookupRef.current = window.setTimeout(async () => {
      try {
        const found = await lookupCep(cleanCep);
        lastCepLookupRef.current = cleanCep;
        if (!found) {
          setCepStatus("Não conseguimos localizar o CEP. Preencha o endereço manualmente.");
          return;
        }
        setAddress((current) => ({
          ...current,
          zip_code: found.zip_code,
          street_name: found.street_name || current.street_name,
          neighborhood: found.neighborhood || current.neighborhood,
          city: found.city || current.city,
          federal_unit: found.federal_unit || current.federal_unit,
          complement: current.complement || found.complement || "",
        }));
      } catch {
        lastCepLookupRef.current = cleanCep;
        setCepStatus("Não conseguimos localizar o CEP. Preencha o endereço manualmente.");
      } finally {
        setCepLoading(false);
      }
    }, 450);
    return () => {
      if (cepLookupRef.current) window.clearTimeout(cepLookupRef.current);
    };
  }, [address.zip_code]);

  async function startCheckout(nextMethod: Method) {
    if (!session?.id || !plan) return;
    setLoading(true);
    setError("");
    try {
      const next = nextMethod === "pix" ? await createPixCheckout(session.id, plan.code) : await payWithCard(session.id, plan.code);
      setPayment(next);
      setPollTimedOut(false);
      setPollToken((value) => value + 1);
      if (nextMethod === "pix") {
        setPixNow(Date.now());
        expireSubmitRef.current = null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await startCheckout(method);
  }

  async function payWithCard(userId: string, planCode: string) {
    const documentNumber = digitsOnly(card.document);
    const sanitizedAddress = buildAddressPayload(address);
    if (!isAddressComplete(address)) {
      throw new Error("Complete o endereço de cobrança ou deixe-o em branco.");
    }
    const buyerName = splitFullName(session?.name);
    if (config?.mock_mode) {
      return createCardCheckout({
        user_id: userId,
        plan_code: planCode,
        mock: true,
        email: session?.email || undefined,
        first_name: buyerName.first_name || undefined,
        last_name: buyerName.last_name || undefined,
        cpf: documentNumber || undefined,
        installments: card.installments,
        payment_method_id: card.paymentMethodId,
        payer_identification_type: "CPF",
        payer_identification_number: documentNumber,
        address: sanitizedAddress,
        billing_address: sanitizedAddress,
      });
    }
    if (!config?.public_key || !window.MercadoPago) {
      throw new Error("Mercado Pago nao esta configurado ou ainda nao carregou.");
    }
    const [expirationMonth, expirationYear] = [card.month.padStart(2, "0"), card.year.length === 2 ? `20${card.year}` : card.year];
    const mp = new window.MercadoPago(config.public_key, { locale: "pt-BR" });
    const token = await mp.createCardToken({
      cardNumber: digitsOnly(card.number),
      cardholderName: card.name,
      cardExpirationMonth: expirationMonth,
      cardExpirationYear: expirationYear,
      securityCode: digitsOnly(card.cvv),
      identificationType: "CPF",
      identificationNumber: documentNumber,
    });
    return createCardCheckout({
      user_id: userId,
      plan_code: planCode,
      email: session?.email || undefined,
      first_name: buyerName.first_name || undefined,
      last_name: buyerName.last_name || undefined,
      cpf: documentNumber || undefined,
      card_token: token.id,
      installments: card.installments,
      payment_method_id: card.paymentMethodId,
      payer_identification_type: "CPF",
      payer_identification_number: documentNumber,
      address: sanitizedAddress,
      billing_address: sanitizedAddress,
    });
  }

  async function regeneratePix() {
    setMethod("pix");
    await startCheckout("pix");
  }

  async function refreshStatus() {
    if (!session?.id || !payment) return;
    setRefreshingStatus(true);
    try {
      const next = await getBillingPayment(session.id, payment.id);
      setPayment(next);
      setPollTimedOut(false);
      setPollToken((value) => value + 1);
      if (!isTerminalStatus(next.status)) {
        pollSessionRef.current = { paymentId: next.id, startedAt: Date.now() };
      }
    } finally {
      setRefreshingStatus(false);
    }
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
                      <label>Mes<input className="cf-input" inputMode="numeric" maxLength={2} value={card.month} onChange={(e) => setCard({ ...card, month: e.target.value })} required={!config?.mock_mode} /></label>
                      <label>Ano<input className="cf-input" inputMode="numeric" maxLength={4} value={card.year} onChange={(e) => setCard({ ...card, year: e.target.value })} required={!config?.mock_mode} /></label>
                      <label>CVV<input className="cf-input" inputMode="numeric" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} required={!config?.mock_mode} /></label>
                    </div>
                    <div className="cf-grid cf-two">
                      <label>CPF<input className="cf-input" inputMode="numeric" value={card.document} onChange={(e) => setCard({ ...card, document: e.target.value })} required={!config?.mock_mode} /></label>
                      <label>Bandeira<select className="cf-select" value={card.paymentMethodId} onChange={(e) => setCard({ ...card, paymentMethodId: e.target.value })}><option value="visa">Visa</option><option value="master">Mastercard</option><option value="amex">Amex</option></select></label>
                    </div>
                    <details className="cf-billing-address" open>
                      <summary>
                        <span className="cf-billing-address-title"><MapPin size={16} /> Endereco de cobranca</span>
                        <span>O endereco e usado para ajudar na validacao do pagamento.</span>
                      </summary>
                      <div className="cf-grid cf-two cf-billing-address-grid">
                        <label>CEP
                          <div className="cf-input-append">
                            <input
                              className="cf-input"
                              inputMode="numeric"
                              placeholder="00000-000"
                              value={address.zip_code}
                              onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
                            />
                            {cepLoading && <Loader2 size={16} className="cf-spin" />}
                          </div>
                        </label>
                        <label>UF<input className="cf-input" maxLength={2} value={address.federal_unit} onChange={(e) => setAddress({ ...address, federal_unit: e.target.value.toUpperCase() })} /></label>
                        <label className="cf-billing-span-2">Rua / Logradouro<input className="cf-input" value={address.street_name} onChange={(e) => setAddress({ ...address, street_name: e.target.value })} /></label>
                        <label>Número<input className="cf-input" value={address.street_number} onChange={(e) => setAddress({ ...address, street_number: e.target.value })} /></label>
                        <label>Complemento<input className="cf-input" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} /></label>
                        <label className="cf-billing-span-2">Bairro<input className="cf-input" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} /></label>
                        <label className="cf-billing-span-2">Cidade<input className="cf-input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></label>
                      </div>
                      {cepStatus && <div className="cf-help-text cf-billing-help">{cepStatus}</div>}
                    </details>
                  </div>
                )}
                <Button variant="primary" type="submit" disabled={loading || !plan}>{loading ? "Processando..." : method === "pix" ? "Gerar Pix" : "Pagar com cartao"}</Button>
              </form>
            </Card>
          </div>
          {payment && (
            <PaymentResult
              payment={payment}
              pixExpired={Boolean(pixExpired)}
              remainingPixSeconds={remainingPixSeconds}
              loading={loading}
              pollTimedOut={pollTimedOut}
              refreshingStatus={refreshingStatus}
              onGenerateNewPix={regeneratePix}
              onRefreshStatus={refreshStatus}
            />
          )}
        </section>
      </main>
    </AuthGuard>
  );
}

function PaymentResult({
  payment,
  pixExpired,
  remainingPixSeconds,
  loading,
  pollTimedOut,
  refreshingStatus,
  onGenerateNewPix,
  onRefreshStatus,
}: {
  payment: BillingPayment;
  pixExpired: boolean;
  remainingPixSeconds: number;
  loading: boolean;
  pollTimedOut: boolean;
  refreshingStatus: boolean;
  onGenerateNewPix: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
}) {
  const isPix = payment.payment_method === "pix";
  const showPixPanel = isPix && !["paid", "approved", "rejected", "cancelled", "canceled", "refunded", "charged_back", "failed"].includes(payment.status);
  const statusLabel = formatPaymentStatus(payment.status);
  const statusClass = statusToneClass(payment.status);
  const expirationValue = payment.date_of_expiration ?? payment.expires_at;
  const isAwaitingReview = isPollingStatus(payment.status);
  const analysisMessage = payment.payment_method === "card" && (payment.status === "processing" || payment.status === "in_process")
    ? "Seu pagamento está em análise pelo Mercado Pago. Assim que for aprovado, seu plano será liberado automaticamente."
    : payment.status === "pending"
      ? "Seu pagamento está aguardando confirmação do Mercado Pago. Assim que houver retorno, atualizaremos automaticamente."
      : "";
  const statusDetailMessage = formatPaymentStatusDetail(payment.status_detail);
  const timeoutMessage = payment.payment_method === "card" && pollTimedOut && isAwaitingReview
    ? "O Mercado Pago ainda está analisando seu pagamento. Você pode sair desta tela; avisaremos/liberaremos o plano automaticamente quando houver confirmação."
    : "";

  async function copyPix() {
    if (!payment.qr_code || pixExpired) return;
    await navigator.clipboard.writeText(payment.qr_code);
  }

  return (
    <Card title="Resultado do pagamento">
      <div className="cf-grid cf-three">
        <div className="cf-row"><span>Metodo</span><strong>{formatPaymentMethod(payment.payment_method)}</strong></div>
        <div className="cf-row"><span>Valor</span><strong>{formatPrice(payment.amount_cents)}</strong></div>
        <div className="cf-row"><span>Status</span><span className={statusClass}>{statusLabel}</span></div>
      </div>
      {expirationValue && isPix && !pixExpired && <p className="cf-muted">Este QR Code expira em {formatCountdown(remainingPixSeconds)}</p>}
      {isPix && pixExpired && (
        <div className="cf-pix-expired-box">
          <div className="cf-auth-error cf-pix-expired">Este QR Code expirou. Gere um novo Pix para continuar.</div>
          <Button type="button" variant="primary" onClick={onGenerateNewPix} disabled={loading}><RefreshCw size={16} /> Gerar novo Pix</Button>
        </div>
      )}
      {(payment.status === "paid" || payment.status === "approved") && <div className="cf-auth-success">Pagamento aprovado.</div>}
      {analysisMessage && <div className="cf-help-text">{analysisMessage}</div>}
      {statusDetailMessage && <div className="cf-help-text">{statusDetailMessage}</div>}
      {timeoutMessage && (
        <div className="cf-pix-expired-box">
          <div className="cf-help-text">{timeoutMessage}</div>
          <div className="cf-pix-actions">
            <Button type="button" variant="primary" onClick={onRefreshStatus} disabled={refreshingStatus}>{refreshingStatus ? "Consultando..." : "Consultar status novamente"}</Button>
            <Link href="/minha-assinatura" className="cf-btn">Voltar para meus planos</Link>
          </div>
        </div>
      )}
      {payment.checkout_url && <a className="cf-btn cf-pix-open-checkout" href={payment.checkout_url} target="_blank" rel="noreferrer">Abrir checkout Mercado Pago</a>}
      {payment.payment_method === "card" && isAwaitingReview && !pollTimedOut && (
        <div className="cf-pix-actions">
          <Button type="button" onClick={onRefreshStatus} disabled={refreshingStatus}>{refreshingStatus ? "Consultando..." : "Consultar status novamente"}</Button>
          <Link href="/minha-assinatura" className="cf-btn">Voltar para meus planos</Link>
        </div>
      )}
      {showPixPanel && (
        <div className="cf-pix-result">
          <div className="cf-pix-intro">Escaneie o QR Code ou copie o código Pix para pagar.</div>
          <div className={`cf-pix-qr-shell ${pixExpired ? "expired" : ""}`}>
            {payment.qr_code_base64 && !pixExpired ? (
              <img className="cf-pix-qr" src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code Pix" />
            ) : (
              <div className="cf-pix-qr cf-pix-qr-placeholder">QR Code indisponível.</div>
            )}
          </div>
          {payment.qr_code && (
            <div className="cf-pix-code-block">
              <textarea className="cf-input cf-pix-code" readOnly value={payment.qr_code} />
              <div className="cf-pix-actions">
                <Button type="button" onClick={copyPix} disabled={pixExpired}>Copiar código Pix</Button>
              </div>
            </div>
          )}
        </div>
      )}
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
