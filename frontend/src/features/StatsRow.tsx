import { ProgressRingCard } from "@/components/opensourceui/progress-ring-card";
import { Card, Eyebrow } from "@/components/ui";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { MonthStats } from "@/lib/types";

export function StatsRow({ stats }: { stats: MonthStats | null }) {
  const total = stats?.total_spent ?? 0;
  const budget = stats?.total_budget ?? null;
  const change = stats?.change_vs_previous_pct ?? null;
  const usedPct = budget ? Math.round((total / budget) * 100) : 0;

  const stages = (stats?.categories ?? [])
    .filter((c) => c.budget)
    .slice(0, 4)
    .map((c) => ({
      label: c.category,
      value: c.budget_used_pct ?? 0,
      color: (c.budget_used_pct ?? 0) > 100 ? "bg-rose-500" : (c.projected_budget_pct ?? 0) > 100 ? "bg-amber-400" : "bg-emerald-500",
    }));

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-start">
      <Card>
        <Eyebrow>Spent</Eyebrow>
        <p className="mt-3 text-3xl font-light tracking-tight text-neutral-900 tabular-nums">{money(total)}</p>
        <p className="mt-1 text-xs text-neutral-500">
          {stats?.is_current_month ? `Day ${stats.days_elapsed} of ${stats.days_in_month}` : "Full month"}
        </p>
      </Card>
      <Card>
        <Eyebrow>Budget left</Eyebrow>
        <p className={cn("mt-3 text-3xl font-light tracking-tight tabular-nums", budget && total > budget ? "text-rose-600" : "text-neutral-900")}>
          {budget ? money(budget - total) : "—"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">{budget ? `of ${money(budget)} across budgeted categories` : "No budgets set"}</p>
      </Card>
      <Card>
        <Eyebrow>vs last month</Eyebrow>
        <p className={cn("mt-3 text-3xl font-light tracking-tight tabular-nums", change == null ? "text-neutral-900" : change > 0 ? "text-rose-600" : "text-emerald-700")}>
          {change == null ? "—" : `${change > 0 ? "+" : ""}${change}%`}
        </p>
        <p className="mt-1 text-xs text-neutral-500">Last month: {money(stats?.previous_month_total ?? 0)}</p>
      </Card>
      <ProgressRingCard
        className="w-full rounded-2xl border-neutral-200 md:w-60"
        title="Budget used"
        progress={Math.min(usedPct, 100)}
        progressLabel={usedPct > 100 ? `${usedPct}% — over` : "of budget"}
        ringStartColor={usedPct > 100 ? "#f43f5e" : "#10b981"}
        ringEndColor={usedPct > 100 ? "#f43f5e" : "#10b981"}
        stages={stages.length ? stages : [{ label: "No budgets", value: 0, color: "bg-neutral-200" }]}
      />
    </div>
  );
}
