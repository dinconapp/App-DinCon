export type BudgetKind = "income" | "expense";
export type BudgetType = "fixed" | "variable";

export type Budget = {
  id: string;
  user_id: string;
  description: string;
  kind: BudgetKind;
  category_id: string;
  budget_type: BudgetType;
  amount: number;
  start_month?: string | null;
  end_month?: string | null;
  has_due_date: boolean;
  due_day?: number | null;
  active: boolean;
  category_name?: string | null;
  category_color?: string | null;
  category_icon_key?: string | null;
};

export type BudgetPayload = Omit<Budget, "id" | "active" | "category_name" | "category_color" | "category_icon_key">;
