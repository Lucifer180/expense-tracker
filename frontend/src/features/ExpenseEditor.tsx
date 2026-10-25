import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Label, Modal, Select } from "@/components/ui";
import { CATEGORIES, type Category, type ParsedExpense } from "@/lib/types";
import { todayISO } from "@/lib/format";

type Props = {
  open: boolean;
  title: string;
  initial?: Partial<ParsedExpense>;
  submitLabel?: string;
  onClose: () => void;
  onSave: (value: ParsedExpense) => Promise<void>;
};

export function ExpenseEditor({ open, title, initial, submitLabel = "Save", onClose, onSave }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(initial?.amount != null ? String(initial.amount) : "");
    setCategory((initial?.category as Category) ?? "Food");
    setDescription(initial?.description ?? "");
    setDate(initial?.spent_on ?? todayISO());
    setError("");
  }, [open, initial]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return setError("Enter an amount greater than 0.");
    setBusy(true);
    setError("");
    try {
      await onSave({ amount: Math.round(n * 100) / 100, category, description: description.trim(), spent_on: date });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ex-amount">Amount (₹)</Label>
            <Input id="ex-amount" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" />
          </div>
          <div>
            <Label htmlFor="ex-date">Date</Label>
            <Input id="ex-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="ex-cat">Category</Label>
          <Select id="ex-cat" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="ex-desc">Description</Label>
          <Input id="ex-desc" value={description} maxLength={255} onChange={(e) => setDescription(e.target.value)} placeholder="Swiggy dinner" />
        </div>
        {error ? <p role="alert" className="text-xs text-rose-600">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
