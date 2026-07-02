/**
 * ============================================================================
 *  MOTOR DE VALUATION — AGROSINTROPIA
 * ============================================================================
 *
 * Filosofia: não confiar em um único método. Calculamos o valor por TRÊS
 * métodos independentes, cruzamos os resultados e entregamos uma FAIXA (mínimo,
 * base, máximo) acompanhada de um ÍNDICE DE CONFIANÇA — em vez de um número
 * solto que passa falsa precisão.
 *
 * Os três métodos:
 *   1. Múltiplo de Receita   (EV / Receita)
 *   2. Múltiplo de EBITDA    (EV / EBITDA)
 *   3. Fluxo de Caixa Descontado (DCF) simplificado
 *
 * Todo o resultado é primeiro calculado como ENTERPRISE VALUE (valor da
 * operação). Se o usuário informar caixa e/ou dívida, ajustamos para EQUITY
 * VALUE (valor para o sócio): equity = enterprise − dívida + caixa.
 *
 * Este módulo é puro (sem React, sem I/O) para ficar fácil de testar e ajustar.
 * ----------------------------------------------------------------------------
 */

import { SECTORS, type SectorKey } from './sectors';

/* ============================================================================
 *  CONSTANTES DO DCF — ajuste fino aqui, no topo do módulo
 * ==========================================================================*/

/**
 * Taxa de desconto padrão (WACC aproximado). Coerente com o custo de capital
 * no Brasil: uma taxa livre de risco elevada (Selic) somada a um prêmio de
 * risco de mercado costuma colocar o custo de capital de PMEs na casa dos
 * 14%–18% a.a. Usamos 15% como base. Ajuste conforme o momento de juros.
 */
export const DISCOUNT_RATE = 0.15;

/**
 * Sensibilidade da taxa de desconto usada para gerar a FAIXA do DCF.
 * O cenário otimista desconta menos (−3 p.p.) e o conservador desconta mais
 * (+3 p.p.), traduzindo a incerteza sobre o custo de capital em min/base/máx.
 */
export const DISCOUNT_RATE_SPREAD = 0.03;

/** Crescimento na perpetuidade (valor terminal). Conservador, ~inflação/PIB. */
export const TERMINAL_GROWTH = 0.03;

/** Horizonte de projeção explícita, em anos. */
export const PROJECTION_YEARS = 5;

/**
 * Fator de conversão de EBITDA em Fluxo de Caixa Livre (FCF). Simplificação:
 * o FCF real desconta impostos, capex e variação de capital de giro do EBITDA.
 * Usamos 70% como proxy prudente para uma PME brasileira. Ajuste se necessário.
 */
export const FCF_CONVERSION_FACTOR = 0.7;

/**
 * "Freio" de desaceleração do crescimento. A cada ano o crescimento converge
 * geometricamente do valor informado em direção ao crescimento de perpetuidade
 * (fator < 1 → decai a cada ano). Isso impede que um crescimento alto vire uma
 * projeção absurda ao ser composto por 5 anos.
 */
export const GROWTH_DECAY = 0.6;

/**
 * Teto de crescimento anual considerado na projeção. Mesmo que o usuário digite
 * algo estratosférico, capamos aqui para manter o DCF no chão.
 */
export const MAX_PROJECTION_GROWTH = 1.0; // 100% a.a.

/* ============================================================================
 *  PESOS DA CONSOLIDAÇÃO
 * ==========================================================================*/

/**
 * Pesos de cada método na média ponderada final.
 *
 * Lógica: quando o negócio é LUCRATIVO, EBITDA e DCF são os métodos mais
 * confiáveis (olham para geração de caixa real), então recebem mais peso. O
 * múltiplo de receita entra como âncora de mercado, com peso menor.
 *
 * Quando o EBITDA é FRACO/NEGATIVO, os métodos baseados em lucro ficam
 * indisponíveis; o valor passa a se apoiar no múltiplo de receita.
 */
export const WEIGHTS_PROFITABLE = { revenue: 0.25, ebitda: 0.4, dcf: 0.35 };

