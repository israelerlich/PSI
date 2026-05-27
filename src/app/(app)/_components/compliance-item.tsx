import { Check } from "lucide-react";

export function ComplianceItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] py-3 last:border-b-0 last:pb-0">
      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
        <Check aria-hidden="true" size={12} strokeWidth={2.4} />
      </div>
      <p className="text-[13.5px] leading-relaxed text-[var(--ink-2)]">{text}</p>
    </div>
  );
}
