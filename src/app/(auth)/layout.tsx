import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--ink-4)]">
            Clínica IA
          </p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[var(--ink)]">
            Painel do psicólogo
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
