import type { ReactNode } from 'react';
import { SECTORS, SECTOR_OPTIONS } from '../lib/sectors';
import {
  DISCOUNT_RATE,
  DISCOUNT_RATE_SPREAD,
  TERMINAL_GROWTH,
  PROJECTION_YEARS,
  FCF_CONVERSION_FACTOR,
  GROWTH_DECAY,
  MAX_PROJECTION_GROWTH,
  WEIGHTS_PROFITABLE,
} from '../lib/valuation';
import { formatPercent } from '../lib/format';

/**
 * Página de metodologia / documentação do sistema.
 *
 * Sempre que possível, os números (múltiplos por setor, premissas do DCF,
 * pesos) são lidos DIRETO da configuração do código — assim a documentação
 * nunca fica desatualizada em relação ao que a calculadora realmente faz.
 */

interface DocumentationProps {
  onBack: () => void;
}

/** Formata um múltiplo (ex.: 1.3 → "1,3×"). */
const x = (n: number) => `${n.toLocaleString('pt-BR')}×`;

/** Seção com título e âncora para o índice. */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 border-b border-agro-100 pb-2 text-xl font-bold text-agro-900">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-agro-700">{children}</div>
    </section>
  );
}

/** Item do glossário. */
function Term({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-agro-100 bg-white p-4">
      <dt className="font-semibold text-agro-900">{term}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-agro-600">{children}</dd>
    </div>
  );
}

const TOC = [
  ['visao-geral', '1. Visão geral'],
  ['como-funciona', '2. Como funciona (passo a passo)'],
  ['metodos', '3. Os três métodos'],
  ['consolidacao', '4. Consolidação e pesos'],
  ['ev-equity', '5. Valor da operação × valor do sócio'],
  ['confianca', '6. Índice de confiança'],
  ['multiplos', '7. Múltiplos por setor'],
  ['premissas-dcf', '8. Premissas do fluxo de caixa descontado'],
  ['glossario', '9. Glossário de termos'],
  ['limitacoes', '10. Limitações e boas práticas'],
  ['ajustes', '11. Onde ajustar os parâmetros'],
];

