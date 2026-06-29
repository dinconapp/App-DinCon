export type User = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  initial: string;
  initial_balance: number;
  base_month: string;
  budget_count: number;
  transaction_count: number;
  database_connected: boolean;
  active?: boolean;
  email_verified?: boolean;
  verification_status?: string;
};
