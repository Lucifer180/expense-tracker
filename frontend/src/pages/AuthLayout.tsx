import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-neutral-200 bg-white p-10 md:flex">
        <p className="font-serif text-2xl text-neutral-900">Ledger</p>
        <div>
          <h1 className="font-serif text-5xl leading-tight text-neutral-900">
            Know where your <span className="italic">money</span> goes.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-neutral-500">
            Type “spent 450 on Swiggy yesterday” and it's logged. Set budgets per category and get an honest monthly review.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">FastAPI · React · Postgres</p>
      </aside>
      <section className="flex flex-col items-center justify-center px-4 py-10">
        <p className="mb-6 font-serif text-3xl text-neutral-900 md:hidden">Ledger</p>
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white">{children}</div>
      </section>
    </main>
  );
}
