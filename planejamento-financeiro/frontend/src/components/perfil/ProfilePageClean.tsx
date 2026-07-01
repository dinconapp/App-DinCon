"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PhoneField } from "@/components/auth/PhoneField";
import { useProfile } from "@/hooks/useProfile";
import { getSession } from "@/services/authService";
import { getUserBilling } from "@/services/billingService";
import { updateSessionProfile } from "@/services/authService";
import { WhatsAppAuthorizedAccountsCard } from "./WhatsAppAuthorizedAccountsCard";
import type { BillingOverview } from "@/types/billing";

export function ProfilePageClean({ userId, onInitial, onDone }: { userId: string; onInitial: (initial: string) => void; onDone: (message: string) => void }) {
  const { profile, loading, save } = useProfile(userId);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [billing, setBilling] = useState<BillingOverview | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name, email: profile.email ?? "", phone: profile.phone ?? "" });
      onInitial(profile.initial);
    }
  }, [profile, onInitial]);

  useEffect(() => {
    const session = getSession();
    if (!session?.id) return;
    getUserBilling(session.id).then(setBilling).catch(() => setBilling(null));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const updated = await save(form);
    updateSessionProfile({ name: updated.name, email: updated.email, phone: updated.phone });
    onDone("Perfil salvo");
  }

  if (loading || !profile) return <div className="cf-card">Carregando perfil...</div>;
  return (
    <div className="cf-grid">
      <SectionHeader title="Perfil" description="Gerencie seus dados pessoais, segurança, integrações e assinatura." />
      <div className="cf-grid cf-two">
        <Card title="Dados pessoais">
          <form className="cf-form" onSubmit={submit}>
            <label>E-mail<input className="cf-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <PhoneField value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
            <label>Nome<input className="cf-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <Button variant="primary" type="submit">Salvar dados pessoais</Button>
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
        <WhatsAppAuthorizedAccountsCard userId={userId} onDone={onDone} canManage={Boolean(billing?.whatsapp_enabled)} />
        <Card title="Assinatura">
          <p className="cf-muted">Consulte seu plano atual e ative o WhatsApp dentro da área autenticada.</p>
          <a className="cf-btn" href="/minha-assinatura">Minha assinatura</a>
        </Card>
      </div>
    </div>
  );
}
