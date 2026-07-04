"use client";

import type { InvalidEvent } from "react";

function digitsToInternationalPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "+";
  if (digits.startsWith("55")) {
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return `+${digits}`;
}

export function normalizeInternationalPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function InternationalPhoneField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("WhatsApp internacional obrigatório.");
  }

  return (
    <label>WhatsApp internacional
      <input
        className="cf-input"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+55 11 99999-9999"
        maxLength={19}
        value={value}
        onChange={(event) => onChange(digitsToInternationalPhone(event.target.value))}
        onInvalid={handleInvalid}
        onInput={(event) => event.currentTarget.setCustomValidity("")}
        required
      />
    </label>
  );
}
