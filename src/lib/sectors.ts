/**
 * Tabela de setores e múltiplos de referência.
 *
 * ⚠️ IMPORTANTE: os múltiplos abaixo são BENCHMARKS DE REFERÊNCIA para o
 * mercado brasileiro, montados como ponto de partida defensável — não são
 * cotações auditadas. Eles DEVEM SER REVISADOS PERIODICAMENTE conforme o
 * mercado, o momento de juros e a realidade de cada segmento mudam.
 *
 * Como editar: cada setor traz um múltiplo de RECEITA e um de EBITDA, e cada
 * múltiplo tem três pontas — mínimo (cenário conservador), base (cenário
 * central) e máximo (cenário otimista). Basta ajustar os números aqui; toda a
 * calculadora passa a usar os novos valores automaticamente.
 */

export interface MultipleBand {
  /** Ponta conservadora da faixa. */
  min: number;
  /** Cenário central / mais provável. */
  base: number;
  /** Ponta otimista da faixa. */
  max: number;
}

export interface Sector {
  /** Rótulo exibido no seletor. */
  label: string;
  /** Múltiplo aplicado sobre a receita anual (EV / Receita). */
  revenueMultiple: MultipleBand;
  /** Múltiplo aplicado sobre o EBITDA (EV / EBITDA). */
  ebitdaMultiple: MultipleBand;
}

export type SectorKey =
  | 'tech_saas'
  | 'servicos'
  | 'agro'
  | 'industria'
  | 'varejo'
  | 'alimentos'
  | 'saude'
  | 'educacao'
  | 'generico';

/**
 * Múltiplos por setor. Faixas propositalmente amplas para refletir a dispersão
 * real de cada segmento (porte, margem, momento de mercado).
 */
export const SECTORS: Record<SectorKey, Sector> = {
  tech_saas: {
    label: 'Tecnologia e SaaS',
    // Software escalável tende a negociar a múltiplos altos, sobretudo com
    // receita recorrente e boas margens.
    revenueMultiple: { min: 2.0, base: 4.0, max: 8.0 },
    ebitdaMultiple: { min: 10, base: 15, max: 22 },
  },
  servicos: {
    label: 'Serviços e consultoria',
    // Muito dependente de pessoas; múltiplos mais modestos.
    revenueMultiple: { min: 0.6, base: 1.0, max: 1.8 },
    ebitdaMultiple: { min: 5, base: 7, max: 10 },
  },
  agro: {
    label: 'Agronegócio e produção rural',
    // Intensivo em ativos e sujeito a ciclos de safra e preço de commodity.
    revenueMultiple: { min: 0.8, base: 1.3, max: 2.2 },
    ebitdaMultiple: { min: 5, base: 7, max: 10 },
  },
  industria: {
    label: 'Indústria e manufatura',
    // Capital intensivo, margens comprimidas.
    revenueMultiple: { min: 0.6, base: 1.0, max: 1.6 },
    ebitdaMultiple: { min: 5, base: 7, max: 9 },
  },
  varejo: {
    label: 'Varejo e comércio',
    // Alto giro, margem baixa — múltiplo de receita naturalmente pequeno.
    revenueMultiple: { min: 0.3, base: 0.6, max: 1.0 },
    ebitdaMultiple: { min: 4, base: 6, max: 8 },
  },
  alimentos: {
    label: 'Alimentos e bebidas',
    // Marca e recorrência de consumo elevam o múltiplo frente ao varejo puro.
    revenueMultiple: { min: 0.8, base: 1.4, max: 2.2 },
    ebitdaMultiple: { min: 6, base: 9, max: 12 },
  },
  saude: {
    label: 'Saúde',
    // Demanda resiliente e receita previsível sustentam múltiplos maiores.
    revenueMultiple: { min: 1.0, base: 1.8, max: 3.0 },
    ebitdaMultiple: { min: 8, base: 11, max: 15 },
  },
  educacao: {
    label: 'Educação',
    // Recorrência de matrícula/mensalidade dá previsibilidade.
    revenueMultiple: { min: 1.0, base: 1.8, max: 3.0 },
    ebitdaMultiple: { min: 7, base: 10, max: 14 },
  },
  generico: {
    label: 'Genérico (fallback conservador)',
    // Usado quando o setor não se encaixa nos demais — múltiplos prudentes.
    revenueMultiple: { min: 0.5, base: 0.9, max: 1.5 },
    ebitdaMultiple: { min: 4, base: 6, max: 8 },
  },
};

/** Lista ordenada para popular o seletor da interface. */
export const SECTOR_OPTIONS: { key: SectorKey; label: string }[] = (
  Object.keys(SECTORS) as SectorKey[]
).map((key) => ({ key, label: SECTORS[key].label }));

export const DEFAULT_SECTOR: SectorKey = 'agro';
