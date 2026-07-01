"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, MessageCircle, PencilLine, Plus, Power, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InternationalPhoneField, normalizeInternationalPhone } from "./InternationalPhoneField";
import { useWhatsappAccounts } from "@/hooks/useWhatsappAccounts";
import type { WhatsAppAccount } from "@/types/whatsapp";

function displayPhone(value: string | null | undefined) {
  if (!value) return "";
  return value.replace("whatsapp:", "");
}

export function WhatsAppAuthorizedAccountsCard({
  userId,
  onDone,
  canManage = true,
}: {
  userId: string;
  onDone: (message: string) => void;
  canManage?: boolean;
}) {
  const { items, loading, create, update, remove } = useWhatsappAccounts(userId);
  const [phone, setPhone] = useState("+55 ");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<WhatsAppAccount | null>(null);
  const [editingAlias, setEditingAlias] = useState("");
  const [editingPhone, setEditingPhone] = useState("+55 ");

  const sortedItems = useMemo(() => [...items].sort((a, b) => Number(b.active) - Number(a.active)), [items]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedPhone = normalizeInternationalPhone(phone);
    if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
      setError("Informe o telefone em formato internacional. Ex.: +55 11 99999-9999.");
      return;
    }
    if (!alias.trim()) {
      setError("Informe um apelido para identificar este número.");
      return;
    }
    try {
      await create(normalizedPhone, alias.trim());
      setError("");
      setPhone("+55 ");
      setAlias("");
      onDone("WhatsApp adicionado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel adicionar este WhatsApp.");
    }
  }

  function startEdit(item: WhatsAppAccount) {
    setEditing(item);
    setEditingAlias(item.alias ?? "");
    setEditingPhone(displayPhone(item.phone_number_e164 || item.phone_number) || "+55 ");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const normalizedPhone = normalizeInternationalPhone(editingPhone);
    if (!editingAlias.trim()) {
      setError("Informe um apelido para identificar este número.");
      return;
    }
    if (normalizedPhone && !/^\+\d{10,15}$/.test(normalizedPhone)) {
      setError("Informe o telefone em formato internacional. Ex.: +55 11 99999-9999.");
      return;
    }
    try {
      await update(editing.id, {
        alias: editingAlias.trim(),
        phoneNumber: normalizedPhone || null,
      });
      setError("");
      setEditing(null);
      onDone("WhatsApp atualizado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel atualizar este WhatsApp.");
    }
  }

  async function toggleActive(item: WhatsAppAccount) {
    try {
      await update(item.id, { active: !item.active });
      onDone(item.active ? "WhatsApp desativado" : "WhatsApp ativado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel alterar o status.");
    }
  }

  async function removeAccount(id: string) {
    await remove(id);
    onDone("Vinculo removido");
  }

  return (
    <Card title="WhatsApps autorizados">
      <div className="cf-grid">
        <div className="cf-row">
          <div>
            <div className="cf-row-title">{sortedItems.length ? `${sortedItems.length} número(s) autorizado(s)` : "Nenhum WhatsApp autorizado"}</div>
            <div className="cf-row-sub">Adicione pessoas autorizadas para lançar despesas e receitas pelo WhatsApp na mesma conta Din Con.</div>
          </div>
          <MessageCircle size={22} color={sortedItems.length ? "#43E6A3" : "#8F99A8"} />
        </div>
        <p className="cf-muted">Use apelidos como Pai, Filha, Esposa ou Sócio para identificar quem fez cada lançamento.</p>

        <div className="cf-grid">
          {sortedItems.map((item) => {
            const active = item.active;
            const isEditing = editing?.id === item.id;
            return (
              <div key={item.id} className="cf-card" style={{ padding: 16, borderRadius: 16 }}>
                {isEditing ? (
                  <form className="cf-grid" onSubmit={saveEdit}>
                    <label>Apelido<input className="cf-input" value={editingAlias} onChange={(e) => setEditingAlias(e.target.value)} placeholder="Ex.: Pai, Filha, Esposa, Sócio" /></label>
                    <InternationalPhoneField value={editingPhone} onChange={setEditingPhone} />
                    {error && <div className="cf-auth-error">{error}</div>}
                    <div className="cf-pix-actions">
                      <Button variant="primary" type="submit" disabled={loading}><Check size={16} /> Salvar</Button>
                      <Button type="button" onClick={() => setEditing(null)}><X size={16} /> Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <div className="cf-grid">
                    <div className="cf-row">
                      <div>
                        <div className="cf-row-title">{item.alias || "Principal"}</div>
                        <div className="cf-row-sub">{displayPhone(item.phone_number_masked || item.phone_number_e164 || item.phone_number)}</div>
                      </div>
                      <span className={active ? "cf-billing-status paid" : "cf-billing-status canceled"}>{active ? "Ativo" : "Inativo"}</span>
                    </div>
                    {canManage ? (
                      <div className="cf-row" style={{ flexWrap: "wrap", gap: 8 }}>
                        <Button type="button" icon={<PencilLine size={16} />} onClick={() => startEdit(item)}>Editar</Button>
                        <Button type="button" icon={<Power size={16} />} onClick={() => toggleActive(item)}>{active ? "Desativar" : "Ativar"}</Button>
                        <Button type="button" icon={<Trash2 size={16} />} onClick={() => removeAccount(item.id)}>Remover</Button>
                      </div>
                    ) : (
                      <div className="cf-help-text">O gerenciamento de WhatsApps fica disponível apenas no Plano WhatsApp.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canManage ? (
          <form className="cf-form" onSubmit={submit}>
            <label>Apelido<input className="cf-input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ex.: Pai, Filha, Esposa, Sócio" /></label>
            <InternationalPhoneField value={phone} onChange={setPhone} />
            {error && <div className="cf-auth-error">{error}</div>}
            <Button variant="primary" type="submit" disabled={loading}><Plus size={16} /> Adicionar WhatsApp</Button>
          </form>
        ) : (
          <div className="cf-auth-error">
            O uso pelo WhatsApp está disponível no Plano WhatsApp. Ative seu plano para cadastrar novos números autorizados.
          </div>
        )}
      </div>
    </Card>
  );
}
