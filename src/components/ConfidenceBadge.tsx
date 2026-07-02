import type { Confidence } from '../lib/valuation';

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

/**
 * Selo visual do índice de confiança (0–100), com cor e rótulo (baixa / média /
 * alta) e uma barra de progresso. As cores seguem um semáforo: vermelho para
 * baixa, âmbar para média, verde para alta.
 */
export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const { score, label, convergence, completeness } = confidence;

  const theme =
    label === 'alta'
      ? { chip: 'bg-agro-100 text-agro-800', bar: 'bg-agro-500', ring: 'ring-agro-200' }
      : label === 'média'
      ? { chip: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', ring: 'ring-amber-200' }
      : { chip: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500', ring: 'ring-rose-200' };

  return (
    <div className={`card p-4 ring-1 ${theme.ring}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-agro-400">
            Índice de confiança
          </p>
          <p className="mt-0.5 text-2xl font-bold text-agro-900">
            {score}
            <span className="text-base font-medium text-agro-400">/100</span>
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${theme.chip}`}
        >
          Confiança {label}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-agro-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="mt-3 flex gap-4 text-xs text-agro-500">
        <span>
          Convergência dos métodos:{' '}
          <strong className="text-agro-700">{Math.round(convergence * 100)}%</strong>
        </span>
        <span>
          Completude dos dados:{' '}
          <strong className="text-agro-700">{Math.round(completeness * 100)}%</strong>
        </span>
      </div>
    </div>
  );
}
