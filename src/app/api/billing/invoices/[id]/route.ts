import { billingEntries, psychologistProfile } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const entry = billingEntries.find((candidate) => candidate.id === id);

  if (!entry) {
    return Response.json({ error: "Cobrança não encontrada." }, { status: 404 });
  }

  return Response.json({
    id: entry.id,
    status: "issued",
    invoiceStatus: "issued",
    provider: "mock_nfse",
    issuedAt: new Date().toISOString(),
    psychologist: {
      name: psychologistProfile.name,
      crp: psychologistProfile.crp,
      city: psychologistProfile.city,
    },
    patient: entry.patientName,
    service: entry.serviceType,
    amountCents: entry.amountCents,
  });
}
