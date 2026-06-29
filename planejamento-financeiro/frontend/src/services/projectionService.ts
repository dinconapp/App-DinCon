import { api } from "./api";
import type { Projection } from "@/types/projection";

export async function getBalanceProjection(userId: string, months = 12) {
  const { data } = await api.get<Projection>("/projections/balance", { params: { user_id: userId, months } });
  return data;
}
