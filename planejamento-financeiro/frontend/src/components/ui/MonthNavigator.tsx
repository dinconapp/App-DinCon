import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(" de ", "/");
}

export function MonthNavigator({ monthKey, onPrevious, onNext }: { monthKey: string; onPrevious: () => void; onNext: () => void }) {
  return (
    <div className="cf-month">
      <Button square icon={<ChevronLeft size={17} />} onClick={onPrevious} aria-label="Mês anterior" />
      <span>{formatMonth(monthKey)}</span>
      <Button square icon={<ChevronRight size={17} />} onClick={onNext} aria-label="Próximo mês" />
    </div>
  );
}
