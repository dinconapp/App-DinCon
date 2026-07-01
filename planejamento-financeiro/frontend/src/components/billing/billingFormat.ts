export function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);
}

export function formatBillingDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function formatPaymentMethod(value: string) {
  if (value === "pix") return "Pix";
  if (value === "card") return "Cartao";
  return value || "-";
}

export function formatPaymentStatus(value: string) {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    paid: "Aprovado",
    pending: "Aguardando pagamento",
    processing: "Processando",
    in_process: "Processando",
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

export function statusToneClass(value: string) {
  if (value === "paid" || value === "approved" || value === "active") return "cf-billing-status paid";
  if (value === "pending" || value === "processing" || value === "in_process") return "cf-billing-status pending";
  if (value === "expired") return "cf-billing-status expired";
  if (value === "canceled" || value === "cancelled" || value === "refunded") return "cf-billing-status canceled";
  if (value === "charged_back" || value === "failed" || value === "rejected") return "cf-billing-status failed";
  return "cf-billing-status failed";
}
