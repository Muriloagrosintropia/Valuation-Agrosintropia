/**
 * Helpers de formatação monetária no padrão brasileiro (R$, ponto de milhar,
 * vírgula decimal). Centralizados aqui para manter a UI consistente.
 */

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const brlWithCents = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimal1 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** R$ 1.234.567 — valor cheio, sem centavos. */
export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return brl.format(Math.round(value));
}

/** R$ 1.234.567,89 — valor cheio com centavos (usado em campos menores). */
export function formatBRLCents(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return brlWithCents.format(value);
}

/**
 * Formatação compacta para números grandes, mantendo a legibilidade nos
 * destaques de valuation. Ex.: R$ 12,5 mi / R$ 1,2 bi.
 * Abaixo de 1 milhão, cai para o valor cheio (sem centavos).
 */
export function formatBRLCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}R$ ${decimal1.format(abs / 1_000_000_000)} bi`;
  }
  if (abs >= 1_000_000) {
    return `${sign}R$ ${decimal1.format(abs / 1_000_000)} mi`;
  }
  if (abs >= 100_000) {
    return `${sign}R$ ${decimal1.format(abs / 1_000)} mil`;
  }
  return formatBRL(value);
}

/** 12,5% a partir de um decimal (0.125). */
export function formatPercent(decimalValue: number, digits = 0): string {
  if (!Number.isFinite(decimalValue)) return '—';
  return `${(decimalValue * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}
