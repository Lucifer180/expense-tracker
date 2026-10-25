export const CATEGORIES = [
  "Food", "Groceries", "Transport", "Shopping", "Bills", "Rent",
  "Entertainment", "Health", "Education", "Travel", "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type User = { id: number; email: string; created_at: string };

export type Expense = {
  id: number;
  amount: number;
  category: Category;
  description: string;
  spent_on: string;
};

export type ParsedExpense = Omit<Expense, "id">;

export type Budget = { category: Category; monthly_limit: number };

export type CategoryStat = {
  category: Category;
  spent: number;
  budget: number | null;
  budget_used_pct: number | null;
  projected_month_end: number | null;
  projected_budget_pct: number | null;
  previous_month: number;
  change_vs_previous_pct: number | null;
};

export type MonthStats = {
  month: string;
  is_current_month: boolean;
  days_elapsed: number;
  days_in_month: number;
  total_spent: number;
  total_budget: number | null;
  previous_month_total: number;
  change_vs_previous_pct: number | null;
  categories: CategoryStat[];
  top_expenses: { description: string; category: string; amount: number; spent_on: string }[];
};

export type Insights = {
  summary: string;
  overspent: { category: string; note: string }[];
  went_well: { category: string; note: string }[];
  suggestions: string[];
};
