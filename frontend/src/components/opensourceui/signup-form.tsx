// Adapted from Opensource UI (opensourceui.in, MIT) — next/link swapped for react-router, server errors surfaced.
import {
  forwardRef,
  useCallback,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type ReactNode,
} from "react";

import { Link } from "react-router-dom";

import { AlertCircle, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormLinkProps = Readonly<{
  href: string;
  className?: string;
  children: ReactNode;
}>;

function isPlaceholderHref(href: string): boolean {
  return !href || href === "#";
}

function FormLink({ href, className, children }: FormLinkProps) {
  if (isPlaceholderHref(href)) {
    return (
      <button type="button" className={cn("cursor-pointer", className)}>
        {children}
      </button>
    );
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

type SignupFormValues = Readonly<{
  email: string;
  password: string;
  confirmPassword: string;
}>;

type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>;

export type SignupFormProps = Readonly<
  {
    title?: string;
    subtitle?: string;
    submitLabel?: string;
    loginPrompt?: string;
    loginHref?: string;
    loginLabel?: string;
    submitErrorMessage?: string;
    loading?: boolean;
    onSubmit?: (
      values: Omit<SignupFormValues, "confirmPassword">,
    ) => void | Promise<void>;
  } & Omit<ComponentPropsWithoutRef<"form">, "onSubmit">
>;

function validateSignup(values: SignupFormValues): SignupFormErrors {
  const errors: SignupFormErrors = {};
  const email = values.email.trim();

  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Password is required.";
  else if (values.password.length < 8)
    errors.password = "Use at least 8 characters.";
  else if (
    !/\d/.test(values.password) ||
    !/[^a-zA-Z0-9]/.test(values.password)
  ) {
    errors.password = "Include a number and a symbol.";
  }
  if (!values.confirmPassword)
    errors.confirmPassword = "Confirm your password.";
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export const SignupForm = forwardRef<HTMLFormElement, SignupFormProps>(
  function SignupForm(
    {
      className,
      title = "Create your account",
      subtitle = "Track spending, set budgets and get AI insights.",
      submitLabel = "Create account",
      loginPrompt = "Already have an account?",
      loginHref = "/login",
      loginLabel = "Sign in",
      submitErrorMessage = "We couldn't create your account. Please try again.",
      loading = false,
      onSubmit,
      onReset,
      ...props
    },
    ref,
  ) {
    const formId = useId();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<SignupFormErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const busy = loading || submitting;

    const clearError = useCallback((key: keyof SignupFormValues) => {
      setSubmitError("");
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }, []);

    const handleSubmit = useCallback(
      async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;

        const values: SignupFormValues = {
          email,
          password,
          confirmPassword,
        };
        const nextErrors = validateSignup(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        setSubmitError("");
        try {
          await onSubmit?.({
            email: email.trim(),
            password,
          });
        } catch (err) {
          setSubmitError(err instanceof Error && err.message ? err.message : submitErrorMessage);
        } finally {
          setSubmitting(false);
        }
      },
      [
        busy,
        confirmPassword,
        email,
        onSubmit,
        password,
        submitErrorMessage,
      ],
    );

    const handleReset = useCallback(
      (event: FormEvent<HTMLFormElement>) => {
        onReset?.(event);
        if (event.defaultPrevented) return;
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setErrors({});
        setSubmitError("");
      },
      [onReset],
    );

    return (
      <form
        ref={ref}
        data-slot="signup-form"
        aria-busy={busy}
        noValidate
        onSubmit={handleSubmit}
        onReset={handleReset}
        className={cn(
          "w-full max-w-md rounded-3xl bg-white p-6 font-sans md:p-8",
          className,
        )}
        {...props}
      >
        <div className="mb-7">
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-neutral-950">
            {title}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">
            {subtitle}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor={`${formId}-email`}
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Email
            </label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              disabled={busy}
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? `${formId}-email-error` : undefined
              }
              onChange={(event) => {
                setEmail(event.target.value);
                clearError("email");
              }}
              className={cn(
                "h-11 w-full rounded-md border bg-white px-3.5 text-sm ring-0 transition-colors outline-none focus:ring-0 disabled:bg-neutral-50",
                errors.email
                  ? "border-rose-300"
                  : "border-neutral-200 focus:border-neutral-900",
              )}
              placeholder="you@company.com"
            />
            {errors.email ? (
              <p
                id={`${formId}-email-error`}
                role="alert"
                className="mt-1.5 text-xs text-rose-600"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${formId}-password`}
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Password
            </label>
            <div className="relative">
              <input
                id={`${formId}-password`}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={busy}
                value={password}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? `${formId}-password-error` : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearError("password");
                }}
                className={cn(
                  "h-11 w-full rounded-md border bg-white py-2 pr-10 pl-3.5 text-sm ring-0 transition-colors outline-none focus:ring-0 disabled:bg-neutral-50",
                  errors.password
                    ? "border-rose-300"
                    : "border-neutral-200 focus:border-neutral-900",
                )}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                disabled={busy}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-900 disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff size={16} aria-hidden />
                ) : (
                  <Eye size={16} aria-hidden />
                )}
              </button>
            </div>
            {errors.password ? (
              <p
                id={`${formId}-password-error`}
                role="alert"
                className="mt-1.5 text-xs text-rose-600"
              >
                {errors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${formId}-confirm`}
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Confirm password
            </label>
            <input
              id={`${formId}-confirm`}
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={busy}
              value={confirmPassword}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? `${formId}-confirm-error` : undefined
              }
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                clearError("confirmPassword");
              }}
              className={cn(
                "h-11 w-full rounded-md border bg-white px-3.5 text-sm ring-0 transition-colors outline-none focus:ring-0 disabled:bg-neutral-50",
                errors.confirmPassword
                  ? "border-rose-300"
                  : "border-neutral-200 focus:border-neutral-900",
              )}
              placeholder="Re-enter password"
            />
            {errors.confirmPassword ? (
              <p
                id={`${formId}-confirm-error`}
                role="alert"
                className="mt-1.5 text-xs text-rose-600"
              >
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>

        </div>

        {submitError ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>{submitError}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : null}
          {busy ? "Creating account…" : submitLabel}
          {!busy ? <ChevronRight size={15} aria-hidden /> : null}
        </button>

        <p className="mt-5 text-center text-sm text-neutral-500">
          {loginPrompt}{" "}
          <FormLink
            href={loginHref}
            className="font-medium text-neutral-900 underline underline-offset-2"
          >
            {loginLabel}
          </FormLink>
        </p>
      </form>
    );
  },
);

SignupForm.displayName = "SignupForm";
