/**
 * Barra de filtros usada no painel do agente.
 *
 * Reúne o campo de busca por palavra e as abas de situação. O
 * componente não filtra a lista de chamados por conta própria.
 * Ele só recebe os valores atuais e dispara as funções recebidas
 * quando o usuário interage. A filtragem acontece no PainelAgente,
 * que é quem detém a lista.
 *
 * Esse modelo de estado controlado por fora deixa a barra simples
 * e fácil de testar. Para mostrar a barra com qualquer combinação
 * de termo de busca e aba ativa, basta passar os valores como prop.
 */
"use client";

import { Search } from "lucide-react";

/**
 * Conjunto de filtros de situação aceitos. O valor todos significa
 * que nenhum filtro foi aplicado por situação. Os outros valores
 * coincidem com os possíveis status do chamado.
 */
export type AbaStatus = "todos" | "Aberto" | "Em Andamento" | "Concluído";

interface PropsBarraFiltros {
  /** Texto digitado no campo de busca, controlado por fora. */
  termoBusca: string;
  /** Aba de situação atualmente ativa. */
  abaAtiva: AbaStatus;
  /** Função chamada toda vez que o usuário troca o termo digitado. */
  aoMudarBusca: (texto: string) => void;
  /** Função chamada quando o usuário escolhe outra aba de situação. */
  aoMudarAba: (aba: AbaStatus) => void;
}

/**
 * Lista das abas exibidas, com o valor que vai para o filtro e o
 * rótulo mostrado ao usuário. Manter a lista em uma constante
 * facilita ajustar nomes ou ordem sem mexer no JSX.
 */
const ABAS: { valor: AbaStatus; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "Aberto", rotulo: "Abertos" },
  { valor: "Em Andamento", rotulo: "Em andamento" },
  { valor: "Concluído", rotulo: "Concluídos" },
];

export function BarraFiltros({
  termoBusca,
  abaAtiva,
  aoMudarBusca,
  aoMudarAba,
}: PropsBarraFiltros) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tintaFraca"
        />
        <input
          aria-label="Pesquisar chamados"
          type="search"
          value={termoBusca}
          onChange={(e) => aoMudarBusca(e.target.value)}
          placeholder="Pesquisar por título, protocolo ou solicitante"
          className="h-10 w-full rounded-lg border border-linha bg-papel pl-9 pr-3 text-sm transition-shadow placeholder:text-slate-400 focus:border-marca focus:outline-none focus:ring-2 focus:ring-marca/20"
        />
      </div>

      <div
        role="group"
        aria-label="Filtrar por situação"
        className="flex w-full gap-1 overflow-x-auto rounded-lg border border-linha bg-fundo p-1 sm:w-auto"
      >
        {ABAS.map(({ valor, rotulo }) => {
          const ativa = valor === abaAtiva;
          return (
            <button
              type="button"
              aria-pressed={ativa}
              key={valor}
              onClick={() => aoMudarAba(valor)}
              className={[
                "flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-marca sm:flex-none",
                ativa
                  ? "bg-papel text-tinta shadow-sm"
                  : "text-tintaFraca hover:bg-papel/70 hover:text-tinta",
              ].join(" ")}
            >
              {rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}
