export function getBudgetTypeFromTransaction(item: any): string | null {
  return (
    item?.budget_type ??
    item?.budgetType ??
    item?.budget?.budget_type ??
    item?.budget?.budgetType ??
    null
  );
}

export function isFixedBudgetTransaction(item: any): boolean {
  const budgetType = String(getBudgetTypeFromTransaction(item) ?? "").toLowerCase();
  return Boolean(item?.budget_id ?? item?.budgetId) && (
    budgetType === "fixed" ||
    budgetType === "fixo" ||
    budgetType === "fixa"
  );
}

export function isLooseTransaction(item: any): boolean {
  return !isFixedBudgetTransaction(item);
}
