import { api } from "./api";
import type { Dashboard } from "@/types/dashboard";

export async function getDashboard(userId: string, monthKey: string) {
  const { data } = await api.get<Dashboard>("/dashboard", { params: { user_id: userId, month_key: monthKey } });
  return data;
}
