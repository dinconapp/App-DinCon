"use client";

export function DateInput({ value, onChange, required = false }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <input
      className="cf-input"
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      aria-label="Selecione uma data"
    />
  );
}
