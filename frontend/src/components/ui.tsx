// Small shared primitives following the Opensource UI design rules
// (flat surfaces, hairline borders, border-only focus, rose for errors).
import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

export const fieldCls =
  "h-10 w-full rounded-lg border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 ring-0 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-0 disabled:bg-neutral-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(fieldCls, className)} {...p} />;
});

export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldCls, "pr-8", className)} {...p}>{children}</select>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" };
export function Button({ variant = "primary", className, ...p }: BtnProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-neutral-900 text-white hover:bg-neutral-800",
        variant === "secondary" && "border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400",
        variant === "ghost" && "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className,
      )}
      {...p}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-2xl border border-neutral-200 bg-white p-4 md:p-5", className)}>{children}</section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">{children}</p>;
}

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-neutral-900">{children}</label>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-neutral-900/20 p-4 md:items-center" onMouseDown={onClose}>
      <div role="dialog" aria-modal aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Snackbar in the style of Opensource UI's Toast Notification Banner.
export function Toast({ message, tone = "success", onDone }: { message: string; tone?: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <output role="status" aria-live="polite"
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800">
      <span className={cn("flex size-5 items-center justify-center rounded-full", tone === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
        {tone === "success" ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
      </span>
      {message}
    </output>
  );
}
