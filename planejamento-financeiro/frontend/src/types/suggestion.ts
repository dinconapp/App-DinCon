export type SuggestionStatus = "open" | "reviewing" | "closed";

export type Suggestion = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  status: SuggestionStatus;
  created_at: string;
  updated_at: string;
};

export type SuggestionPayload = {
  user_id: string;
  title: string;
  message: string;
};
