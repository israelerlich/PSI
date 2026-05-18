import { patients } from "@/lib/mock-data";

type WhatsAppWebhookPayload = {
  from?: string;
  message?: string;
};

const clinicalTerms = [
  "diagnóstico",
  "diagnostico",
  "medicação",
  "medicacao",
  "crise",
  "terapia",
  "abordagem",
  "tratamento",
  "sessões múltiplas",
  "sessoes multiplas",
];

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | WhatsAppWebhookPayload
    | null;

  if (!payload?.from || !payload?.message) {
    return Response.json(
      { error: "Payload inválido: informe from e message." },
      { status: 400 },
    );
  }

  const normalizedPhone = normalizePhone(payload.from);
  const patient = patients.find(
    (candidate) => normalizePhone(candidate.whatsapp) === normalizedPhone,
  );
  const lowerMessage = payload.message.toLowerCase();
  const requiresHandoff = clinicalTerms.some((term) =>
    lowerMessage.includes(term),
  );

  return Response.json({
    received: true,
    queued: true,
    role: patient ? "recepcionista" : "sdr",
    action: requiresHandoff
      ? "notificar_profissional"
      : patient
        ? "atendimento_administrativo"
        : "qualificar_lead",
    patientId: patient?.id ?? null,
    guardrails: [
      "Não trafegar dados clínicos pelo WhatsApp.",
      "Não diagnosticar nem sugerir conduta clínica.",
      "Encaminhar perguntas fora do escopo para o psicólogo.",
    ],
  });
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}
