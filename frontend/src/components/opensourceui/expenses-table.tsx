// Adapted from Opensource UI "Recent Transactions Table" (opensourceui.in, MIT):
// real data via props, INR formatting, category column, edit/delete actions.
import { forwardRef, useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { moneyExact, shortDate } from "@/lib/format";
import type { Expense } from "@/lib/types";

const PAGE_SIZE = 8;

type Props = Readonly<{
  title?: string;
  subtitle?: string;
  expenses: Expense[];
  toolbar?: ReactNode;
  emptyMessage?: string;
  onEdit?: (e: Expense) => void;
  onDelete?: (e: Expense) => void;
}> & Omit<ComponentPropsWithoutRef<"div">, "title">;

export const ExpensesTable = forwardRef<HTMLDivElement, Props>(function ExpensesTable(
  { className, title = "Expenses", subtitle, expenses, toolbar, emptyMessage = "No expenses yet.", onEdit, onDelete, ...props },
  ref,
) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages - 1) setPage(0); }, [page, totalPages]);
  const slice = useMemo(() => expenses.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [expenses, page]);

  return (
    <div ref={ref} className={cn("w-full overflow-hidden rounded-xl border border-neutral-200 bg-white", className)} {...props}>
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          {subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
        </div>
        {toolbar}
      </div>

      {expenses.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-neutral-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs text-neutral-500">
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">Category</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="w-16 px-2 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {slice.map((tx) => (
                <tr key={tx.id} className="group border-t border-neutral-100 transition-colors hover:bg-neutral-50/80">
                  <td className="max-w-[12rem] px-4 py-3">
                    <p className="truncate font-medium text-neutral-900">{tx.description || tx.category}</p>
                    <p className="text-xs text-neutral-500 md:hidden">{tx.category}</p>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">{tx.category}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-neutral-500">{shortDate(tx.spent_on)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-neutral-900 tabular-nums">{moneyExact(tx.amount)}</td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-0.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
                      {onEdit ? (
                        <button type="button" aria-label={`Edit ${tx.description}`} onClick={() => onEdit(tx)}
                          className="flex size-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900">
                          <Pencil className="size-3.5" />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button type="button" aria-label={`Delete ${tx.description}`} onClick={() => onDelete(tx)}
                          className="flex size-7 items-center justify-center rounded-md text-neutral-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expenses.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"
            className="flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors enabled:hover:bg-neutral-100 disabled:opacity-30">
            <ChevronLeft className="size-4" strokeWidth={2} />
          </button>
          <span className="text-xs text-neutral-500">Page {page + 1} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page"
            className="flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors enabled:hover:bg-neutral-100 disabled:opacity-30">
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}
    </div>
  );
});
