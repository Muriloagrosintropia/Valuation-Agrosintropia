import { useMemo, useState } from 'react';
import ValuationForm from './components/ValuationForm';
import ResultsPanel from './components/ResultsPanel';
import { DEFAULT_SECTOR } from './lib/sectors';
import {
  calculateValuation,
  normalizeInputs,
  parseNumber,
  type RawFormValues,
  type ValuationResult,
} from './lib/valuation';

const EMPTY_FORM: RawFormValues = {
  revenue: '',
  growth: '',
  ebitdaMode: 'margin',
  ebitdaMargin: '',
  ebitdaValue: '',
  recurringPct: '',
  cash: '',
  debt: '',
  sector: DEFAULT_SECTOR,
};

// Cenário de referência da própria Agrosintropia, calibrado a partir do
// faturamento real (run-rate 2026 ~R$ 720 mil, custo ~R$ 50 mil/mês →
// EBITDA ~R$ 120 mil, crescimento vs. 2025, recorrência dos contratos mensais,
// caixa atual e sem dívida). Serve como exemplo pronto para a equipe.
const AGROSINTROPIA_EXAMPLE: RawFormValues = {
  revenue: '720000',
  growth: '20',
  ebitdaMode: 'value',
  ebitdaMargin: '',
  ebitdaValue: '120000',
  recurringPct: '35',
  cash: '40000',
  debt: '0',
  sector: 'servicos',
};

export default function App() {
  // Todo o estado vive na memória do React (sem backend, sem localStorage).
  const [form, setForm] = useState<RawFormValues>(EMPTY_FORM);

  const update = (patch: Partial<RawFormValues>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const reset = () => setForm(EMPTY_FORM);

  const loadExample = () => setForm(AGROSINTROPIA_EXAMPLE);

  // Cálculo reativo: recalcula a cada mudança de campo, sem botão de enviar.
  const result = useMemo<ValuationResult | null>(() => {
    const revenue = parseNumber(form.revenue) ?? 0;
    // Sem receita não há o que calcular — a coluna de resultado mostra o vazio.
    if (revenue <= 0) return null;
    return calculateValuation(normalizeInputs(form));
  }, [form]);

  return (
    <div className="min-h-screen bg-agro-50">
      {/* Cabeçalho */}
      <header className="border-b border-agro-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-agro-600 text-lg text-white">
            🌿
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-agro-900">
              Calculadora de Valuation
            </h1>
            <p className="text-xs text-agro-500">
              Agrosintropia · ferramenta interna de estimativa de valor
            </p>
          </div>
        </div>
      </header>

      {/* Corpo: formulário à esquerda, resultado à direita (empilha no mobile). */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ValuationForm
              form={form}
              onChange={update}
              onReset={reset}
              onLoadExample={loadExample}
            />
          </div>
          <ResultsPanel result={result} />
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-agro-400 sm:px-6">
        Estimativa por três métodos (múltiplo de receita, múltiplo de EBITDA e
        fluxo de caixa descontado). Uso interno.
      </footer>
    </div>
  );
}
