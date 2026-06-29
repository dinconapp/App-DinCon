import { api } from "./api";
import type { Budget, BudgetPayload } from "@/types/budget";

export async function getBudgets(userId: string) {
  const { data } = await api.get<Budget[]>("/budgets", { params: { user_id: userId } });
  return data;
}

export async function saveBudget(payload: BudgetPayload, id?: string) {
  const { data } = id
    ? await api.put<Budget>(`/budgets/${id}`, payload)
    : await api.post<Budget>("/budgets", payload);
  return data;
}

export async function deleteBudget(id: string) {
  await api.delete(`/budgets/${id}`);
}
