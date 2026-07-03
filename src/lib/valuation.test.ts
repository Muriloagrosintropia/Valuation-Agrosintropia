import { describe, expect, it } from 'vitest';
import {
  calculateValuation,
  normalizeInputs,
  parseNumber,
  type RawFormValues,
} from './valuation';

describe('parseNumber', () => {
  it('lê inteiros e vazios', () => {
    expect(parseNumber('720000')).toBe(720000);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
  });

  it('trata ponto decimal como decimal (bug do toggle de margem)', () => {
    // "16.7" deve ser 16,7 — não 167.
    expect(parseNumber('16.7')).toBeCloseTo(16.7);
    expect(parseNumber('16.75')).toBeCloseTo(16.75);
  });

  it('trata vírgula como separador decimal (padrão BR)', () => {
    expect(parseNumber('16,7')).toBeCloseTo(16.7);
    expect(parseNumber('1.234.567,89')).toBeCloseTo(1234567.89);
  });

  it('trata ponto com 3 dígitos como separador de milhar', () => {
    expect(parseNumber('720.000')).toBe(720000);
    expect(parseNumber('1.000')).toBe(1000);
    expect(parseNumber('1.234.567')).toBe(1234567);
  });

  it('ignora símbolos de moeda/percentual e sinais', () => {
    expect(parseNumber('R$ 40.000')).toBe(40000);
    expect(parseNumber('35%')).toBe(35);
    expect(parseNumber('-400000')).toBe(-400000);
  });
});

const baseForm: RawFormValues = {
  revenue: '1000000',
  growth: '20',
  ebitdaMode: 'margin',
  ebitdaMargin: '20',
  ebitdaValue: '',
  recurringPct: '',
  cash: '',
  debt: '',
  sector: 'servicos',
};

describe('normalizeInputs', () => {
  it('deriva o EBITDA a partir da margem', () => {
    const n = normalizeInputs(baseForm);
    expect(n.ebitda).toBeCloseTo(200000); // 20% de 1.000.000
    expect(n.growth).toBeCloseTo(0.2);
  });

  it('usa o valor de EBITDA direto no modo "value"', () => {
    const n = normalizeInputs({ ...baseForm, ebitdaMode: 'value', ebitdaValue: '150000' });
    expect(n.ebitda).toBe(150000);
  });

  it('aceita entrada no padrão brasileiro (1.000.000,50)', () => {
    const n = normalizeInputs({ ...baseForm, revenue: '1.000.000,50' });
    expect(n.revenue).toBeCloseTo(1000000.5);
  });

  it('marca corretamente os campos opcionais preenchidos', () => {
    const n = normalizeInputs({ ...baseForm, cash: '50000', debt: '', recurringPct: '30' });
    expect(n.hasCash).toBe(true);
    expect(n.hasDebt).toBe(false);
    expect(n.hasRecurring).toBe(true);
  });
});

describe('calculateValuation', () => {
  it('disponibiliza os três métodos quando o negócio é lucrativo', () => {
    const r = calculateValuation(normalizeInputs(baseForm));
    expect(r.availableCount).toBe(3);
    expect(r.methods.every((m) => m.available)).toBe(true);
  });

  it('desativa EBITDA e DCF quando o EBITDA é negativo, sem quebrar', () => {
    const r = calculateValuation(
      normalizeInputs({ ...baseForm, ebitdaMode: 'value', ebitdaValue: '-50000' })
    );
    const ebitda = r.methods.find((m) => m.key === 'ebitda')!;
    const dcf = r.methods.find((m) => m.key === 'dcf')!;
    const revenue = r.methods.find((m) => m.key === 'revenue')!;
    expect(ebitda.available).toBe(false);
    expect(dcf.available).toBe(false);
    expect(revenue.available).toBe(true);
    // Só a receita disponível → peso 100%.
    expect(revenue.weight).toBeCloseTo(1);
    expect(r.finalValue.base).toBeGreaterThan(0);
  });

  it('mantém a ordem mín ≤ base ≤ máx na faixa final', () => {
    const r = calculateValuation(normalizeInputs(baseForm));
    expect(r.finalValue.min).toBeLessThanOrEqual(r.finalValue.base);
    expect(r.finalValue.base).toBeLessThanOrEqual(r.finalValue.max);
  });

  it('ajusta de enterprise para equity com caixa e dívida', () => {
    const r = calculateValuation(
      normalizeInputs({ ...baseForm, cash: '300000', debt: '100000' })
    );
    expect(r.isEquity).toBe(true);
    // equity = enterprise + caixa − dívida = enterprise + 200.000
    expect(r.equityValue!.base).toBeCloseTo(r.enterpriseValue.base + 200000);
  });

  it('não ajusta para equity quando não há caixa nem dívida', () => {
    const r = calculateValuation(normalizeInputs(baseForm));
    expect(r.isEquity).toBe(false);
    expect(r.equityValue).toBeNull();
    expect(r.finalValue).toEqual(r.enterpriseValue);
  });

  it('produz índice de confiança entre 0 e 100', () => {
    const r = calculateValuation(normalizeInputs(baseForm));
    expect(r.confidence.score).toBeGreaterThanOrEqual(0);
    expect(r.confidence.score).toBeLessThanOrEqual(100);
    expect(['baixa', 'média', 'alta']).toContain(r.confidence.label);
  });

  it('aumenta a confiança quando mais campos opcionais são preenchidos', () => {
    const sparse = calculateValuation(normalizeInputs(baseForm));
    const complete = calculateValuation(
      normalizeInputs({ ...baseForm, recurringPct: '60', cash: '300000', debt: '100000' })
    );
    expect(complete.confidence.completeness).toBeGreaterThan(
      sparse.confidence.completeness
    );
    expect(complete.confidence.score).toBeGreaterThanOrEqual(sparse.confidence.score);
  });
});
