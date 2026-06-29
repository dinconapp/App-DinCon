const formatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Money({ value = 0, size = "md", tone }: { value?: number; size?: "sm" | "md" | "lg"; tone?: "income" | "expense" | "neutral" }) {
  const [int, dec] = formatter.format(Math.abs(value)).split(",");
  const colorClass = tone && tone !== "neutral" ? ` cf-money-${tone}` : "";
  return (
    <span className={`cf-money cf-money-${size}${colorClass}`}>
      <span className="cf-cur">{value < 0 ? "-R$" : "R$"}</span>
      <span>{int}</span>
      <span className="cf-dec">,{dec}</span>
    </span>
  );
}
