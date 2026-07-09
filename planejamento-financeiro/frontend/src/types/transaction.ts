export type TransactionKind = "income" | "expense";
export type TransactionStatus = "paid" | "pending" | "canceled";

export type Transaction = {
  id: string;
  user_id: string;
  budget_id?: string | null;
  category_id: string | null;
  kind: TransactionKind;
  title: string;
  amount: number;
  transaction_date: string;
  status: TransactionStatus;
  category_name?: string | null;
  category_color?: string | null;
  budget_description?: string | null;
  budget_type?: string | null;
  is_fixed_bill: boolean;
  category_name?: string | null;
};

export type TransactionPayload = Omit<Transaction, "id" | "category_name" | "category_color" | "budget_description" | "budget_type" | "is_fixed_bill"> & {
  category_name?: string | null;
};

export type TransactionListResponse = {
  items: Transaction[];
  total_income: number;
  total_expense: number;
};