/* ============================================================================
 *  TIPOS
 * ==========================================================================*/

export interface Range {
  min: number;
  base: number;
  max: number;
}

export type MethodKey = 'revenue' | 'ebitda' | 'dcf';

export interface MethodResult {
  key: MethodKey;
  label: string;
  /** Frase curta que explica o que o método significa. */
  description: string;
  available: boolean;
  /** Motivo quando indisponível (ex.: EBITDA negativo). */
  unavailableReason?: string;
  /** Faixa em enterprise value; null quando indisponível. */
  range: Range | null;
  /** Peso efetivo usado na consolidação (0 quando indisponível). */
  weight: number;
}

export type ConfidenceLabel = 'baixa' | 'média' | 'alta';

export interface Confidence {
  /** 0–100. */
  score: number;
  label: ConfidenceLabel;
  /** Componentes, expostos para transparência na UI. */
  convergence: number; // 0–1
  completeness: number; // 0–1
}

export interface ValuationInputs {
  revenue: number; // R$ (receita anual, últimos 12 meses)
  growth: number; // decimal (0.2 = 20% a.a.)
  ebitda: number; // R$ absoluto — já derivado da margem ou informado direto
  recurringPct: number; // decimal 0–1
  cash: number | null; // R$ ou null se não informado
  debt: number | null; // R$ ou null se não informado
  sector: SectorKey;
  // Flags de completude (quais campos opcionais foram efetivamente preenchidos)
  hasRecurring: boolean;
  hasCash: boolean;
  hasDebt: boolean;
}

export interface ValuationResult {
  methods: MethodResult[];
  /** Valor da operação (antes de caixa/dívida). */
  enterpriseValue: Range;
  /** Valor para o sócio; presente apenas quando há caixa/dívida. */
  equityValue: Range | null;
  /** Faixa exibida em destaque: equity se ajustado, senão enterprise. */
  finalValue: Range;
  /** true quando o número final é equity value (houve ajuste caixa/dívida). */
  isEquity: boolean;
  confidence: Confidence;
  /** Quantos dos 3 métodos ficaram disponíveis. */
  availableCount: number;
}

/* ============================================================================
 *  HELPERS
 * ==========================================================================*/

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

/** Multiplica cada ponta da faixa por um fator escalar. */
function scaleRange(band: Range, factor: number): Range {
  return { min: band.min * factor, base: band.base * factor, max: band.max * factor };
}

/* ============================================================================
 *  MÉTODO 1 — MÚLTIPLO DE RECEITA
 * ==========================================================================*/

/**
 * Multiplica a receita anual pelo múltiplo de receita do setor nas três pontas.
 *
 * PRÊMIO DE QUALIDADE DA RECEITA: negócios que crescem rápido e têm receita
 * previsível (recorrente) valem mais por real de faturamento. Aplicamos um
 * prêmio multiplicativo sobre as três pontas:
 *
 *   - Crescimento: cada ponto de crescimento ACIMA de 10% a.a. vira prêmio,
 *     limitado a +25% (atingido a partir de ~60% de crescimento).
 *   - Recorrência: receita 100% recorrente adiciona até +15%, proporcional ao
 *     percentual informado.
 *
 * Prêmio máximo combinado: +40%. É deliberadamente moderado para não inflar o
 * método de receita, que já é o mais "otimista" por ignorar rentabilidade.
 */
function revenueMultipleMethod(inputs: ValuationInputs): MethodResult {
  const sector = SECTORS[inputs.sector];
  const growthPremium = clamp(inputs.growth - 0.1, 0, 0.5) * 0.5; // até +0.25
  const recurringPremium = clamp(inputs.recurringPct, 0, 1) * 0.15; // até +0.15
  const premiumFactor = 1 + growthPremium + recurringPremium; // até 1.40

  const base = scaleRange(sector.revenueMultiple, inputs.revenue);
  const range = scaleRange(base, premiumFactor);

  return {
    key: 'revenue',
    label: 'Múltiplo de Receita',
    description:
      'Aplica o múltiplo de faturamento do setor, com prêmio para crescimento e receita recorrente.',
    available: inputs.revenue > 0,
    unavailableReason: inputs.revenue > 0 ? undefined : 'Informe a receita anual.',
    range: inputs.revenue > 0 ? range : null,
    weight: 0,
  };
}

