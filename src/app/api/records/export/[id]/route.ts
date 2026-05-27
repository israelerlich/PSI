import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await context.params;
  const record = await prisma.clinicalRecord.findFirst({
    where: { id, userId: user.id },
    include: { patient: true },
  });

  if (!record) {
    return new Response("Prontuário não encontrado.", { status: 404 });
  }

  const fields = (record.fields as Array<{ label: string; value: string }>)
    .map(
      (field) => `
        <section>
          <h2>${escapeHtml(field.label)}</h2>
          <p>${escapeHtml(field.value)}</p>
        </section>
      `,
    )
    .join("");

  return new Response(
    `<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Prontuário ${escapeHtml(record.template)} - ${escapeHtml(record.patient.name)}</title>
          <style>
            body { color: #0f1f3a; font-family: Arial, Helvetica, sans-serif; margin: 48px; }
            header { border-bottom: 1px solid #e6ebf2; margin-bottom: 32px; padding-bottom: 20px; }
            h1 { font-size: 24px; margin: 0 0 8px; }
            h2 { color: #1b4ba6; font-size: 13px; letter-spacing: 0.08em; margin: 24px 0 8px; text-transform: uppercase; }
            p { line-height: 1.7; margin: 0; }
            footer { border-top: 1px solid #e6ebf2; color: #6b7a93; font-size: 12px; margin-top: 40px; padding-top: 16px; }
            @media print { body { margin: 28mm 22mm; } }
          </style>
        </head>
        <body>
          <header>
            <h1>Prontuário ${escapeHtml(record.template)}</h1>
            <p>${escapeHtml(user.name)} - ${escapeHtml(user.crp)}</p>
            <p>Paciente: ${escapeHtml(record.patient.name)}</p>
            <p>Criado em: ${formatDate(record.createdAt)}</p>
          </header>
          ${fields}
          ${record.contextSummary ? `<section><h2>Contexto e continuidade</h2><p>${escapeHtml(record.contextSummary)}</p></section>` : ""}
          <footer>
            Retenção mínima até ${formatDate(record.retentionUntil)}.
          </footer>
          <script>window.print()</script>
        </body>
      </html>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
