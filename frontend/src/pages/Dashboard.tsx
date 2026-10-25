import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Plus } from "lucide-react";
import { ExpensesTable } from "@/components/opensourceui/expenses-table";
import { SpinLoader } from "@/components/opensourceui/spin-loader";
import { Button, Card, Eyebrow, Select, Toast } from "@/components/ui";
import { BudgetsCard } from "@/features/BudgetsCard";
import { ExpenseEditor } from "@/features/ExpenseEditor";
import { InsightsPanel } from "@/features/InsightsPanel";
import { QuickAdd } from "@/features/QuickAdd";
import { StatsRow } from "@/features/StatsRow";
import { api, json } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { currentMonth, monthBounds, monthLabel, shiftMonth } from "@/lib/format";
import { CATEGORIES, type Budget, type Category, type Expense, type MonthStats, type ParsedExpense } from "@/lib/types";

type EditorState =
  | { mode: "closed" }
  | { mode: "new"; initial?: Partial<ParsedExpense>; fromAI?: boolean }
  | { mode: "edit"; expense: Expense };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<MonthStats | null>(null);
  const [filter, setFilter] = useState<"" | Category>("");
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [toast, setToast] = useState<{ message: string; tone?: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    const { start, end } = monthBounds(month);
    try {
      const [ex, bu, st] = await Promise.all([
        api<Expense[]>(`/expenses?start=${start}&end=${end}&limit=200`),
        api<Budget[]>("/budgets"),
        api<MonthStats>(`/ai/stats?month=${month}`),
      ]);
      setExpenses(ex);
      setBudgets(bu);
      setStats(st);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Couldn't load data", tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const visible = useMemo(() => (filter ? expenses.filter((e) => e.category === filter) : expenses), [expenses, filter]);
  const isCurrent = month === currentMonth();
  const closeEditor = useCallback(() => setEditor({ mode: "closed" }), []);

  async function saveExpense(value: ParsedExpense) {
    if (editor.mode === "edit") {
      await api(`/expenses/${editor.expense.id}`, { method: "PATCH", body: json(value) });
      setToast({ message: "Expense updated" });
    } else {
      await api("/expenses", { method: "POST", body: json(value) });
      setToast({ message: `Added ${value.description || value.category}` });
    }
    await load();
  }

  async function deleteExpense(e: Expense) {
    if (!window.confirm(`Delete "${e.description || e.category}"?`)) return;
    try {
      await api(`/expenses/${e.id}`, { method: "DELETE" });
      setToast({ message: "Expense deleted" });
      await load();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Couldn't delete", tone: "error" });
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <p className="font-serif text-2xl text-neutral-900">Ledger</p>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"><ChevronLeft className="size-4" /></button>
            <span className="min-w-32 text-center text-sm font-medium text-neutral-900">{monthLabel(month)}</span>
            <button type="button" aria-label="Next month" disabled={isCurrent} onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30"><ChevronRight className="size-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-sm text-neutral-500 md:inline">{user?.email}</span>
            <Button variant="ghost" onClick={logout} aria-label="Sign out" className="px-2.5"><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 md:py-8">
        <Card>
          <Eyebrow>Quick add</Eyebrow>
          <div className="mt-3"><QuickAdd onParsed={(p) => setEditor({ mode: "new", initial: p, fromAI: true })} /></div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-16"><SpinLoader label="Loading your month" /></div>
        ) : (
          <>
            <StatsRow stats={stats} />
            <div className="grid gap-4 md:grid-cols-[1fr_22rem] md:items-start">
              <ExpensesTable
                title="Expenses"
                subtitle={`${visible.length} in ${monthLabel(month)}`}
                expenses={visible}
                emptyMessage={filter ? `No ${filter} expenses this month.` : "Nothing logged this month yet. Try the quick add above."}
                onEdit={(expense) => setEditor({ mode: "edit", expense })}
                onDelete={deleteExpense}
                toolbar={
                  <div className="flex gap-2">
                    <Select aria-label="Filter by category" value={filter} onChange={(e) => setFilter(e.target.value as "" | Category)} className="h-9 w-40">
                      <option value="">All categories</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                    <Button variant="secondary" className="h-9 px-3" onClick={() => setEditor({ mode: "new" })}><Plus className="size-4" /> Add</Button>
                  </div>
                }
              />
              <BudgetsCard
                budgets={budgets}
                stats={stats}
                onSave={async (category, limit) => {
                  await api(`/budgets/${category}`, { method: "PUT", body: json({ monthly_limit: limit }) });
                  setToast({ message: `${category} budget saved` });
                  await load();
                }}
                onDelete={async (category) => {
                  await api(`/budgets/${category}`, { method: "DELETE" });
                  setToast({ message: `${category} budget removed` });
                  await load();
                }}
              />
            </div>
            <InsightsPanel month={month} hasData={(stats?.total_spent ?? 0) > 0} />
          </>
        )}
      </main>

      <ExpenseEditor
        open={editor.mode !== "closed"}
        title={editor.mode === "edit" ? "Edit expense" : editor.mode === "new" && editor.fromAI ? "Check and save" : "Add expense"}
        submitLabel={editor.mode === "edit" ? "Save changes" : "Add expense"}
        initial={editor.mode === "edit" ? editor.expense : editor.mode === "new" ? editor.initial : undefined}
        onClose={closeEditor}
        onSave={saveExpense}
      />
      {toast ? <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} /> : null}
    </div>
  );
}
