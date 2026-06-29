"use client";

import { ChangeEvent, FocusEvent, useEffect, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function parseCurrency(value: string, allowNegative: boolean) {
  const isNegative = allowNegative && value.includes("-");
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  const parsed = Number(digits) / 100;
  return isNegative ? -parsed : parsed;
}

export function CurrencyInput({
  value,
  onChange,
  allowNegative = false,
  required = false
}: {
  value: number;
  onChange: (value: number) => void;
  allowNegative?: boolean;
  required?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(() => formatCurrency(value));

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = parseCurrency(event.target.value, allowNegative);
    setDisplayValue(formatCurrency(nextValue));
    onChange(nextValue);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setDisplayValue(formatCurrency(parseCurrency(event.target.value, allowNegative)));
  }

  return (
    <input
      className="cf-input"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      aria-label="Valor em reais"
    />
  );
}
