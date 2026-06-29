export type WhatsAppAccount = {
  id: string;
  user_id: string;
  phone_number: string;
  provider: string;
  provider_identity?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type WhatsAppAccountPayload = {
  user_id: string;
  phone_number: string;
  provider: "twilio";
};
