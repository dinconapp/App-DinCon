export type WhatsAppAccount = {
  id: string;
  user_id: string;
  phone_number: string;
  phone_number_e164?: string | null;
  phone_number_masked?: string | null;
  alias?: string | null;
  provider: string;
  provider_identity?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type WhatsAppAccountPayload = {
  user_id: string;
  phone_number: string;
  alias: string;
  provider: "twilio";
};

export type WhatsAppAccountUpdatePayload = {
  alias?: string | null;
  phone_number?: string | null;
  active?: boolean | null;
};
