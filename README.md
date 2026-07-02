# Calculadora de Valuation — Agrosintropia

Ferramenta web **interna** para estimar o valor de empresas (a própria
Agrosintropia, clientes e possíveis parcerias). Em vez de cuspir um número solto
que passa falsa precisão, ela calcula o valor por **três métodos independentes**,
cruza os resultados e entrega uma **faixa de valor** (mínimo · base · máximo)
acompanhada de um **índice de confiança**.

Roda inteira no navegador — sem backend, sem banco de dados, sem login.

## Como rodar

Pré-requisito: Node.js 18+ (testado no 22).

```bash
npm install   # instala as dependências
npm run dev   # sobe o servidor de desenvolvimento (Vite)
```

Abra o endereço que o Vite imprimir (por padrão `http://localhost:5173`).

Outros comandos:

```bash
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção localmente
npm test          # roda os testes da lógica de cálculo (Vitest)
```

## Stack

- **React 18 + Vite** (TypeScript)
- **Tailwind CSS** para estilização
- **Recharts** para o gráfico comparativo
- Estado 100% em memória (`useState` / `useMemo`) — nada é persistido

## Como funciona: os três métodos

Toda a lógica vive isolada em [`src/lib/valuation.ts`](src/lib/valuation.ts),
bem comentada e sem dependência de React (fácil de testar e ajustar).

1. **Múltiplo de Receita** — multiplica a receita anual pelo múltiplo de receita
   do setor. Aplica um leve **prêmio** quando o crescimento e a receita
   recorrente são altos (negócios que crescem rápido e são previsíveis valem
   mais por real de faturamento).

2. **Múltiplo de EBITDA** — multiplica o EBITDA (informado por margem % ou valor
   R$) pelo múltiplo de EBITDA do setor. Se o EBITDA for **zero ou negativo**, o
   método fica indisponível de forma elegante e a ferramenta avisa que o negócio
   ainda não é lucrativo.

3. **Fluxo de Caixa Descontado (DCF) simplificado** — projeta o fluxo de caixa
   livre por 5 anos a partir do EBITDA, com o crescimento **desacelerando**
   gradualmente (freio contra projeções irreais), traz tudo a valor presente e
   soma um valor terminal conservador. Também depende de EBITDA positivo.

### Consolidação e confiança

- A **faixa final** é uma média ponderada dos métodos disponíveis. Quando o
  negócio é lucrativo, EBITDA e DCF pesam mais; quando o EBITDA é fraco/negativo,
  o peso vai para o múltiplo de receita.
- Se **caixa** e/ou **dívida** forem informados, o resultado é ajustado de
  _enterprise value_ (valor da operação) para _equity value_ (valor para o
  sócio): `equity = enterprise − dívida + caixa`.
- O **índice de confiança (0–100)** combina a **convergência** entre os métodos
  (quanto mais próximos, maior) com a **completude** dos dados (quantos campos
  opcionais foram preenchidos). Rótulos: `< 40` baixa · `40–70` média · `> 70` alta.

## Onde ajustar os parâmetros

- **Múltiplos por setor** → [`src/lib/sectors.ts`](src/lib/sectors.ts). Cada
  setor tem múltiplo de receita e de EBITDA com min/base/máx. São **benchmarks
  de referência** para o mercado brasileiro e **devem ser revisados
  periodicamente**. Basta editar os números; a calculadora se atualiza sozinha.

- **Premissas do DCF** → constantes no topo de
  [`src/lib/valuation.ts`](src/lib/valuation.ts):
  - `DISCOUNT_RATE` — taxa de desconto padrão (custo de capital). Padrão: **15%**.
  - `DISCOUNT_RATE_SPREAD` — sensibilidade que gera a faixa do DCF (±3 p.p.).
  - `TERMINAL_GROWTH` — crescimento na perpetuidade (padrão 3%).
  - `PROJECTION_YEARS`, `FCF_CONVERSION_FACTOR`, `GROWTH_DECAY`,
    `MAX_PROJECTION_GROWTH` — horizonte, conversão de EBITDA em caixa e freio de
    crescimento.

- **Pesos da consolidação** → constante `WEIGHTS_PROFITABLE` no mesmo arquivo.

## Estrutura do projeto

```
src/
├── App.tsx                 # layout de página única + estado + cálculo reativo
├── main.tsx                # ponto de entrada React
├── index.css               # Tailwind + estilos base
├── lib/
│   ├── valuation.ts        # os 3 métodos, consolidação e índice de confiança
│   ├── valuation.test.ts   # testes da lógica de cálculo (Vitest)
│   ├── sectors.ts          # tabela de setores e múltiplos (editável)
│   └── format.ts           # formatação monetária no padrão brasileiro
└── components/
    ├── ValuationForm.tsx    # formulário (obrigatórios + opcionais)
    ├── Field.tsx            # campo de input reutilizável
    ├── ResultsPanel.tsx     # coluna de resultado
    ├── ValuationRangeCard.tsx  # faixa final em destaque
    ├── ConfidenceBadge.tsx  # selo de índice de confiança
    ├── MethodsChart.tsx     # gráfico de barras comparando os métodos
    └── MethodBreakdown.tsx  # detalhe método por método
```

## Aviso

Esta ferramenta é uma **estimativa de apoio à decisão**, baseada em múltiplos de
referência e premissas simplificadas. **Não é um laudo de avaliação formal** nem
substitui uma análise detalhada (due diligence). Revise as premissas antes de
usar qualquer número em negociações.
