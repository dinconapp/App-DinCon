"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InternationalPhoneField, normalizeInternationalPhone } from "./InternationalPhoneField";
import { useWhatsappAccounts } from "@/hooks/useWhatsappAccounts";

function displayPhone(value: string) {
  return value.replace("whatsapp:", "");
}

export function WhatsappIntegrationCard({ userId, onDone }: { userId: string; onDone: (message: string) => void }) {
  const { items, loading, create, remove } = useWhatsappAccounts(userId);
  const [phone, setPhone] = useState("+55 ");
  const [error, setError] = useState("");
  const active = items[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedPhone = normalizeInternationalPhone(phone);
    if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
      setError("Informe o telefone em formato internacional. Ex.: +55 11 99999-9999.");
      return;
    }
    await create(normalizedPhone);
    setError("");
    setPhone("+55 ");
    onDone("WhatsApp vinculado");
  }

  async function removeAccount(id: string) {
    await remove(id);
    onDone("Vinculo removido");
  }

  return (
    <Card title="Integrações">
      <div className="cf-grid">
        <div className="cf-row">
          <div>
            <div className="cf-row-title">{active ? displayPhone(active.phone_number) : "Nenhum WhatsApp vinculado"}</div>
            <div className="cf-row-sub">{active ? "WhatsApp vinculado" : "Vincule seu número para registrar lançamentos por mensagem."}</div>
          </div>
          <MessageCircle size={22} color={active ? "#43E6A3" : "#8F99A8"} />
        </div>
        <p className="cf-muted">Envie mensagens para o número WhatsApp da aplicação para registrar lançamentos por texto ou áudio.</p>
        {!active && (
          <form className="cf-form" onSubmit={submit}>
            <InternationalPhoneField value={phone} onChange={setPhone} />
            {error && <div className="cf-auth-error">{error}</div>}
            <Button variant="primary" type="submit" disabled={loading}>Vincular WhatsApp</Button>
          </form>
        )}
        {active && <Button icon={<Trash2 size={16} />} onClick={() => removeAccount(active.id)}>Remover vínculo</Button>}
      </div>
    </Card>
  );
}