/* ============================================================================
 *  MÉTODO 2 — MÚLTIPLO DE EBITDA
 * ==========================================================================*/

/**
 * Multiplica o EBITDA pelo múltiplo de EBITDA do setor nas três pontas.
 * Se o EBITDA for zero ou negativo, o método fica INDISPONÍVEL de forma
 * elegante — o negócio ainda não é lucrativo e o valor passa a se apoiar no
 * múltiplo de receita.
 */
function ebitdaMultipleMethod(inputs: ValuationInputs): MethodResult {
  const sector = SECTORS[inputs.sector];
  const profitable = inputs.ebitda > 0;

  return {
    key: 'ebitda',
    label: 'Múltiplo de EBITDA',
    description:
      'Aplica o múltiplo de EBITDA do setor sobre a geração de caixa operacional.',
    available: profitable,
    unavailableReason: profitable
      ? undefined
      : 'EBITDA zero ou negativo: o negócio ainda não é lucrativo, então este método não se aplica.',
    range: profitable ? scaleRange(sector.ebitdaMultiple, inputs.ebitda) : null,
    weight: 0,
  };
}

/* ============================================================================
 *  MÉTODO 3 — FLUXO DE CAIXA DESCONTADO (DCF) SIMPLIFICADO
 * ==========================================================================*/

/**
 * Projeta o Fluxo de Caixa Livre por PROJECTION_YEARS anos partindo do EBITDA
 * atual (convertido em FCF por FCF_CONVERSION_FACTOR) e aplicando a taxa de
 * crescimento informada — com o crescimento DESACELERANDO a cada ano em direção
 * ao crescimento de perpetuidade (freio GROWTH_DECAY). Soma os fluxos trazidos
 * a valor presente e adiciona um valor terminal (perpetuidade de Gordon).
 *
 * A FAIXA (min/base/máx) vem da sensibilidade à taxa de desconto: descontar
 * menos → vale mais (máx); descontar mais → vale menos (mín).
 *
 * Como depende do EBITDA, o método fica indisponível quando o EBITDA ≤ 0.
 */
function computeDcf(ebitda: number, growth: number, discountRate: number): number {
  const fcf0 = ebitda * FCF_CONVERSION_FACTOR;
  const effectiveGrowth = clamp(growth, 0, MAX_PROJECTION_GROWTH);

  let prevFcf = fcf0;
  let pvSum = 0;
  let lastFcf = fcf0;

  for (let year = 1; year <= PROJECTION_YEARS; year++) {
    // Crescimento do ano converge geometricamente para o terminal (freio).
    const yearGrowth =
      TERMINAL_GROWTH +
      (effectiveGrowth - TERMINAL_GROWTH) * Math.pow(GROWTH_DECAY, year - 1);
    const fcf = prevFcf * (1 + yearGrowth);
    pvSum += fcf / Math.pow(1 + discountRate, year);
    prevFcf = fcf;
    lastFcf = fcf;
  }

  // Valor terminal por perpetuidade de Gordon, trazido a valor presente.
  const terminalValue =
    (lastFcf * (1 + TERMINAL_GROWTH)) / (discountRate - TERMINAL_GROWTH);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, PROJECTION_YEARS);

  return pvSum + pvTerminal;
}

function dcfMethod(inputs: ValuationInputs): MethodResult {
  const profitable = inputs.ebitda > 0;

  let range: Range | null = null;
  if (profitable) {
    // min = maior desconto, max = menor desconto.
    const base = computeDcf(inputs.ebitda, inputs.growth, DISCOUNT_RATE);
    const min = computeDcf(
      inputs.ebitda,
      inputs.growth,
      DISCOUNT_RATE + DISCOUNT_RATE_SPREAD
    );
    const max = computeDcf(
      inputs.ebitda,
      inputs.growth,
      DISCOUNT_RATE - DISCOUNT_RATE_SPREAD
    );
    range = { min, base, max };
  }

  return {
    key: 'dcf',
    label: 'Fluxo de Caixa Descontado',
    description:
      'Projeta o caixa livre por 5 anos (com freio de crescimento) e traz a valor presente.',
    available: profitable,
    unavailableReason: profitable
      ? undefined
      : 'DCF parte do EBITDA: sem lucro operacional positivo, a projeção não se sustenta.',
    range,
    weight: 0,
  };
}

