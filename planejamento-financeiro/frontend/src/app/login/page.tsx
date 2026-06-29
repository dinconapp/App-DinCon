"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { authErrorMessage, authErrorStatus, resendEmailCode, signIn, verifyEmail } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const authMessage = window.sessionStorage.getItem("dincon.auth.message");
    if (!authMessage) return;
    setMessage(authMessage);
    window.sessionStorage.removeItem("dincon.auth.message");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(authErrorMessage(err, "Não foi possível entrar."));
      if (authErrorStatus(err) === "email_not_verified") setShowVerify(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitVerification(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await verifyEmail(email, verificationCode);
      setMessage("Celular verificado com sucesso. Informe sua senha para entrar.");
      setShowVerify(false);
    } catch (err) {
      setError(authErrorMessage(err, "Código inválido ou expirado."));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await resendEmailCode(email);
      setMessage("Enviamos um novo código por SMS.");
      setShowVerify(true);
    } catch (err) {
      setError(authErrorMessage(err, "Não foi possível reenviar o código."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua área financeira com segurança." footer={<><Link href="/cadastro">Criar conta</Link><Link href="/esqueci-senha">Esqueci minha senha</Link></>}>
      {!showVerify ? (
        <form className="cf-form" onSubmit={submit}>
          <label>E-mail<input className="cf-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <PasswordField label="Senha" value={password} onChange={setPassword} />
          {error && <div className="cf-auth-error">{error}</div>}
          {message && <div className="cf-auth-success">{message}</div>}
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Entrando..." : "Entrar"}</Button>
          {error && <Button type="button" onClick={resend} disabled={submitting}>Reenviar codigo</Button>}
        </form>
      ) : (
        <form className="cf-form" onSubmit={submitVerification}>
          <p>Sua conta ainda precisa ser verificada. Informe o código enviado para seu celular.</p>
          <label>E-mail<input className="cf-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Código de verificação<input className="cf-input" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required /></label>
          {error && <div className="cf-auth-error">{error}</div>}
          {message && <div className="cf-auth-success">{message}</div>}
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Verificando..." : "Verificar SMS"}</Button>
          <Button type="button" onClick={resend} disabled={submitting}>Reenviar codigo</Button>
        </form>
      )}
    </AuthShell>
  );
}
