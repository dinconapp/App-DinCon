import { api } from "./api";
import type { Transaction, TransactionListResponse, TransactionPayload } from "@/types/transaction";

export type TransactionFilters = {
  kind?: "income" | "expense";
  category_id?: string;
  search?: string;
};

export async function getTransactions(userId: string, monthKey: string, filters: TransactionFilters = {}) {
  const { data } = await api.get<TransactionListResponse>("/transactions", {
    params: { user_id: userId, month_key: monthKey, ...filters }
  });
  return data;
}

export async function saveTransaction(payload: TransactionPayload, id?: string) {
  const { data } = id
    ? await api.put<Transaction>(`/transactions/${id}`, payload)
    : await api.post<Transaction>("/transactions", payload);
  return data;
}

export async function deleteTransaction(id: string) {
  await api.delete(`/transactions/${id}`);
}
