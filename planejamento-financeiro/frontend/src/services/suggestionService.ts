import { api } from "./api";
import type { Suggestion, SuggestionPayload } from "@/types/suggestion";

export async function getSuggestions(userId: string) {
  const { data } = await api.get<Suggestion[]>("/suggestions", { params: { user_id: userId } });
  return data;
}

export async function createSuggestion(payload: SuggestionPayload) {
  const { data } = await api.post<Suggestion>("/suggestions", payload);
  return data;
}
