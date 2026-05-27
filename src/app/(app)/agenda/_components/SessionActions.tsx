"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmSession } from "@/server/actions/session/confirmSession";
import { markAttendance } from "@/server/actions/session/markAttendance";

export function SessionActions({
  sessionId,
  confirmed,
}: {
  sessionId: string;
  confirmed: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function call(fn: () => Promise<unknown>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {!confirmed ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => call(() => confirmSession({ id: sessionId }))}
          className="btn btn-secondary btn-sm"
        >
          Confirmar
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          call(() => markAttendance({ id: sessionId, attendanceStatus: "present" }))
        }
        className="btn btn-primary btn-sm"
      >
        Presença
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          call(() => markAttendance({ id: sessionId, attendanceStatus: "missed" }))
        }
        className="btn btn-ghost btn-sm"
      >
        Falta
      </button>
    </div>
  );
}
