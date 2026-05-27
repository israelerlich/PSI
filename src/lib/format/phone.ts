export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

export function formatWhatsappForDisplay(e164: string): string {
  const m = e164.match(/^\+55(\d{2})(\d{4,5})(\d{4})$/);
  if (!m) return e164;
  return `+55 (${m[1]}) ${m[2]}-${m[3]}`;
}

export function whatsappToWaMeLink(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}
