import { api } from "./api";
import type { BillingAddress, BillingConfig, BillingOverview, BillingPayment, BillingPlan } from "@/types/billing";

export async function getBillingPlans() {
  const { data } = await api.get<BillingPlan[]>("/billing/plans");
  return data;
}

export async function getBillingConfig() {
  const { data } = await api.get<BillingConfig>("/billing/config");
  return data;
}

export async function getUserBilling(userId: string) {
  const { data } = await api.get<BillingOverview>("/billing/me", { params: { user_id: userId } });
  return data;
}

export async function createPixCheckout(userId: string, planCode: string, renewal = false) {
  const { data } = await api.post<BillingPayment>("/billing/checkout/pix", { user_id: userId, plan_code: planCode, renewal });
  return data;
}

export async function createCardCheckout(payload: {
  user_id: string;
  plan_code: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  cpf?: string | null;
  card_token?: string | null;
  token?: string | null;
  installments?: number;
  payment_method_id?: string | null;
  issuer_id?: string | null;
  payer_identification_type?: string | null;
  payer_identification_number?: string | null;
  address?: BillingAddress | null;
  billing_address?: BillingAddress | null;
  mock?: boolean;
  renewal?: boolean;
}) {
  const { data } = await api.post<BillingPayment>("/billing/checkout/card", payload);
  return data;
}

export async function getBillingPayment(userId: string, paymentId: string) {
  const { data } = await api.get<BillingPayment>(`/billing/payments/${paymentId}`, { params: { user_id: userId } });
  return data;
}

export async function expireBillingPayment(userId: string, paymentId: string) {
  const { data } = await api.patch<BillingPayment>(`/billing/payments/${paymentId}/expire`, null, { params: { user_id: userId } });
  return data;
}
