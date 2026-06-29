"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { changePassword, getSession } from "@/services/authService";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getSession()) router.replace("/login");
  }, [router]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }
    try {
      changePassword(currentPassword, password);
      setError("");
      setMessage("Senha alterada com sucesso.");
    } catch (err) {
      setMessage("");
      setError(err instanceof Error ? err.message : "Não foi possível trocar a senha.");
    }
  }

  return (
    <AuthShell title="Trocar senha" subtitle="Atualize sua senha de acesso." footer={<Link href="/dashboard">Voltar ao sistema</Link>}>
      <form className="cf-form" onSubmit={submit}>
        <PasswordField label="Senha atual" value={currentPassword} onChange={setCurrentPassword} />
        <PasswordField label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        {error && <div className="cf-auth-error">{error}</div>}
        {message && <div className="cf-auth-success">{message}</div>}
        <Button variant="primary" type="submit">Salvar nova senha</Button>
      </form>
    </AuthShell>
  );
}
