"use client";

function maskPhone(value: string) {
  let digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length <= 2) return `+55 ${digits}`;
  if (digits.length <= 6) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function PhoneField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label>Celular
      <input
        className="cf-input"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+55 (00) 00000-0000"
        maxLength={20}
        value={value}
        onChange={(event) => onChange(maskPhone(event.target.value))}
        required
      />
    </label>
  );
}
