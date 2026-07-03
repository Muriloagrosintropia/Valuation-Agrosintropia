import Field from './Field';
import { SECTOR_OPTIONS } from '../lib/sectors';
import {
  parseNumber,
  marginToValue,
  valueToMargin,
  type RawFormValues,
} from '../lib/valuation';
import { formatBRLCents, formatPercent } from '../lib/format';

interface ValuationFormProps {
  form: RawFormValues;
  onChange: (patch: Partial<RawFormValues>) => void;
  onReset: () => void;
  /** Preenche o formulário com o cenário de referência da Agrosintropia. */
  onLoadExample: () => void;
}

/**
 * Formulário enxuto: obrigatórios em cima, opcionais (ajuste fino) embaixo.
 * O cálculo é reativo — quem recalcula é o componente pai a cada mudança —, por
 * isso não há botão de enviar, apenas "Limpar tudo".
 */
export default function ValuationForm({
  form,
  onChange,
  onReset,
  onLoadExample,
}: ValuationFormProps) {
  const revenue = parseNumber(form.revenue) ?? 0;

  // Conversão automática margem ⇄ valor exibida como dica ao lado do rótulo.
  const marginEquivalent =
    revenue > 0 && form.ebitdaMode === 'margin'
      ? marginToValue(revenue, parseNumber(form.ebitdaMargin) ?? 0)
      : null;
  const valueEquivalent =
    revenue > 0 && form.ebitdaMode === 'value'
      ? valueToMargin(revenue, parseNumber(form.ebitdaValue) ?? 0)
      : null;

  /** Alterna entre informar EBITDA por margem (%) ou por valor (R$), convertendo. */
  const switchEbitdaMode = (mode: 'margin' | 'value') => {
    if (mode === form.ebitdaMode) return;
    if (mode === 'value') {
      // Ao ir para "valor", pré-preenche com o equivalente da margem atual.
      const v = revenue > 0 ? marginToValue(revenue, parseNumber(form.ebitdaMargin) ?? 0) : 0;
      onChange({
        ebitdaMode: 'value',
        ebitdaValue: v > 0 ? String(Math.round(v)) : form.ebitdaValue,
      });
    } else {
      const m = revenue > 0 ? valueToMargin(revenue, parseNumber(form.ebitdaValue) ?? 0) : 0;
      // Formata no padrão BR (vírgula decimal) para exibir e reparsear corretamente.
      // 2 casas minimizam a diferença ao converter um valor exato em percentual.
      const marginStr = m.toLocaleString('pt-BR', {
        maximumFractionDigits: 2,
      });
      onChange({
        ebitdaMode: 'margin',
        ebitdaMargin: m > 0 ? marginStr : form.ebitdaMargin,
      });
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-agro-900">Dados da empresa</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onLoadExample}
            className="rounded-lg border border-agro-200 bg-agro-50 px-3 py-1.5 text-sm font-medium text-agro-700 transition hover:border-agro-300 hover:bg-agro-100"
            title="Preenche com o cenário de referência da Agrosintropia"
          >
            🌿 Exemplo Agrosintropia
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-agro-600 transition hover:bg-agro-50 hover:text-agro-800"
          >
            Limpar tudo
          </button>
        </div>
      </div>

      {/* ---------------- Obrigatórios ---------------- */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-agro-400">
          Obrigatórios
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Receita anual"
            hint="Faturamento dos últimos 12 meses."
            prefix="R$"
            required
            value={form.revenue}
            onChange={(v) => onChange({ revenue: v })}
            placeholder="0"
          />
          <Field
            label="Crescimento anual esperado"
            hint="Quanto a receita deve crescer por ano."
            suffix="%"
            required
            value={form.growth}
            onChange={(v) => onChange({ growth: v })}
            placeholder="0"
          />

          {/* EBITDA: dois caminhos (margem % ou valor R$), com conversão. */}
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-agro-800">
                EBITDA<span className="ml-0.5 text-agro-500">*</span>
              </span>
              <div className="inline-flex rounded-lg border border-agro-200 bg-agro-50 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => switchEbitdaMode('margin')}
                  className={`rounded-md px-2.5 py-1 transition ${
                    form.ebitdaMode === 'margin'
                      ? 'bg-white text-agro-800 shadow-sm'
                      : 'text-agro-500 hover:text-agro-700'
                  }`}
                >
                  Margem %
                </button>
                <button
                  type="button"
                  onClick={() => switchEbitdaMode('value')}
                  className={`rounded-md px-2.5 py-1 transition ${
                    form.ebitdaMode === 'value'
                      ? 'bg-white text-agro-800 shadow-sm'
                      : 'text-agro-500 hover:text-agro-700'
                  }`}
                >
                  Valor R$
                </button>
              </div>
            </div>

            {form.ebitdaMode === 'margin' ? (
              <Field
                label=""
                suffix="%"
                value={form.ebitdaMargin}
                onChange={(v) => onChange({ ebitdaMargin: v })}
                placeholder="0"
                hint={
                  marginEquivalent != null
                    ? `Equivale a ${formatBRLCents(marginEquivalent)} de EBITDA.`
                    : 'Margem de EBITDA sobre a receita.'
                }
              />
            ) : (
              <Field
                label=""
                prefix="R$"
                value={form.ebitdaValue}
                onChange={(v) => onChange({ ebitdaValue: v })}
                placeholder="0"
                hint={
                  valueEquivalent != null
                    ? `Equivale a uma margem de ${formatPercent(valueEquivalent / 100, 1)}.`
                    : 'Valor do EBITDA em reais.'
                }
              />
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-agro-800">
                Setor da empresa<span className="ml-0.5 text-agro-500">*</span>
              </span>
              <select
                className="field-input appearance-none bg-white"
                value={form.sector}
                onChange={(e) =>
                  onChange({ sector: e.target.value as RawFormValues['sector'] })
                }
              >
                {SECTOR_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs leading-snug text-agro-500">
                Carrega os múltiplos de referência do setor.
              </p>
            </label>
          </div>
        </div>
      </section>

      {/* ---------------- Opcionais ---------------- */}
      <section className="mt-6 border-t border-agro-100 pt-5">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-agro-400">
          Opcionais — ajuste fino
        </h3>
        <p className="mb-3 text-xs text-agro-500">
          Quanto mais campos preenchidos, maior o índice de confiança.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Receita recorrente"
            hint="% do faturamento previsível (assinaturas, contratos)."
            suffix="%"
            value={form.recurringPct}
            onChange={(v) => onChange({ recurringPct: v })}
            placeholder="0"
          />
          <div className="hidden sm:block" aria-hidden />
          <Field
            label="Caixa disponível"
            hint="Dinheiro e aplicações. Ajusta para valor do sócio."
            prefix="R$"
            value={form.cash}
            onChange={(v) => onChange({ cash: v })}
            placeholder="0"
          />
          <Field
            label="Dívida total"
            hint="Empréstimos e financiamentos. Ajusta para valor do sócio."
            prefix="R$"
            value={form.debt}
            onChange={(v) => onChange({ debt: v })}
            placeholder="0"
          />
        </div>
      </section>
    </div>
  );
}