/* ============================================================================
 *  CONSOLIDAÇÃO
 * ==========================================================================*/

/**
 * Combina os métodos disponíveis numa faixa final via média ponderada, ponta a
 * ponta (min com min, base com base, máx com máx). Os pesos são renormalizados
 * sobre os métodos efetivamente disponíveis.
 */
function consolidate(methods: MethodResult[]): {
  enterpriseValue: Range;
  methods: MethodResult[];
} {
  const available = methods.filter((m) => m.available && m.range);

  // Sem nenhum método (receita zerada): faixa nula.
  if (available.length === 0) {
    return { enterpriseValue: { min: 0, base: 0, max: 0 }, methods };
  }

  const anyProfitable = methods.some((m) => m.key !== 'revenue' && m.available);

  // Peso bruto de cada método disponível.
  const rawWeight = (key: MethodKey): number => {
    if (!anyProfitable) return key === 'revenue' ? 1 : 0; // só receita disponível
    return WEIGHTS_PROFITABLE[key];
  };

  const totalWeight = available.reduce((sum, m) => sum + rawWeight(m.key), 0);

  // Grava o peso efetivo (normalizado) em cada método, para exibição.
  const withWeights = methods.map((m) => ({
    ...m,
    weight: m.available && m.range ? rawWeight(m.key) / totalWeight : 0,
  }));

  const weightedAvg = (pick: (r: Range) => number): number =>
    withWeights.reduce(
      (sum, m) => (m.range ? sum + pick(m.range) * m.weight : sum),
      0
    );

  const enterpriseValue: Range = {
    min: weightedAvg((r) => r.min),
    base: weightedAvg((r) => r.base),
    max: weightedAvg((r) => r.max),
  };

  return { enterpriseValue, methods: withWeights };
}

/* ============================================================================
 *  ÍNDICE DE CONFIANÇA
 * ==========================================================================*/

/**
 * Índice de confiança (0–100), combinação de dois fatores:
 *
 *   1. CONVERGÊNCIA entre os métodos (peso 60%): quanto mais próximos os
 *      valores-base dos métodos disponíveis, maior a confiança. Medimos a
 *      dispersão relativa = (máx − mín) / média dos valores-base e definimos
 *      convergência = 1 − dispersão (limitado a [0, 1]). Com apenas um método
 *      disponível não há como cruzar resultados → convergência = 0,4 (modesta).
 *
 *   2. COMPLETUDE dos dados (peso 40%): fração dos 3 campos opcionais
 *      (recorrência, caixa, dívida) que o usuário preencheu. Mais dados →
 *      estimativa mais ancorada.
 *
 *   Fórmula: score = 100 × (0,6 × convergência + 0,4 × completude)
 *
 *   Rótulos: <40 → baixa · 40–70 → média · >70 → alta.
 */
function computeConfidence(
  methods: MethodResult[],
  inputs: ValuationInputs
): Confidence {
  const bases = methods
    .filter((m) => m.available && m.range)
    .map((m) => (m.range as Range).base);

  let convergence: number;
  if (bases.length >= 2) {
    const mean = bases.reduce((a, b) => a + b, 0) / bases.length;
    const spread = mean > 0 ? (Math.max(...bases) - Math.min(...bases)) / mean : 1;
    convergence = clamp(1 - spread, 0, 1);
  } else if (bases.length === 1) {
    convergence = 0.4; // um único método: não dá para cruzar
  } else {
    convergence = 0;
  }

  const optionalFilled =
    (inputs.hasRecurring ? 1 : 0) +
    (inputs.hasCash ? 1 : 0) +
    (inputs.hasDebt ? 1 : 0);
  const completeness = optionalFilled / 3;

  const score = Math.round(100 * (0.6 * convergence + 0.4 * completeness));

  let label: ConfidenceLabel;
  if (score < 40) label = 'baixa';
  else if (score <= 70) label = 'média';
  else label = 'alta';

  return { score, label, convergence, completeness };
}

