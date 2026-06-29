import { api } from "./api";

export type Bill = {
  budget_id: string;
  description: string;
  amount: number;
  due_day?: number;
  category_id: string;
  category_name: string;
  category_color?: string;
  paid: boolean;
};

export async function getBills(userId: string, monthKey: string) {
  const { data } = await api.get<{ pending: Bill[]; paid: Bill[] }>("/bills", { params: { user_id: userId, month_key: monthKey } });
  return data;
}

export async function payBill(userId: string, monthKey: string, budgetId: string) {
  await api.post(`/bills/${budgetId}/pay`, { user_id: userId, month_key: monthKey });
}

export async function unpayBill(userId: string, monthKey: string, budgetId: string) {
  await api.post(`/bills/${budgetId}/unpay`, { user_id: userId, month_key: monthKey });
}

export async function receiveIncome(userId: string, monthKey: string, budgetId: string) {
  await api.post(`/bills/${budgetId}/receive`, { user_id: userId, month_key: monthKey });
}

export async function unreceiveIncome(userId: string, monthKey: string, budgetId: string) {
  await api.post(`/bills/${budgetId}/unreceive`, { user_id: userId, month_key: monthKey });
}
