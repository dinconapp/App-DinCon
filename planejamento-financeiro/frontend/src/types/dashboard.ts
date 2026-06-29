export type DashboardLine = {
  id: string;
  description: string;
  amount: number;
  realized?: number;
  category?: string;
  color?: string;
  due_day?: number;
  paid?: boolean;
  budget_type?: string;
};

export type Dashboard = {
  month_key: string;
  month_label: string;
  is_past: boolean;
  is_current: boolean;
  is_projected: boolean;
  total_income: number;
  total_expense: number;
  economy: number;
  saving_rate: number;
  accumulated_balance: number;
  planned_income: number;
  planned_expense: number;
  planned_fixed_expense: number;
  planned_variable_expense: number;
  real_income: number;
  real_expense: number;
  fixed_expenses: DashboardLine[];
  variable_expenses: DashboardLine[];
  incomes: DashboardLine[];
  pending_bills: DashboardLine[];
  paid_bills: DashboardLine[];
  pending_total: number;
  expenses_by_category: Array<{ category_id: string | null; category: string; amount: number; color: string }>;
  ranking_position: number;
  ranking_label: string;
};
