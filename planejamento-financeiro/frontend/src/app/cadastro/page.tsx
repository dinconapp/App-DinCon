"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { PhoneField } from "@/components/auth/PhoneField";
import { Button } from "@/components/ui/Button";
import { authErrorMessage, resendEmailCode, signUp, verifyEmail } from "@/services/authService";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function requiredMessage(label: string) {
    return `${label} obrigatório.`;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await signUp(name, email, phone, password);
      setEmail(result.email);
      setMessage("Cadastro iniciado. Enviamos um código por SMS.");
      setStep("verify");
    } catch (err) {
      setError(authErrorMessage(err, "Não foi possível cadastrar."));
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
      setMessage("Celular verificado com sucesso. Você já pode acessar sua conta.");
      setTimeout(() => router.push("/login"), 900);
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
      setMessage("Enviamos um novo código de verificação por SMS.");
    } catch (err) {
      setError(authErrorMessage(err, "Não foi possível reenviar o código."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title={step === "register" ? "Crie sua conta" : "Verifique seu celular"} subtitle={step === "register" ? "Configure seu acesso e comece a organizar seu fluxo de caixa." : "Enviamos um código por SMS para o celular informado."} footer={<><span>Já tem conta?</span><Link href="/login">Entrar</Link></>}>
      {step === "register" ? (
        <form className="cf-form" onSubmit={submit}>
          <label>Nome<input className="cf-input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" onInvalid={(event) => event.currentTarget.setCustomValidity(requiredMessage("Nome"))} onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label>
          <label>E-mail<input className="cf-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" onInvalid={(event) => event.currentTarget.setCustomValidity(requiredMessage("E-mail"))} onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label>
          <PhoneField value={phone} onChange={setPhone} />
          <PasswordField label="Senha" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordField label="Confirmar senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {error && <div className="cf-auth-error">{error}</div>}
          {message && <div className="cf-auth-success">{message}</div>}
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Cadastrando..." : "Cadastrar"}</Button>
        </form>
      ) : (
        <form className="cf-form" onSubmit={submitVerification}>
          <p>Enviamos um codigo por SMS para seu celular.</p>
          <label>E-mail<input className="cf-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onInvalid={(event) => event.currentTarget.setCustomValidity(requiredMessage("E-mail"))} onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label>
          <label>Código de verificação<input className="cf-input" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" onInvalid={(event) => event.currentTarget.setCustomValidity(requiredMessage("Código de verificação"))} onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label>
          {error && <div className="cf-auth-error">{error}</div>}
          {message && <div className="cf-auth-success">{message}</div>}
          <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Verificando..." : "Verificar SMS"}</Button>
          <Button type="button" onClick={resend} disabled={submitting}>Reenviar codigo</Button>
        </form>
      )}
    </AuthShell>
  );
}
