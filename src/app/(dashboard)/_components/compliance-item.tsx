import { CheckCircle2 } from "lucide-react";

export function ComplianceItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-[var(--brand)]"
        size={18}
        strokeWidth={2}
      />
      <p className="text-sm leading-6 text-stone-600">{text}</p>
    </div>
  );
}
