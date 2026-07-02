import type { ValuationResult } from '../lib/valuation';
import ValuationRangeCard from './ValuationRangeCard';
import ConfidenceBadge from './ConfidenceBadge';
import MethodsChart from './MethodsChart';
import MethodBreakdown from './MethodBreakdown';

interface ResultsPanelProps {
  result: ValuationResult | null;
}

/** Estado inicial, quando ainda não há receita para calcular. */
function EmptyState() {
  return (
    <div className="card flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-agro-100 text-2xl">
        🌱
      </div>
      <p className="text-base font-semibold text-agro-800">
        Preencha os dados para ver o valuation
      </p>
      <p className="mt-1 max-w-xs text-sm text-agro-500">
        Comece pela receita anual. O cálculo aparece aqui automaticamente,
        cruzando três métodos.
      </p>
    </div>
  );
}

/**
 * Coluna de resultado: faixa em destaque, selo de confiança, gráfico
 * comparativo, detalhamento por método e a nota de rodapé de responsabilidade.
 */
export default function ResultsPanel({ result }: ResultsPanelProps) {
  if (!result) return <EmptyState />;

  const ebitdaUnavailable = result.methods.some(
    (m) => m.key === 'ebitda' && !m.available
  );

  return (
    <div className="space-y-4">
      <ValuationRangeCard range={result.finalValue} isEquity={result.isEquity} />

      <ConfidenceBadge confidence={result.confidence} />

      {/* Aviso destacado quando o negócio ainda não é lucrativo. */}
      {ebitdaUnavailable && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span aria-hidden>⚠️</span>
          <p>
            EBITDA zero ou negativo: os métodos baseados em lucro ficam de fora e
            o valor se apoia no múltiplo de receita. Trate o resultado com cautela.
          </p>
        </div>
      )}

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-agro-900">
          Comparação entre os métodos
        </h3>
        <MethodsChart methods={result.methods} />
        <p className="mt-1 text-center text-xs text-agro-400">
          Barra = valor central · haste = faixa mínimo–máximo de cada método.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-agro-900">
          Detalhe por método
        </h3>
        <MethodBreakdown methods={result.methods} />
      </div>

      <p className="rounded-xl bg-agro-100/60 p-3 text-xs leading-relaxed text-agro-600">
        <strong className="text-agro-700">Nota:</strong> esta ferramenta é uma
        estimativa de apoio à decisão, baseada em múltiplos de referência e
        premissas simplificadas. <strong>Não é um laudo de avaliação formal</strong>{' '}
        nem substitui uma análise detalhada (due diligence). Revise as premissas
        antes de usar o número em negociações.
      </p>
    </div>
  );
}
