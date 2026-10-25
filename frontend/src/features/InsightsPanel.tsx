import { useEffect, useState } from "react";
import { Lightbulb, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Button, Card, Eyebrow } from "@/components/ui";
import { SpinLoader } from "@/components/opensourceui/spin-loader";
import { api } from "@/lib/api";
import { monthLabel } from "@/lib/format";
import type { Insights } from "@/lib/types";

export function InsightsPanel({ month, hasData }: { month: string; hasData: boolean }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setInsights(null); setError(""); }, [month]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await api<{ insights: Insights }>(`/ai/insights?month=${month}`);
      setInsights(res.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate insights.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Eyebrow>AI review</Eyebrow>
          <h2 className="mt-1 font-serif text-2xl text-neutral-900">How did {monthLabel(month)} go?</h2>
        </div>
        <Button onClick={generate} disabled={loading || !hasData} variant={insights ? "secondary" : "primary"}>
          <Sparkles className="size-4" /> {insights ? "Regenerate" : "Get insights"}
        </Button>
      </div>

      {!hasData ? <p className="mt-4 text-sm text-neutral-500">Add some expenses for this month first.</p> : null}
      {error ? <p role="alert" className="mt-4 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-neutral-500"><SpinLoader size="sm" label="Generating insights" /> Reading your month…</div>
      ) : null}

      {insights && !loading ? (
        <div className="mt-5 space-y-5">
          <p className="max-w-2xl text-base leading-7 text-neutral-700">{insights.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <TrendingUp className="size-4 text-rose-500" /> Could have been better
              </p>
              {insights.overspent.length ? (
                <ul className="space-y-2.5">
                  {insights.overspent.map((n, i) => (
                    <li key={i} className="text-sm leading-6 text-neutral-600"><span className="font-medium text-rose-600">{n.category}.</span> {n.note}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-neutral-500">Nothing over budget. Nice.</p>}
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <TrendingDown className="size-4 text-emerald-600" /> Went well
              </p>
              {insights.went_well.length ? (
                <ul className="space-y-2.5">
                  {insights.went_well.map((n, i) => (
                    <li key={i} className="text-sm leading-6 text-neutral-600"><span className="font-medium text-emerald-700">{n.category}.</span> {n.note}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-neutral-500">Set budgets to see what's on track.</p>}
            </div>
          </div>
          {insights.suggestions.length ? (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900"><Lightbulb className="size-4 text-amber-500" /> Try this</p>
              <ol className="space-y-2">
                {insights.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-6 text-neutral-600">
                    <span className="font-mono text-xs leading-6 text-neutral-400">{String(i + 1).padStart(2, "0")}</span>{s}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          <p className="text-xs text-neutral-400">Numbers are calculated exactly; the wording is written by AI.</p>
        </div>
      ) : null}
    </Card>
  );
}
