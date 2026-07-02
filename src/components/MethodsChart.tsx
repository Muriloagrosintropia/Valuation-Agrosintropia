import {
  Bar,
  BarChart,
  Cell,
  ErrorBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MethodResult } from '../lib/valuation';
import { formatBRLCompact, formatBRL } from '../lib/format';

/**
 * Cores categóricas por método. Paleta validada (contraste + segurança para
 * daltônicos) via o validador do skill de dataviz — separação CVD (ΔE tritan
 * ~21) bem acima do piso; a ordem dos slots é o mecanismo de separação, então
 * não reordene à toa. A identidade de cada método não fica só na cor: o eixo X
 * rotula cada barra, o tooltip mostra os valores e o detalhamento abaixo repete
 * cada faixa (encoding secundário, nunca cor sozinha).
 */
const METHOD_COLORS: Record<MethodResult['key'], string> = {
  revenue: '#1baf7a', // aqua/verde
  ebitda: '#2a78d6', // azul
  dcf: '#eda100', // amarelo
};

const SHORT_LABEL: Record<MethodResult['key'], string> = {
  revenue: 'Receita',
  ebitda: 'EBITDA',
  dcf: 'DCF',
};

interface MethodsChartProps {
  methods: MethodResult[];
}

interface ChartDatum {
  key: MethodResult['key'];
  name: string;
  min: number;
  base: number;
  max: number;
  /** Magnitudes do erro [para baixo, para cima] usadas pela ErrorBar. */
  errorY: [number, number];
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ChartDatum;
  return (
    <div className="rounded-lg border border-agro-100 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-agro-900">{d.name}</p>
      <p className="text-agro-600">
        Base: <strong className="text-agro-900">{formatBRL(d.base)}</strong>
      </p>
      <p className="text-agro-500">
        Faixa: {formatBRLCompact(d.min)} – {formatBRLCompact(d.max)}
      </p>
    </div>
  );
}

/**
 * Gráfico de barras comparando os métodos disponíveis lado a lado. Cada barra é
 * o valor-base do método; a haste (ErrorBar) mostra a faixa mín–máx daquele
 * método, deixando visível de onde vem cada número.
 */
export default function MethodsChart({ methods }: MethodsChartProps) {
  const data: ChartDatum[] = methods
    .filter((m) => m.available && m.range)
    .map((m) => {
      const r = m.range!;
      return {
        key: m.key,
        name: SHORT_LABEL[m.key],
        min: r.min,
        base: r.base,
        max: r.max,
        errorY: [r.base - r.min, r.max - r.base],
      };
    });

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-agro-400">
        Sem métodos disponíveis para comparar.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, bottom: 4, left: 8 }}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={{ stroke: '#e0efdd' }}
            tick={{ fill: '#52514e', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            hide
            domain={[0, (max: number) => max * 1.15]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(67,138,54,0.06)' }} />
          <Bar dataKey="base" radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.key} fill={METHOD_COLORS[d.key]} />
            ))}
            {/* Haste da faixa mín–máx do método. */}
            <ErrorBar
              dataKey="errorY"
              width={5}
              strokeWidth={1.5}
              stroke="#285821"
              direction="y"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