export default function Documentation({ onBack }: DocumentationProps) {
  // Exemplo do "freio" de crescimento no DCF, para um crescimento inicial de 20%.
  const gExample = 0.2;
  const decayRows = Array.from({ length: PROJECTION_YEARS }, (_, i) => {
    const year = i + 1;
    const g =
      TERMINAL_GROWTH + (gExample - TERMINAL_GROWTH) * Math.pow(GROWTH_DECAY, year - 1);
    return { year, g };
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-agro-400">
          Documentação
        </p>
        <h1 className="mt-1 text-2xl font-bold text-agro-900 sm:text-3xl">
          Metodologia da Calculadora de Valuation
        </h1>
        <p className="mt-2 text-sm text-agro-600">
          Como o sistema estima o valor de uma empresa, quais premissas usa e o
          que cada número significa. Documento de referência interno da
          Agrosintropia.
        </p>
      </div>

      {/* Índice */}
      <nav className="mb-8 rounded-2xl border border-agro-100 bg-white p-4 sm:p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-agro-400">
          Índice
        </p>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {TOC.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="text-sm text-agro-600 underline-offset-2 hover:text-agro-800 hover:underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {/* 1. VISÃO GERAL */}
        <Section id="visao-geral" title="1. Visão geral">
          <p>
            Esta é uma ferramenta <strong>interna</strong> para estimar o valor de
            empresas — a própria Agrosintropia, clientes e possíveis parcerias. O
            princípio central é unir <strong>simplicidade no preenchimento</strong>{' '}
            com <strong>confiabilidade no resultado</strong>.
          </p>
          <p>
            Para isso, ela não depende de um único método. Calcula o valor por{' '}
            <strong>três métodos independentes ao mesmo tempo</strong>, cruza os
            resultados e entrega uma <strong>faixa de valor</strong> (mínimo, base e
            máximo) acompanhada de um <strong>índice de confiança</strong> — em vez
            de cuspir um número solto que passa falsa precisão.
          </p>
          <div className="rounded-xl bg-agro-100/60 p-4 text-agro-700">
            <strong>Em uma frase:</strong> preencha poucos dados essenciais e a
            ferramenta devolve uma faixa de valor defensável, deixando claro o grau
            de confiança daquela estimativa.
          </div>
        </Section>

        {/* 2. COMO FUNCIONA */}
        <Section id="como-funciona" title="2. Como funciona (passo a passo)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Você informa os <strong>dados obrigatórios</strong> (receita,
              crescimento, EBITDA e setor) e, opcionalmente, os de{' '}
              <strong>ajuste fino</strong> (recorrência, caixa e dívida).
            </li>
            <li>
              A ferramenta roda os <strong>três métodos</strong> e obtém, de cada um,
              uma faixa (mínimo/base/máximo).
            </li>
            <li>
              Ela <strong>consolida</strong> os métodos disponíveis numa faixa final,
              por média ponderada.
            </li>
            <li>
              Se você informou caixa/dívida, ajusta de{' '}
              <strong>valor da operação</strong> para{' '}
              <strong>valor do sócio</strong>.
            </li>
            <li>
              Calcula o <strong>índice de confiança</strong> e mostra tudo: a faixa
              em destaque, o selo de confiança, o gráfico comparativo e o detalhe por
              método.
            </li>
          </ol>
          <p>
            O cálculo é <strong>reativo</strong>: recalcula na hora a cada mudança de
            campo, sem botão de enviar. Nenhum dado é salvo ou enviado para fora — a
            ferramenta roda inteiramente no seu navegador.
          </p>
        </Section>

        {/* 3. MÉTODOS */}
        <Section id="metodos" title="3. Os três métodos">
          <div className="rounded-xl border border-agro-100 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-agro-900">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#1baf7a' }}
              />
              Método 1 — Múltiplo de Receita
            </h3>
            <p className="mt-2">
              Multiplica a receita anual pelo <em>múltiplo de receita</em> do setor
              (nas três pontas). Aplica um <strong>prêmio de qualidade da receita</strong>,
              porque negócios que crescem rápido e têm receita previsível valem mais
              por real faturado:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Crescimento:</strong> cada ponto acima de 10% a.a. vira
                prêmio, até <strong>+25%</strong> (atingido a partir de ~60% de
                crescimento).
              </li>
              <li>
                <strong>Recorrência:</strong> receita 100% recorrente adiciona até{' '}
                <strong>+15%</strong>, proporcional ao percentual informado.
              </li>
              <li>
                Prêmio máximo combinado: <strong>+40%</strong>. É moderado de
                propósito, pois este método já é o mais otimista (ignora
                rentabilidade). <strong>Sempre disponível</strong> quando há receita.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-agro-100 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-agro-900">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#2a78d6' }}
              />
              Método 2 — Múltiplo de EBITDA
            </h3>
            <p className="mt-2">
              Multiplica o <strong>EBITDA</strong> (informado por margem % ou valor
              R$) pelo <em>múltiplo de EBITDA</em> do setor, nas três pontas. É o
              método que olha para a <strong>geração de caixa operacional</strong>.
            </p>
            <p className="mt-2">
              Se o EBITDA for <strong>zero ou negativo</strong>, o método fica{' '}
              <strong>indisponível</strong> de forma elegante — o negócio ainda não é
              lucrativo, e a ferramenta avisa que o valor passa a se apoiar no
              múltiplo de receita.
            </p>
          </div>

          <div className="rounded-xl border border-agro-100 bg-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-agro-900">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#eda100' }}
              />
              Método 3 — Fluxo de Caixa Descontado (DCF)
            </h3>
            <p className="mt-2">
              Projeta o fluxo de caixa livre por{' '}
              <strong>{PROJECTION_YEARS} anos</strong> a partir do EBITDA e traz tudo
              a valor presente, somando um valor terminal. As premissas exatas estão
              na <a href="#premissas-dcf" className="text-agro-600 underline">seção 8</a>.
            </p>
            <p className="mt-2">
              Ponto-chave: o crescimento parte da taxa informada e{' '}
              <strong>desacelera a cada ano</strong> (o "freio"), convergindo para o
              crescimento de perpetuidade. Isso impede projeções absurdas. Exemplo,
              partindo de {formatPercent(gExample)} de crescimento:
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse text-center text-xs">
                <thead>
                  <tr className="text-agro-500">
                    <th className="border-b border-agro-100 p-2 text-left">Ano</th>
                    {decayRows.map((r) => (
                      <th key={r.year} className="border-b border-agro-100 p-2">
                        {r.year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 text-left font-medium text-agro-700">
                      Crescimento aplicado
                    </td>
                    {decayRows.map((r) => (
                      <td key={r.year} className="p-2 text-agro-800">
                        {formatPercent(r.g, 1)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2">
              Como o DCF parte do EBITDA, ele também fica{' '}
              <strong>indisponível quando o EBITDA é ≤ 0</strong>.
            </p>
          </div>
        </Section>

        {/* 4. CONSOLIDAÇÃO */}
        <Section id="consolidacao" title="4. Consolidação e pesos">
          <p>
            A faixa final é uma <strong>média ponderada</strong> dos métodos
            disponíveis, calculada ponta a ponta (mínimo com mínimo, base com base,
            máximo com máximo). Os pesos dependem de o negócio ser lucrativo:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-agro-500">
                  <th className="border-b border-agro-100 p-2">Situação</th>
                  <th className="border-b border-agro-100 p-2">Receita</th>
                  <th className="border-b border-agro-100 p-2">EBITDA</th>
                  <th className="border-b border-agro-100 p-2">DCF</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-agro-50 p-2 font-medium text-agro-800">
                    Negócio lucrativo (EBITDA &gt; 0)
                  </td>
                  <td className="border-b border-agro-50 p-2">
                    {formatPercent(WEIGHTS_PROFITABLE.revenue)}
                  </td>
                  <td className="border-b border-agro-50 p-2">
                    {formatPercent(WEIGHTS_PROFITABLE.ebitda)}
                  </td>
                  <td className="border-b border-agro-50 p-2">
                    {formatPercent(WEIGHTS_PROFITABLE.dcf)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-agro-800">
                    EBITDA ≤ 0 (só receita disponível)
                  </td>
                  <td className="p-2">100%</td>
                  <td className="p-2 text-agro-400">indisponível</td>
                  <td className="p-2 text-agro-400">indisponível</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>Lógica:</strong> quando há lucro, EBITDA e DCF (que olham a
            geração de caixa real) pesam mais; o múltiplo de receita entra como
            âncora de mercado com peso menor. Sem lucro, o valor se apoia inteiramente
            na receita.
          </p>
        </Section>

        {/* 5. EV × EQUITY */}
        <Section id="ev-equity" title="5. Valor da operação × valor do sócio">
          <p>
            Os métodos calculam primeiro o{' '}
            <strong>valor da operação (enterprise value)</strong> — quanto vale o
            negócio como um todo, independentemente de como está financiado.
          </p>
          <p>
            Se você informar <strong>caixa</strong> e/ou <strong>dívida</strong>, a
            ferramenta ajusta para o{' '}
            <strong>valor para o sócio (equity value)</strong>:
          </p>
          <div className="rounded-xl bg-agro-100/60 p-4 text-center font-medium text-agro-800">
            Valor do sócio = Valor da operação − Dívida + Caixa
          </div>
          <p>
            Sem esses campos, a ferramenta mostra o valor da operação e deixa claro
            na tela que aquele número é o valor do negócio, não o que caberia ao
            sócio.
          </p>
        </Section>

        {/* 6. CONFIANÇA */}
        <Section id="confianca" title="6. Índice de confiança">
          <p>
            Uma nota de <strong>0 a 100</strong> que combina dois fatores:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Convergência entre os métodos (peso 60%):</strong> quanto mais
              próximos os resultados dos métodos, maior a confiança. Se os três
              apontam para valores parecidos, o número é mais crível. Com apenas um
              método disponível, esse fator vale 0,4 (não dá para cruzar).
            </li>
            <li>
              <strong>Completude dos dados (peso 40%):</strong> fração dos 3 campos
              opcionais (recorrência, caixa, dívida) que foram preenchidos.
            </li>
          </ul>
          <div className="rounded-xl bg-agro-100/60 p-4 text-center font-medium text-agro-800">
            nota = 100 × (0,6 × convergência + 0,4 × completude)
          </div>
          <p>
            Rótulos: <strong>abaixo de 40</strong> confiança baixa ·{' '}
            <strong>40 a 70</strong> média · <strong>acima de 70</strong> alta.
          </p>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
            💡 Efeito importante: uma margem muito alta costuma{' '}
            <strong>reduzir</strong> a confiança, porque afasta o método de receita
            (que "trava" no faturamento) dos métodos de lucro (EBITDA/DCF). Isso não é
            um bug — é a ferramenta sinalizando honestamente que os métodos discordam.
          </p>
        </Section>

        {/* 7. MÚLTIPLOS POR SETOR */}
        <Section id="multiplos" title="7. Múltiplos por setor">
          <p>
            Cada setor traz um múltiplo de <strong>receita</strong> (EV / Receita) e
            um de <strong>EBITDA</strong> (EV / EBITDA), cada um com mínimo, base e
            máximo. A tabela abaixo é gerada direto da configuração do sistema:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-agro-500">
                  <th rowSpan={2} className="border-b border-agro-100 p-2 align-bottom">
                    Setor
                  </th>
                  <th colSpan={3} className="border-b border-agro-100 p-2 text-center">
                    Múltiplo de Receita
                  </th>
                  <th colSpan={3} className="border-b border-agro-100 p-2 text-center">
                    Múltiplo de EBITDA
                  </th>
                </tr>
                <tr className="text-agro-400">
                  <th className="border-b border-agro-100 p-2 text-center font-normal">mín</th>
                  <th className="border-b border-agro-100 p-2 text-center font-normal">base</th>
                  <th className="border-b border-agro-100 p-2 text-center font-normal">máx</th>
                  <th className="border-b border-agro-100 p-2 text-center font-normal">mín</th>
                  <th className="border-b border-agro-100 p-2 text-center font-normal">base</th>
                  <th className="border-b border-agro-100 p-2 text-center font-normal">máx</th>
                </tr>
              </thead>
              <tbody>
                {SECTOR_OPTIONS.map(({ key }) => {
                  const s = SECTORS[key];
                  return (
                    <tr key={key}>
                      <td className="border-b border-agro-50 p-2 font-medium text-agro-800">
                        {s.label}
                      </td>
                      <td className="border-b border-agro-50 p-2 text-center text-agro-600">{x(s.revenueMultiple.min)}</td>
                      <td className="border-b border-agro-50 p-2 text-center font-semibold text-agro-900">{x(s.revenueMultiple.base)}</td>
                      <td className="border-b border-agro-50 p-2 text-center text-agro-600">{x(s.revenueMultiple.max)}</td>
                      <td className="border-b border-agro-50 p-2 text-center text-agro-600">{x(s.ebitdaMultiple.min)}</td>
                      <td className="border-b border-agro-50 p-2 text-center font-semibold text-agro-900">{x(s.ebitdaMultiple.base)}</td>
                      <td className="border-b border-agro-50 p-2 text-center text-agro-600">{x(s.ebitdaMultiple.max)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
            ⚠️ Estes múltiplos são <strong>benchmarks de referência</strong> para o
            mercado brasileiro — um ponto de partida defensável, não cotações
            auditadas. <strong>Devem ser revisados periodicamente</strong>.
          </p>
        </Section>

        {/* 8. PREMISSAS DCF */}
        <Section id="premissas-dcf" title="8. Premissas do fluxo de caixa descontado">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-agro-500">
                  <th className="border-b border-agro-100 p-2">Premissa</th>
                  <th className="border-b border-agro-100 p-2">Valor</th>
                  <th className="border-b border-agro-100 p-2">Por quê</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-agro-50 p-2 font-medium text-agro-800">Taxa de desconto</td>
                  <td className="border-b border-agro-50 p-2">{formatPercent(DISCOUNT_RATE)} a.a.</td>
                  <td className="border-b border-agro-50 p-2 text-agro-600">Custo de capital de PMEs no Brasil (Selic + prêmio de risco).</td>
                </tr>
                <tr>
                  <td className="border-b border-agro-50 p-2 font-medium text-agro-800">Faixa da taxa</td>
                  <td className="border-b border-agro-50 p-2">± {formatPercent(DISCOUNT_RATE_SPREAD)}</td>
                  <td className="border-b border-agro-50 p-2 text-agro-600">Gera o mín/máx do DCF (descontar menos = vale mais).</td>
                </tr>
                <tr>
                  <td className="border-b border-agro-50 p-2 font-medium text-agro-800">Crescimento na perpetuidade</td>
                  <td className="border-b border-agro-50 p-2">{formatPercent(TERMINAL_GROWTH)} a.a.</td>
                  <td className="border-b border-agro-50 p-2 text-agro-600">Conservador, próximo de inflação/PIB de longo prazo.</td>
                </tr>
                <tr>
                  <td className="border-b border-agro-50 p-2 font-medium text-agro-800">Horizonte de projeção</td>
                  <td className="border-b border-agro-50 p-2">{PROJECTION_YEARS} anos</td>
                  <td className="border-b border-agro-50 p-2 text-agro-600">Projeção explícita antes do valor terminal.</td>
                </tr>
                <tr>
                  <td className="border-b border-agro-50 p-2 font-medium text-agro-800">Conversão EBITDA → caixa</td>
                  <td className="border-b border-agro-50 p-2">{formatPercent(FCF_CONVERSION_FACTOR)}</td>
                  <td className="border-b border-agro-50 p-2 text-agro-600">Desconta impostos, capex e capital de giro (proxy prudente).</td>
                </tr>
                <tr>
                  <td className="border-b border-agro-50 p-2 font-medium text-agro-800">Freio de crescimento</td>
                  <td className="border-b border-agro-50 p-2">fator {GROWTH_DECAY.toLocaleString('pt-BR')}</td>
                  <td className="border-b border-agro-50 p-2 text-agro-600">A cada ano o crescimento converge para a perpetuidade.</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-agro-800">Teto de crescimento</td>
                  <td className="p-2">{formatPercent(MAX_PROJECTION_GROWTH)} a.a.</td>
                  <td className="p-2 text-agro-600">Impede projeções irreais mesmo com crescimento muito alto.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            O <strong>valor terminal</strong> usa a fórmula de perpetuidade de
            Gordon: fluxo do último ano × (1 + crescimento perpétuo) ÷ (taxa de
            desconto − crescimento perpétuo), trazido a valor presente.
          </p>
        </Section>

        {/* 9. GLOSSÁRIO */}
        <Section id="glossario" title="9. Glossário de termos">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Term term="Valuation">
              Estimativa do valor econômico de uma empresa.
            </Term>
            <Term term="Receita (faturamento)">
              Total vendido/prestado num período (aqui, os últimos 12 meses).
            </Term>
            <Term term="EBITDA">
              Lucro antes de juros, impostos, depreciação e amortização. Aproxima a
              geração de caixa operacional do negócio.
            </Term>
            <Term term="Margem de EBITDA">
              EBITDA dividido pela receita, em %. Mede quanto de cada real faturado
              vira caixa operacional.
            </Term>
            <Term term="Múltiplo">
              Fator pelo qual se multiplica a receita ou o EBITDA para chegar ao
              valor (ex.: 7× o EBITDA). Reflete quanto o mercado paga por aquele tipo
              de negócio.
            </Term>
            <Term term="Enterprise Value (valor da operação)">
              Valor do negócio como um todo, antes de considerar caixa e dívida.
            </Term>
            <Term term="Equity Value (valor do sócio)">
              O que caberia aos donos: valor da operação − dívida + caixa.
            </Term>
            <Term term="Receita recorrente">
              Parte do faturamento previsível e repetível (contratos, mensalidades,
              assinaturas). Vale mais porque é mais estável.
            </Term>
            <Term term="DCF (Fluxo de Caixa Descontado)">
              Método que projeta o caixa futuro e o traz a valor presente por uma
              taxa de desconto.
            </Term>
            <Term term="Taxa de desconto (custo de capital)">
              Taxa que traz valores futuros ao presente. Reflete o risco e o custo do
              dinheiro no tempo.
            </Term>
            <Term term="Valor terminal">
              Valor do negócio depois do período projetado, assumindo crescimento
              estável para sempre (perpetuidade).
            </Term>
            <Term term="Perpetuidade">
              Suposição de que os fluxos continuam indefinidamente a um crescimento
              baixo e constante.
            </Term>
            <Term term="Faixa (mín / base / máx)">
              Intervalo de valor, em vez de um número único, para refletir a
              incerteza da estimativa.
            </Term>
            <Term term="Índice de confiança">
              Nota de 0 a 100 que resume o quão robusta é a estimativa (convergência
              dos métodos + completude dos dados).
            </Term>
          </dl>
        </Section>

        {/* 10. LIMITAÇÕES */}
        <Section id="limitacoes" title="10. Limitações e boas práticas">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              É uma <strong>estimativa de apoio à decisão</strong>, baseada em
              múltiplos de referência e premissas simplificadas.{' '}
              <strong>Não é um laudo de avaliação formal</strong> nem substitui uma
              due diligence.
            </li>
            <li>
              A <strong>margem/EBITDA é a variável mais decisiva</strong> — pequenas
              mudanças no custo movem muito o resultado. Vale caprichar nesse dado.
            </li>
            <li>
              Cuidado com <strong>pró-labore e retiradas dos sócios</strong>: definir
              se contam como custo (reduz o EBITDA) ou como distribuição de lucro
              (não reduz) muda bastante o valor.
            </li>
            <li>
              Os <strong>múltiplos por setor</strong> e a <strong>taxa de desconto</strong>{' '}
              devem ser revisados periodicamente conforme o mercado e os juros mudam.
            </li>
            <li>
              Prefira comunicar a <strong>faixa</strong> e o <strong>nível de
              confiança</strong>, não um número exato. Uma confiança baixa é um sinal
              para buscar mais dados antes de negociar.
            </li>
          </ul>
        </Section>

        {/* 11. AJUSTES (DEV) */}
        <Section id="ajustes" title="11. Onde ajustar os parâmetros">
          <p>Para quem mantém o sistema, os pontos de calibração ficam em:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <code className="rounded bg-agro-100 px-1.5 py-0.5 text-xs text-agro-800">
                src/lib/sectors.ts
              </code>{' '}
              — tabela de setores e múltiplos (receita e EBITDA, mín/base/máx).
            </li>
            <li>
              <code className="rounded bg-agro-100 px-1.5 py-0.5 text-xs text-agro-800">
                src/lib/valuation.ts
              </code>{' '}
              — constantes no topo do módulo (taxa de desconto, crescimento
              perpétuo, horizonte, conversão de caixa, freio) e os pesos da
              consolidação.
            </li>
          </ul>
          <p>
            Qualquer mudança nesses arquivos é refletida automaticamente na
            calculadora <em>e</em> nesta documentação (as tabelas acima são geradas a
            partir deles).
          </p>
        </Section>
      </div>

      {/* Rodapé com aviso e voltar */}
      <div className="mt-10 rounded-2xl bg-agro-100/60 p-4 text-xs leading-relaxed text-agro-600">
        <strong className="text-agro-700">Aviso:</strong> esta ferramenta é uma
        estimativa de apoio à decisão, não um laudo de avaliação formal. Revise as
        premissas antes de usar qualquer número em negociações.
      </div>
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-agro-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-agro-700"
        >
          ← Voltar à calculadora
        </button>
      </div>
    </main>
  );
}
