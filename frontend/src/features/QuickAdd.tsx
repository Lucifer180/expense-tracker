import { useState, type FormEvent } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { api, json } from "@/lib/api";
import type { ParsedExpense } from "@/lib/types";
import { cn } from "@/lib/cn";

const EXAMPLES = ["spent 450 on swiggy yesterday", "uber to airport 820", "electricity bill 1,240 last friday"];

// Natural-language entry: AI only suggests, the user confirms in the editor before anything is saved.
export function QuickAdd({ onParsed }: { onParsed: (p: ParsedExpense) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (text.trim().length < 2 || busy) return;
    setBusy(true);
    setError("");
    try {
      const parsed = await api<ParsedExpense>("/ai/parse-expense", { method: "POST", body: json({ text: text.trim() }) });
      onParsed(parsed);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't understand that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className={cn("flex items-center gap-2 rounded-xl border bg-white py-1.5 pr-1.5 pl-3.5 transition-colors", error ? "border-rose-300" : "border-neutral-200 focus-within:border-neutral-900")}>
        <Sparkles className="size-4 shrink-0 text-neutral-400" aria-hidden />
        <label htmlFor="quick-add" className="sr-only">Describe an expense</label>
        <input id="quick-add" value={text} maxLength={300} disabled={busy}
          onChange={(e) => { setText(e.target.value); setError(""); }}
          placeholder="Describe an expense — e.g. spent 450 on swiggy yesterday"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400" />
        <button type="submit" disabled={busy || text.trim().length < 2} aria-label="Parse expense"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:opacity-40">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)}
              className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-800">
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
