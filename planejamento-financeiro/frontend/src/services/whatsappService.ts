import { api } from "./api";
import type { WhatsAppAccount, WhatsAppAccountPayload, WhatsAppAccountUpdatePayload } from "@/types/whatsapp";

export async function getWhatsappAccounts(userId: string) {
  const { data } = await api.get<WhatsAppAccount[]>("/integrations/whatsapp/accounts", { params: { user_id: userId } });
  return data;
}

export async function createWhatsappAccount(payload: WhatsAppAccountPayload) {
  const { data } = await api.post<WhatsAppAccount>("/integrations/whatsapp/accounts", payload);
  return data;
}

export async function updateWhatsappAccount(id: string, payload: WhatsAppAccountUpdatePayload) {
  const { data } = await api.patch<WhatsAppAccount>(`/integrations/whatsapp/accounts/${id}`, payload);
  return data;
}

export async function deactivateWhatsappAccount(id: string) {
  await api.patch(`/integrations/whatsapp/accounts/${id}/deactivate`);
}

export async function deleteWhatsappAccount(id: string) {
  await api.delete(`/integrations/whatsapp/accounts/${id}`);
}
