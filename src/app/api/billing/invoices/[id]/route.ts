import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await context.params;
  const entry = await prisma.billingEntry.findFirst({
    where: { id, userId: user.id },
    include: { patient: true },
  });

  if (!entry) {
    return Response.json(
      { error: "Cobrança não encontrada." },
      { status: 404 },
    );
  }

  // Placeholder — emissão de NFS-e fica fora do escopo v1.
  return Response.json({
    id: entry.id,
    status: "pending_manual",
    note: "Emita manualmente no portal da prefeitura — a v1 não automatiza NFS-e.",
    psychologist: { name: user.name, crp: user.crp, city: user.city },
    patient: entry.patient.name,
    service: entry.serviceType,
    amountCents: entry.amountCents,
  });
}
