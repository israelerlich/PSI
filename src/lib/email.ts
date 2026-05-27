import { Resend } from "resend";

export type EmailPayload = { to: string; subject: string; html: string };
export type EmailSender = (payload: EmailPayload) => Promise<void>;

const consoleSender: EmailSender = async (p) => {
  console.log("\n[email:dev]", `to=${p.to}`, `subject=${p.subject}`);
  console.log(p.html, "\n");
};

let override: EmailSender | null = null;

/** Used by tests to inject a mock sender. */
export function __setSender(sender: EmailSender) {
  override = sender;
}
/** Restores default behavior. */
export function __resetSender() {
  override = null;
}

function defaultSender(): EmailSender {
  if (!process.env.RESEND_API_KEY) return consoleSender;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "Clínica IA <no-reply@clinicaia.local>";
  return async ({ to, subject, html }) => {
    await resend.emails.send({ from, to, subject, html });
  };
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const sender = override ?? defaultSender();
  await sender(payload);
}
