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
    pending: "Pendente",
    paid: "Pago",
    failed: "Falhou",
    canceled: "Cancelado",
    cancelled: "Cancelado",
    processing: "Processando",
    active: "Ativa",
    inactive: "Inativa",
  };
  return labels[value] ?? value;
}

export function statusToneClass(value: string) {
  if (value === "paid" || value === "active") return "cf-billing-status paid";
  if (value === "pending" || value === "processing") return "cf-billing-status pending";
  return "cf-billing-status failed";
}
