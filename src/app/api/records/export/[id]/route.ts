import { records, psychologistProfile } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const record = records.find((candidate) => candidate.id === id);

  if (!record) {
    return new Response("Prontuário não encontrado.", { status: 404 });
  }

  const body = record.fields
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
          <title>Prontuário ${escapeHtml(record.template)} - ${escapeHtml(record.patientName)}</title>
          <style>
            body {
              color: #1d211f;
              font-family: Arial, Helvetica, sans-serif;
              margin: 48px;
            }
            header {
              border-bottom: 1px solid #d8d4c9;
              margin-bottom: 32px;
              padding-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              margin: 0 0 8px;
            }
            h2 {
              color: #0f4f4b;
              font-size: 15px;
              letter-spacing: 0.08em;
              margin: 24px 0 8px;
              text-transform: uppercase;
            }
            p {
              line-height: 1.7;
              margin: 0;
            }
            footer {
              border-top: 1px solid #d8d4c9;
              color: #625f58;
              font-size: 12px;
              margin-top: 40px;
              padding-top: 16px;
            }
            @media print {
              body {
                margin: 28mm 22mm;
              }
            }
          </style>
        </head>
        <body>
          <header>
            <h1>Prontuário ${escapeHtml(record.template)}</h1>
            <p>${escapeHtml(psychologistProfile.name)} - ${escapeHtml(psychologistProfile.crp)}</p>
            <p>Paciente: ${escapeHtml(record.patientName)}</p>
            <p>Sessão: ${formatDate(record.sessionDate)}</p>
          </header>
          ${body}
          <footer>
            Criado em ${formatDate(record.createdAt)}. Retenção mínima até ${formatDate(record.retentionUntil)}.
          </footer>
          <script>window.print()</script>
        </body>
      </html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
