import { describe, expect, test } from "vitest";
import { formatDate, formatDateTime, formatTime } from "@/lib/format/date";
import { formatBRL, parseBRLToCents } from "@/lib/format/currency";
import {
  normalizeWhatsapp,
  formatWhatsappForDisplay,
  whatsappToWaMeLink,
} from "@/lib/format/phone";

describe("date", () => {
  test("formatDate returns DD/MM/YYYY in pt-BR", () => {
    expect(formatDate(new Date("2026-05-16T12:00:00-03:00"))).toBe("16/05/2026");
  });
  test("formatTime returns HH:mm in São Paulo", () => {
    expect(formatTime(new Date("2026-05-16T16:00:00-03:00"))).toBe("16:00");
  });
  test("formatDateTime returns weekday + date + time", () => {
    const out = formatDateTime(new Date("2026-05-16T16:00:00-03:00"));
    expect(out).toMatch(/sáb/i);
    expect(out).toContain("16/05");
    expect(out).toContain("16:00");
  });
});

describe("currency", () => {
  test("formatBRL formats cents to R$", () => {
    // Intl uses a non-breaking space between "R$" and the number; match either.
    expect(formatBRL(22000)).toMatch(/^R\$\s220,00$/);
    expect(formatBRL(0)).toMatch(/^R\$\s0,00$/);
    expect(formatBRL(199)).toMatch(/^R\$\s1,99$/);
  });
  test("parseBRLToCents reverses common inputs", () => {
    expect(parseBRLToCents("R$ 220,00")).toBe(22000);
    expect(parseBRLToCents("220")).toBe(22000);
    expect(parseBRLToCents("220,50")).toBe(22050);
  });
});

describe("phone", () => {
  test("normalizeWhatsapp adds +55 if missing", () => {
    expect(normalizeWhatsapp("11999999999")).toBe("+5511999999999");
    expect(normalizeWhatsapp("+5511999999999")).toBe("+5511999999999");
    expect(normalizeWhatsapp("(11) 99999-9999")).toBe("+5511999999999");
  });
  test("formatWhatsappForDisplay returns +55 (11) 99999-9999", () => {
    expect(formatWhatsappForDisplay("+5511999999999")).toBe(
      "+55 (11) 99999-9999",
    );
  });
  test("whatsappToWaMeLink strips + and non-digits", () => {
    expect(whatsappToWaMeLink("+5511999999999")).toBe(
      "https://wa.me/5511999999999",
    );
  });
});
