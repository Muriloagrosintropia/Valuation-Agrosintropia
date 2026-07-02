import type { Range } from '../lib/valuation';
import { formatBRLCompact, formatBRL } from '../lib/format';

interface ValuationRangeCardProps {
  range: Range;
  isEquity: boolean;
}

/**
 * Destaque principal do resultado: a faixa de valuation final (mín · base ·
 * máx). O valor-base aparece em tamanho grande; mín e máx flanqueiam com menos
 * peso visual. Deixa explícito se o número é valor da operação (enterprise) ou
 * valor para o sócio (equity).
 */
export default function ValuationRangeCard({ range, isEquity }: ValuationRangeCardProps) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-agro-600 to-agro-800 p-6 text-white sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-agro-100">
            {isEquity ? 'Valor para o sócio (equity value)' : 'Valor da operação (enterprise value)'}
          </p>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-agro-50">
            faixa estimada
          </span>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <span
            className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl"
            title={formatBRL(range.base)}
          >
            {formatBRLCompact(range.base)}
          </span>
          <span className="pb-1 text-sm text-agro-100">valor central</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs font-medium text-agro-100">Mínimo</p>
            <p className="mt-0.5 text-xl font-bold" title={formatBRL(range.min)}>
              {formatBRLCompact(range.min)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs font-medium text-agro-100">Máximo</p>
            <p className="mt-0.5 text-xl font-bold" title={formatBRL(range.max)}>
              {formatBRLCompact(range.max)}
            </p>
          </div>
        </div>

        {!isEquity && (
          <p className="mt-4 text-xs leading-snug text-agro-100/90">
            Este é o valor da operação. Informe caixa e dívida para chegar ao
            valor que caberia ao sócio.
          </p>
        )}
      </div>
    </div>
  );
}
