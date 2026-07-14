"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createSuggestion, getSuggestions } from "@/services/suggestionService";
import type { Suggestion } from "@/types/suggestion";

export function SuggestionsPage({ userId, onDone }: { userId: string; onDone: (message: string, tone?: "success" | "error") => void }) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", message: "" });

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await getSuggestions(userId));
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar as sugestoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createSuggestion({ user_id: userId, title: form.title, message: form.message });
      setForm({ title: "", message: "" });
      await load();
      onDone("Sugestão enviada com sucesso.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nao foi possivel enviar a sugestao.";
      setError(message);
      onDone(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cf-grid">
      <SectionHeader title="Caixa de Sugestões" description="Envie ideias, melhorias ou observações funcionais para o produto." />
      <div className="cf-grid cf-two">
        <Card title="Nova sugestão">
          <form className="cf-form" onSubmit={submit}>
            <label>Título<input className="cf-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={180} /></label>
            <label>Mensagem<textarea className="cf-input" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={4000} /></label>
            {error && <div className="cf-auth-error">{error}</div>}
            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar sugestão"}</Button>
          </form>
        </Card>

        <Card title="Sugestões enviadas">
          {loading && <div className="cf-card">Carregando sugestões...</div>}
          {!loading && !items.length && <EmptyState message="Nenhuma sugestão enviada ainda." />}
          {!loading && items.map((item) => (
            <div key={item.id} className="cf-row" style={{ alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div className="cf-row-title">{item.title}</div>
                <div className="cf-row-sub">{item.message}</div>
                <div className="cf-row-sub">{formatDate(item.created_at)}</div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
