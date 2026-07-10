import { Money } from "@/components/ui/Money";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { RowActionsMenu } from "@/components/ui/RowActionsMenu";
import { StatusBadge, type StatusKey } from "@/components/ui/StatusBadge";
import type { Transaction } from "@/types/transaction";
import { truncateText } from "@/utils/text";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function statusFor(item: Transaction): StatusKey {
  if (item.status === "canceled") return "canceled";
  if (item.status === "paid") return item.kind === "income" ? "received" : "paid";
  return new Date(`${item.transaction_date}T23:59:59`).getTime() < Date.now() ? "overdue" : "pending";
}

export function TransactionRow({ item, onEdit, onDelete }: { item: Transaction; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={`cf-row cf-row-${item.kind}`}>
      <div style={{ minWidth: 0 }}>
        <div className="cf-row-title" title={item.title}>{truncateText(item.title)}</div>
        <div className="cf-row-sub" title={`${formatDate(item.transaction_date)} - ${item.category_name ?? "Sem categoria"}`}>{truncateText(`${formatDate(item.transaction_date)} - ${item.category_name ?? "Sem categoria"}`)}</div>
        <div className="cf-badge-line">
          <StatusBadge status={statusFor(item)} />
          <OriginBadge transaction={item} />
        </div>
      </div>
      <div className="cf-actions">
        <Money value={item.kind === "expense" ? -item.amount : item.amount} size="sm" tone={item.kind === "expense" ? "expense" : "income"} />
        <RowActionsMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
