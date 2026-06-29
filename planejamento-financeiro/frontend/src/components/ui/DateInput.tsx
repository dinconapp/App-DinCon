"use client";

import { ChangeEvent, useEffect, useState } from "react";

function isoToDisplay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function displayToIso(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return "";
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DateInput({ value, onChange, required = false }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));

  useEffect(() => {
    setDisplayValue(isoToDisplay(value));
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDisplayValue = maskDate(event.target.value);
    setDisplayValue(nextDisplayValue);
    const nextIsoValue = displayToIso(nextDisplayValue);
    if (nextIsoValue) onChange(nextIsoValue);
    if (!nextDisplayValue) onChange("");
  }

  return (
    <input
      className="cf-input"
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      maxLength={10}
      value={displayValue}
      onChange={handleChange}
      required={required}
      aria-label="Data no formato dd/mm/aaaa"
    />
  );
}
