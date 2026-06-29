export type StatusKey =
  | "planned"
  | "pending"
  | "paid"
  | "received"
  | "overdue"
  | "canceled"
  | "projected"
  | "whatsapp"
  | "manual"
  | "fixed_bill";

const labels: Record<StatusKey, string> = {
  planned: "Previsto",
  pending: "Pendente",
  paid: "Pago",
  received: "Recebido",
  overdue: "Atrasado",
  canceled: "Cancelado",
  projected: "Projetado",
  whatsapp: "WhatsApp",
  manual: "Manual",
  fixed_bill: "Conta fixa",
};

export function StatusBadge({ status, label }: { status: StatusKey; label?: string }) {
  return <span className={`cf-status-badge cf-status-${status}`}>{label ?? labels[status]}</span>;
}
