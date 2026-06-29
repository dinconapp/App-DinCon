import { Money } from "@/components/ui/Money";

export function InitialBalanceForm({ value }: { value: number }) {
  return (
    <div>
      <div className="cf-muted">Saldo inicial atual</div>
      <Money value={value} size="lg" tone={value >= 0 ? "income" : "expense"} />
    </div>
  );
}
