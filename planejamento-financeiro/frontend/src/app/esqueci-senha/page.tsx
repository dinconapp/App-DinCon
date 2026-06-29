"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { authErrorMessage, confirmPasswordReset, startPasswordReset } from "@/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await startPasswordReset(email);
      setMessage("Enviamos um código de verificação por SMS.");
      setStep("reset");
    } catch (err) {
      setError(authErrorMessage(err, "Não foi possível enviar o código."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(email, code, password);
      setError("");
      window.sessionStorage.setItem("dincon.auth.message", "Senha redefinida com sucesso. Entre com sua nova senha.");
      router.push("/login");
    } catch (err) {
      setMessage("");
      setError(authErrorMessage(err, "Não foi possível redefinir a senha."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Esqueci minha senha" subtitle="Informe seu e-mail para receber o código no celular cadastrado." footer={<Link href="/login">Voltar para login</Link>}>
      {step === "email" ? (
        <form className="cf-form" onSubmit={requestCode}>
          <label>E-mail<input className="cf-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <p>O código será enviado por SMS para o celular vinculado a este cadastro.</p>
          {error && <div className="cf-auth-error">{error}</div>}
          {message && <div className="cf-auth-success">{message}</div>}
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar código"}</Button>
        </form>
      ) : (
        <form className="cf-form" onSubmit={submit}>
          <label>E-mail<input className="cf-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <p>Informe o código recebido por SMS.</p>
          <label>Código de verificação<input className="cf-input" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required /></label>
          <PasswordField label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordField label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {error && <div className="cf-auth-error">{error}</div>}
          {message && <div className="cf-auth-success">{message}</div>}
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Redefinindo..." : "Redefinir senha"}</Button>
          <Button type="button" disabled={submitting} onClick={() => void startPasswordReset(email).then(() => setMessage("Enviamos um novo código por SMS.")).catch((err) => setError(authErrorMessage(err, "Não foi possível reenviar o código.")))}>Reenviar código</Button>
        </form>
      )}
    </AuthShell>
  );
}
