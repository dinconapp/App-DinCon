import { api } from "./api";
import type { Category } from "@/types/category";

export async function getCategories(type?: "income" | "expense") {
  const { data } = await api.get<Category[]>("/categories", { params: type ? { type } : undefined });
  return data;
}
