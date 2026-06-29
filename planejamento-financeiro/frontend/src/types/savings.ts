export type InterestType = "none" | "simple" | "compound";
export type InterestPeriod = "monthly" | "yearly";

export type SavingsInvestment = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  initial_amount: number;
  monthly_contribution: number;
  interest_type: InterestType;
  interest_rate: number;
  interest_period: InterestPeriod;
  start_month: string;
  end_month?: string | null;
  active: boolean;
};

export type SavingsInvestmentPayload = Omit<SavingsInvestment, "id" | "active">;

export type SavingsProjectionPoint = {
  month_key: string;
  month_label: string;
  invested_amount: number;
  interest_amount: number;
  projected_balance: number;
  monthly_contribution: number;
  accumulated_contributions: number;
  accumulated_interest: number;
};

export type SavingsDashboard = {
  total_invested_now: number;
  projected_balance: number;
  total_monthly_contribution: number;
  projected_interest: number;
  investments_count: number;
  best_projection: { id: string; name: string; projected_balance: number; accumulated_interest: number } | null;
  projection: SavingsProjectionPoint[];
  investments: SavingsInvestment[];
};
