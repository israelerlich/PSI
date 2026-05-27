"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaid } from "@/server/actions/billing/markPaid";

export function MarkPaidButton({ billingId }: { billingId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markPaid({ billingId });
          router.refresh();
        })
      }
      className="btn btn-secondary btn-sm"
    >
      {pending ? "Salvando..." : "Marcar pago"}
    </button>
  );
}
