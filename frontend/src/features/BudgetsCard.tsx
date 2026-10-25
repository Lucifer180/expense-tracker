import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Eyebrow, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { CATEGORIES, type Budget, type Category, type MonthStats } from "@/lib/types";

type Props = {
  budgets: Budget[];
  stats: MonthStats | null;
  onSave: (category: Category, limit: number) => Promise<void>;
  onDelete: (category: Category) => Promise<void>;
};

function barColor(pct: number, projected: number | null) {
  if (pct > 100) return "bg-rose-500";
  if ((projected ?? 0) > 100 || pct > 85) return "bg-amber-400";
  return "bg-emerald-500";
}

export function BudgetsCard({ budgets, stats, onSave, onDelete }: Props) {
  const [category, setCategory] = useState<Category>("Food");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const spentBy = new Map(stats?.categories.map((c) => [c.category, c]) ?? []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(limit);
    if (!n || n <= 0) return setError("Enter a monthly limit.");
    setBusy(true);
    setError("");
    try {
      await onSave(category, n);
      setLimit("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save budget.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Eyebrow>Monthly budgets</Eyebrow>
      <div className="mt-4 space-y-4">
        {budgets.length === 0 ? (
          <p className="text-sm text-neutral-500">No budgets yet. Add one below so insights can tell you when you're overspending.</p>
        ) : (
          budgets.map((b) => {
            const s = spentBy.get(b.category);
            const spent = s?.spent ?? 0;
            const pct = Math.round((spent / b.monthly_limit) * 100);
            return (
              <div key={b.category} className="group">
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-neutral-900">{b.category}</span>
                  <span className="flex items-center gap-1.5 tabular-nums text-neutral-500">
                    <span className={cn(pct > 100 && "font-medium text-rose-600")}>{money(spent)}</span>
                    <span className="text-neutral-300">/</span>
                    {money(b.monthly_limit)}
                    <button type="button" aria-label={`Remove ${b.category} budget`} onClick={() => onDelete(b.category)}
                      className="ml-1 flex size-6 items-center justify-center rounded text-neutral-300 hover:bg-rose-50 hover:text-rose-600 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.category} ${pct}% of budget`}>
                  <div className={cn("h-full rounded-full transition-all duration-500", barColor(pct, s?.projected_budget_pct ?? null))} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                {s?.projected_budget_pct != null && s.projected_budget_pct > 100 && pct <= 100 ? (
                  <p className="mt-1 text-xs text-amber-700">On pace for {money(s.projected_month_end ?? 0)} by month end</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="mt-5 border-t border-neutral-100 pt-4">
        <div className="flex gap-2">
          <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-36 shrink-0">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input aria-label="Monthly limit" className="min-w-0" inputMode="decimal" placeholder="₹ limit" value={limit} onChange={(e) => { setLimit(e.target.value); setError(""); }} />
          <Button type="submit" variant="secondary" disabled={busy} aria-label="Save budget" className="px-3"><Plus className="size-4" /></Button>
        </div>
        {error ? <p role="alert" className="mt-1.5 text-xs text-rose-600">{error}</p> : <p className="mt-1.5 text-xs text-neutral-400">Saving an existing category updates its limit.</p>}
      </form>
    </Card>
  );
}
