import { requireUser } from "@/lib/auth-helpers";
import { listSessionsInRange } from "@/server/queries/session";

/**
 * Returns the user's scheduled sessions in the next 30 days.
 * Replaces the mock "available slots" endpoint from the prototype.
 */
export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const modality = url.searchParams.get("modality");

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 30);

  const sessions = await listSessionsInRange(user.id, from, to);
  const filtered = modality
    ? sessions.filter((s) => s.modality === modality)
    : sessions;

  return Response.json({
    sessions: filtered.map((s) => ({
      id: s.id,
      patientName: s.patient.name,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      modality: s.modality,
      location: s.location,
      status: s.status,
    })),
    count: filtered.length,
  });
}
