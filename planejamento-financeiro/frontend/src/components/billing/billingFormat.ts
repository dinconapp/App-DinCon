export function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);
}

export function formatBillingDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function formatPaymentMethod(value: string) {
  if (value === "pix") return "Pix";
  if (value === "card") return "Cartão";
  return value || "-";
}

export function formatPaymentStatus(value: string) {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    paid: "Aprovado",
    pending: "Pendente",
    processing: "Em análise",
    in_process: "Em análise",
    failed: "Falhou",
    rejected: "Recusado",
    canceled: "Cancelado",
    cancelled: "Cancelado",
    expired: "Expirado",
    refunded: "Reembolsado",
    charged_back: "Contestação",
    active: "Ativa",
    inactive: "Inativa",
  };
  return labels[value] ?? value;
}

export function formatPaymentStatusDetail(value?: string | null) {
  if (!value) return "";
  const labels: Record<string, string> = {
    pending_review_manual: "Pagamento em análise manual pelo Mercado Pago.",
    cc_rejected_bad_filled_card_number: "Número do cartão inválido.",
    cc_rejected_bad_filled_date: "Data de validade inválida.",
    cc_rejected_bad_filled_security_code: "Código de segurança inválido.",
    cc_rejected_insufficient_amount: "Limite insuficiente.",
    cc_rejected_call_for_authorize: "O banco solicitou autorização da compra.",
    cc_rejected_other_reason: "Pagamento recusado. Tente outro cartão ou entre em contato com o banco.",
  };
  return labels[value] ?? value;
}

export function maskProviderPaymentId(value?: string | null) {
  if (!value) return "-";
  const normalized = String(value).trim();
  if (normalized.length <= 8) return normalized;
  return `${normalized.slice(0, 4)}…${normalized.slice(-4)}`;
}

export function statusToneClass(value: string) {
  if (value === "paid" || value === "approved" || value === "active") return "cf-billing-status paid";
  if (value === "pending") return "cf-billing-status pending";
  if (value === "processing" || value === "in_process") return "cf-billing-status alert";
  if (value === "expired") return "cf-billing-status expired";
  if (value === "canceled" || value === "cancelled" || value === "refunded") return "cf-billing-status canceled";
  if (value === "charged_back" || value === "failed" || value === "rejected") return "cf-billing-status failed";
  return "cf-billing-status failed";
}
