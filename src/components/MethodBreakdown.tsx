import type { MethodResult } from '../lib/valuation';
import { formatBRLCompact } from '../lib/format';

const DOT_COLOR: Record<MethodResult['key'], string> = {
  revenue: '#1baf7a',
  ebitda: '#2a78d6',
  dcf: '#eda100',
};

interface MethodBreakdownProps {
  methods: MethodResult[];
}

/**
 * Detalha método por método: valor-base, faixa, uma frase explicando o que o
 * método significa e o peso que ele teve na consolidação. Métodos indisponíveis
 * (ex.: EBITDA negativo) aparecem com aviso claro, sem quebrar a interface.
 */
export default function MethodBreakdown({ methods }: MethodBreakdownProps) {
  return (
    <div className="space-y-3">
      {methods.map((m) => {
        const dot = DOT_COLOR[m.key];
        if (!m.available || !m.range) {
          return (
            <div
              key={m.key}
              className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full opacity-40"
                  style={{ backgroundColor: dot }}
                />
                <p className="text-sm font-semibold text-agro-700">{m.label}</p>
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  indisponível
                </span>
              </div>
              <p className="mt-1.5 pl-[18px] text-xs leading-snug text-amber-700">
                {m.unavailableReason}
              </p>
            </div>
          );
        }

        return (
          <div key={m.key} className="rounded-xl border border-agro-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: dot }}
              />
              <p className="text-sm font-semibold text-agro-800">{m.label}</p>
              <span className="ml-auto text-xs font-medium text-agro-400">
                peso {Math.round(m.weight * 100)}%
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-agro-900">
                {formatBRLCompact(m.range.base)}
              </span>
              <span className="text-xs text-agro-400">
                ({formatBRLCompact(m.range.min)} – {formatBRLCompact(m.range.max)})
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-snug text-agro-500">{m.description}</p>
          </div>
        );
      })}
    </div>
  );
}
