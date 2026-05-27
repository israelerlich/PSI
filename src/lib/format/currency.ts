export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function parseBRLToCents(input: string): number {
  const cleaned = input
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = Number.parseFloat(cleaned);
  if (Number.isNaN(num)) throw new Error(`Invalid currency input: ${input}`);
  return Math.round(num * 100);
}
