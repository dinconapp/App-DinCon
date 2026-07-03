import { api } from "./api";
import type { User } from "@/types/user";

export async function getUser(userId: string) {
  const { data } = await api.get<User>(`/users/${userId}`);
  return data;
}

export async function getUserByEmail(email: string) {
  const { data } = await api.get<User>("/users/lookup", { params: { email } });
  return data;
}

export async function createUser(payload: Pick<User, "name" | "email" | "phone" | "zip_code" | "address_number" | "residence_type"> & Partial<Pick<User, "initial_balance" | "base_month">>) {
  const { data } = await api.post<User>("/users", payload);
  return data;
}

export async function updateUser(userId: string, payload: Pick<User, "name" | "email" | "phone" | "zip_code" | "address_number" | "residence_type"> & Partial<Pick<User, "initial_balance" | "base_month">>) {
  const { data } = await api.put<User>(`/users/${userId}`, payload);
  return data;
}

export async function getHealth() {
  const { data } = await api.get("/health");
  return data as { status: string; app_env: string; database_connected: boolean; database_name: string };
}
