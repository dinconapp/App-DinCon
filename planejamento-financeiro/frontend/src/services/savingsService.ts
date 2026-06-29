import { api } from "./api";
import type { SavingsDashboard, SavingsInvestment, SavingsInvestmentPayload, SavingsProjectionPoint } from "@/types/savings";

export async function getSavingsDashboard(userId: string, months = 12) {
  const { data } = await api.get<SavingsDashboard>("/savings/dashboard", { params: { user_id: userId, months } });
  return data;
}

export async function getSavingsInvestments(userId: string) {
  const { data } = await api.get<SavingsInvestment[]>("/savings/investments", { params: { user_id: userId } });
  return data;
}

export async function createSavingsInvestment(payload: SavingsInvestmentPayload) {
  const { data } = await api.post<SavingsInvestment>("/savings/investments", payload);
  return data;
}

export async function updateSavingsInvestment(id: string, payload: Omit<SavingsInvestmentPayload, "user_id">) {
  const { data } = await api.put<SavingsInvestment>(`/savings/investments/${id}`, payload);
  return data;
}

export async function deleteSavingsInvestment(id: string) {
  await api.delete(`/savings/investments/${id}`);
}

export async function getSavingsProjection(userId: string, months = 12) {
  const { data } = await api.get<SavingsProjectionPoint[]>("/savings/projection", { params: { user_id: userId, months } });
  return data;
}
