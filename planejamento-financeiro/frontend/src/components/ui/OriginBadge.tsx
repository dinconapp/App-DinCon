import type { Transaction } from "@/types/transaction";
import { StatusBadge, type StatusKey } from "./StatusBadge";

export function getTransactionOrigin(transaction: Transaction): { label: string; status: StatusKey } {
  if (transaction.is_fixed_bill) return { label: "Conta fixa", status: "fixed_bill" };
  if (transaction.budget_id && transaction.kind === "income") return { label: "Receita prevista", status: "projected" };
  return { label: "Manual", status: "manual" };
}

export function OriginBadge({ transaction }: { transaction: Transaction }) {
  const origin = getTransactionOrigin(transaction);
  return <StatusBadge status={origin.status} label={origin.label} />;
}
