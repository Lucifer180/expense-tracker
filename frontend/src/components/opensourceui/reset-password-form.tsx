// Built in the Opensource UI forms style (matches login/forgot-password forms).
import { forwardRef, useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ResetPasswordFormProps = Readonly<{
  onSubmit: (password: string) => Promise<void>;
  className?: string;
}>;

const inputCls = (error?: string) =>
  cn(
    "h-11 w-full rounded-md border bg-white py-2 pr-10 pl-3.5 text-sm text-neutral-900 ring-0 transition-[border-color,background-color] duration-200 outline-none placeholder:text-neutral-400 focus:ring-0 disabled:cursor-not-allowed disabled:bg-neutral-50",
    error ? "border-rose-300 focus:border-rose-400" : "border-neutral-200 focus:border-neutral-900",
  );

export const ResetPasswordForm = forwardRef<HTMLFormElement, ResetPasswordFormProps>(function ResetPasswordForm(
  { onSubmit, className },
  ref,
) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setSubmitError("");
    try {
      await onSubmit(password);
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't reset your password.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className={cn("w-full max-w-md rounded-3xl bg-white p-6 font-sans md:p-8", className)}>
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Password updated</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">Your password has been changed. Sign in with the new one.</p>
        <Link to="/login" className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800">
          Go to sign in <ChevronRight size={15} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <form ref={ref} noValidate onSubmit={handleSubmit} aria-busy={busy} className={cn("w-full max-w-md rounded-3xl bg-white p-6 font-sans md:p-8", className)}>
      <Link to="/login" className="mb-5 inline-flex items-center gap-1.5 text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-900">
        <ChevronLeft size={14} aria-hidden /> Back to sign in
      </Link>
      <div className="mb-7">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Choose a new password</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">Pick something you haven't used here before.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor={`${id}-pw`} className="mb-1.5 block text-sm font-medium text-neutral-900">New password</label>
          <div className="relative">
            <input id={`${id}-pw`} type={show ? "text" : "password"} autoComplete="new-password" disabled={busy}
              value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              aria-invalid={Boolean(errors.password)} className={inputCls(errors.password)} placeholder="At least 8 characters" />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)}
              className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center text-neutral-400 hover:text-neutral-800">
              {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
          {errors.password ? <p role="alert" className="mt-1.5 text-xs text-rose-600">{errors.password}</p> : null}
        </div>
        <div>
          <label htmlFor={`${id}-confirm`} className="mb-1.5 block text-sm font-medium text-neutral-900">Confirm password</label>
          <input id={`${id}-confirm`} type={show ? "text" : "password"} autoComplete="new-password" disabled={busy}
            value={confirm} onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
            aria-invalid={Boolean(errors.confirm)} className={inputCls(errors.confirm)} placeholder="Repeat the password" />
          {errors.confirm ? <p role="alert" className="mt-1.5 text-xs text-rose-600">{errors.confirm}</p> : null}
        </div>
      </div>

      {submitError ? (
        <div role="alert" className="mt-5 flex items-start gap-2.5 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /><span>{submitError}</span>
        </div>
      ) : null}

      <button type="submit" disabled={busy}
        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
        {busy ? "Saving…" : "Update password"}
        {!busy ? <ChevronRight size={15} aria-hidden /> : null}
      </button>
    </form>
  );
});
