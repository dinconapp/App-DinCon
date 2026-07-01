export type BillingPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_interval: string;
  features: string[];
};

export type BillingPayment = {
  id: string;
  user_id: string;
  plan_id: string | null;
  subscription_id: string | null;
  provider: string;
  provider_payment_id: string | null;
  provider_payload?: Record<string, unknown> | null;
  status_detail?: string | null;
  payment_method: string;
  status: string;
  amount_cents: number;
  currency: string;
  description: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  checkout_url: string | null;
  external_reference: string | null;
  sandbox: boolean;
  date_of_expiration?: string | null;
  expires_in_seconds?: number | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BillingAddress = {
  zip_code?: string | null;
  street_name?: string | null;
  street_number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  federal_unit?: string | null;
  complement?: string | null;
};

export type BillingSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  provider: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type BillingConfig = {
  provider: string;
  mock_mode: boolean;
  environment: string;
  public_key_configured: boolean;
  access_token_configured: boolean;
  public_key: string;
  app_public_url: string;
  api_public_url: string;
};
