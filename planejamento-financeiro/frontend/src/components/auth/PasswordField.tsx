"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PasswordField({ label, value, onChange, autoComplete = "current-password" }: { label: string; value: string; onChange: (value: string) => void; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>{label}
      <div className="cf-password-field">
        <input
          className="cf-input"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={6}
          required
        />
        <Button type="button" square icon={visible ? <EyeOff size={16} /> : <Eye size={16} />} onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} />
      </div>
    </label>
  );
}
