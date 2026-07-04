"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PhoneField } from "@/components/auth/PhoneField";
import { useProfile } from "@/hooks/useProfile";
import { getSession, updateSessionProfile } from "@/services/authService";
import { getUserBilling } from "@/services/billingService";
import { lookupCep } from "@/services/cepService";
import { WhatsappIntegrationCard } from "./WhatsappIntegrationCard";
import type { BillingOverview } from "@/types/billing";

function maskCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function hasActivePaidPlan(billing: BillingOverview | null) {
  const status = String(billing?.subscription?.status ?? "").toLowerCase();
  if (["active", "paid", "trialing"].includes(status)) return true;
  return Boolean(billing?.has_active_subscription && billing?.current_plan?.code === "pro");
}

export function ProfileForm({ userId, onInitial, onDone }: { userId: string; onInitial: (initial: string) => void; onDone: (message: string, tone?: "success" | "error") => void }) {
  const { profile, loading, save } = useProfile(userId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    zip_code: "",
    street_name: "",
    neighborhood: "",
    city: "",
    federal_unit: "",
    complement: "",
    address_number: "",
    residence_type: "",
  });
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [cepStatus, setCepStatus] = useState("");
  const canUseWhatsApp = hasActivePaidPlan(billing);

  function requiredMessage(label: string) {
    return `${label} obrigatório.`;
  }

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        zip_code: maskCep(profile.zip_code ?? ""),
        street_name: profile.street_name ?? "",
        neighborhood: profile.neighborhood ?? "",
        city: profile.city ?? "",
        federal_unit: profile.federal_unit ?? "",
        complement: profile.complement ?? "",
        address_number: profile.address_number ?? "",
        residence_type: profile.residence_type ?? "",
      });
      onInitial(profile.initial);
    }
  }, [profile, onInitial]);

  useEffect(() => {
    const session = getSession();
    if (!session?.id) return;
    getUserBilling(session.id).then(setBilling).catch(() => setBilling(null));
  }, []);

  useEffect(() => {
    const cleanCep = form.zip_code.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setCepStatus("");
      return;
    }
    let canceled = false;
    setCepStatus("Buscando endereco...");
    const timer = window.setTimeout(async () => {
      try {
        const found = await lookupCep(cleanCep);
        if (canceled) return;
        if (!found) {
          setCepStatus("Nao conseguimos localizar o CEP. Preencha o endereco manualmente.");
          return;
        }
        setForm((current) => ({
          ...current,
          zip_code: maskCep(found.zip_code),
          street_name: found.street_name || current.street_name,
          neighborhood: found.neighborhood || current.neighborhood,
          city: found.city || current.city,
          federal_unit: found.federal_unit || current.federal_unit,
          complement: found.complement || current.complement,
        }));
        setCepStatus("Endereco preenchido automaticamente.");
      } catch {
        if (!canceled) {
          setCepStatus("Nao conseguimos localizar o CEP. Preencha o endereco manualmente.");
        }
      }
    }, 450);
    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [form.zip_code]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.zip_code && form.zip_code.replace(/\D/g, "").length !== 8) {
      onDone("CEP inválido. Informe 8 dígitos.", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await save(form);
      updateSessionProfile({ name: updated.name, email: updated.email, phone: updated.phone });
      onDone("Dados salvos com sucesso.");
    } catch {
      onDone("Não foi possível salvar os dados. Tente novamente.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) return <div className="cf-card">Carregando perfil...</div>;

  return (
    <div className="cf-grid">
      <div className="cf-grid cf-two">
        <Card title="Dados pessoais">
          <form className="cf-form" onSubmit={submit}>
            <div className="cf-grid cf-two">
              <label>E-mail<input className="cf-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <PhoneField value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
              <label>Nome<input className="cf-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onInvalid={(event) => event.currentTarget.setCustomValidity(requiredMessage("Nome"))} onInput={(event) => event.currentTarget.setCustomValidity("")} required /></label>
              <label>CEP<input className="cf-input" inputMode="numeric" placeholder="00000-000" maxLength={9} value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: maskCep(e.target.value) })} /></label>
              <label>Número<input className="cf-input" inputMode="text" placeholder="Ex: 123" value={form.address_number} onChange={(e) => setForm({ ...form, address_number: e.target.value })} /></label>
              <label>Casa ou Apartamento
                <select className="cf-input cf-select" value={form.residence_type} onChange={(e) => setForm({ ...form, residence_type: e.target.value })}>
                  <option value="">Selecione</option>
                  <option className="bg-slate-900 text-slate-100" value="house">Casa</option>
                  <option className="bg-slate-900 text-slate-100" value="apartment">Apartamento</option>
                </select>
              </label>
            </div>
            {cepStatus && <div className="cf-help-text">{cepStatus}</div>}
            <div className="cf-grid cf-two">
              <label>Rua<input className="cf-input" value={form.street_name} onChange={(e) => setForm({ ...form, street_name: e.target.value })} /></label>
              <label>Bairro<input className="cf-input" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></label>
              <label>Cidade<input className="cf-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label>UF<input className="cf-input" value={form.federal_unit} onChange={(e) => setForm({ ...form, federal_unit: e.target.value.toUpperCase() })} maxLength={2} /></label>
              <label>Complemento<input className="cf-input" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} /></label>
            </div>
            <Button variant="primary" type="submit" disabled={saving}>Salvar dados pessoais</Button>
          </form>
        </Card>
        <Card title="Segurança">
          <div className={profile.email_verified ? "cf-auth-success" : "cf-auth-error"}>
            {profile.email_verified ? "Conta verificada por SMS." : "Pendente de verificação por SMS."}
          </div>
          <p className="cf-muted">A verificação por SMS protege o cadastro e a recuperação de senha.</p>
          <a className="cf-btn" href="/trocar-senha">Trocar senha</a>
        </Card>
      </div>
      <div className="cf-grid cf-two">
        {canUseWhatsApp ? (
          <WhatsappIntegrationCard userId={userId} onDone={onDone} />
        ) : (
          <Card title="Integrações">
            <div className="cf-grid">
              <div className="cf-row">
                <div>
                  <div className="cf-row-title">WhatsApp premium</div>
                  <div className="cf-row-sub">Recurso disponível apenas para assinantes.</div>
                </div>
                <span className="cf-billing-status pending">Bloqueado</span>
              </div>
              <p className="cf-muted">Assine um plano para vincular seu WhatsApp e registrar lançamentos por mensagem ou áudio.</p>
              <Link className="cf-btn" href="/planos">Ver planos</Link>
            </div>
          </Card>
        )}
        <Card title="Assinatura">
          <p className="cf-muted">Consulte seu plano atual, pagamentos e opções de upgrade.</p>
          <a className="cf-btn" href="/minha-assinatura">Minha assinatura</a>
        </Card>
      </div>
    </div>
  );
}