/* ============================================================================
 *  API PÚBLICA
 * ==========================================================================*/

/** Converte enterprise value em equity value: EV − dívida + caixa. */
function toEquity(ev: Range, cash: number, debt: number): Range {
  const adj = cash - debt;
  return { min: ev.min + adj, base: ev.base + adj, max: ev.max + adj };
}

/**
 * Ponto de entrada: recebe as entradas normalizadas e devolve o resultado
 * completo (métodos, faixa final, ajuste de equity e índice de confiança).
 */
export function calculateValuation(inputs: ValuationInputs): ValuationResult {
  const rawMethods = [
    revenueMultipleMethod(inputs),
    ebitdaMultipleMethod(inputs),
    dcfMethod(inputs),
  ];

  const { enterpriseValue, methods } = consolidate(rawMethods);
  const confidence = computeConfidence(methods, inputs);
  const availableCount = methods.filter((m) => m.available && m.range).length;

  // Ajuste para equity value apenas quando caixa e/ou dívida foram informados.
  const hasAdjustment = inputs.hasCash || inputs.hasDebt;
  const equityValue = hasAdjustment
    ? toEquity(enterpriseValue, inputs.cash ?? 0, inputs.debt ?? 0)
    : null;

  return {
    methods,
    enterpriseValue,
    equityValue,
    finalValue: equityValue ?? enterpriseValue,
    isEquity: hasAdjustment,
    confidence,
    availableCount,
  };
}

/**
 * Normaliza os campos de texto do formulário em números prontos para o cálculo.
 * Strings vazias/ inválidas viram 0 (obrigatórios) ou null (opcionais), e as
 * flags de completude registram o que foi de fato preenchido.
 *
 * O EBITDA é derivado aqui: em modo "margem", ebitda = receita × margem; em
 * modo "valor", usa-se o valor informado diretamente.
 */
export interface RawFormValues {
  revenue: string;
  growth: string; // %
  ebitdaMode: 'margin' | 'value';
  ebitdaMargin: string; // %
  ebitdaValue: string; // R$
  recurringPct: string; // %
  cash: string; // R$
  debt: string; // R$
  sector: SectorKey;
}

export function parseNumber(value: string): number | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (trimmed === '') return null;
  // Aceita entrada no padrão brasileiro (1.234,56) e também o padrão simples.
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function normalizeInputs(form: RawFormValues): ValuationInputs {
  const revenue = parseNumber(form.revenue) ?? 0;
  const growth = (parseNumber(form.growth) ?? 0) / 100;
  const recurringRaw = parseNumber(form.recurringPct);
  const recurringPct = clamp((recurringRaw ?? 0) / 100, 0, 1);
  const cash = parseNumber(form.cash);
  const debt = parseNumber(form.debt);

  // Deriva o EBITDA conforme o modo escolhido.
  let ebitda: number;
  if (form.ebitdaMode === 'value') {
    ebitda = parseNumber(form.ebitdaValue) ?? 0;
  } else {
    const margin = (parseNumber(form.ebitdaMargin) ?? 0) / 100;
    ebitda = revenue * margin;
  }

  return {
    revenue,
    growth,
    ebitda,
    recurringPct,
    cash,
    debt,
    sector: form.sector,
    hasRecurring: recurringRaw != null,
    hasCash: cash != null,
    hasDebt: debt != null,
  };
}

/**
 * Conversões de conveniência para manter os campos margem ⇄ valor em sincronia
 * na interface. Retornam string vazia quando não há base para converter.
 */
export function marginToValue(revenue: number, marginPct: number): number {
  return revenue * (marginPct / 100);
}

export function valueToMargin(revenue: number, ebitdaValue: number): number {
  if (revenue <= 0) return 0;
  return (ebitdaValue / revenue) * 100;
}
