/**
- Tabela de chamados usada no painel do agente.
 *
- Mostra os chamados em formato de tabela porque o agente precisa
- comparar muitos atendimentos de uma vez. Cada linha tem o
- protocolo, título, solicitante, categoria, prioridade, situação,
- data de abertura e um botão para abrir os detalhes em uma janela
- sobreposta.
 *
- O componente é puramente visual: recebe a lista já filtrada e
- dispara aoSelecionar quando o usuário clica em Detalhes. A
- filtragem em si fica a cargo do PainelAgente.
 */
"use client";

import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import type { ChamadoResumo } from "@/views/compartilhado/tipos-view";
import {
  Etiqueta,
  corPorPrioridade,
  corPorStatus,
} from "@/views/compartilhado/Etiqueta";
import { EtiquetaPrazo } from "./EtiquetaPrazo";

interface PropsTabelaChamados {
  /** Lista que já foi filtrada por quem usa o componente. */
  chamados: ChamadoResumo[];
  /** Exibe um esqueleto enquanto os chamados são carregados. */
  carregando?: boolean;
  /**
- Função chamada quando o usuário clica em Detalhes em uma das
- linhas da tabela. Recebe o id do chamado correspondente.
   */
  aoSelecionar?: (idChamado: string) => void;
}

type ChaveColuna =
  | "protocolo"
  | "titulo"
  | "solicitante"
  | "categoria"
  | "prioridade"
  | "situacao"
  | "abertoEm"
  | "prazo"
  | "acoes";

const LARGURAS_INICIAIS: Record<ChaveColuna, number> = {
  protocolo: 130,
  titulo: 230,
  solicitante: 195,
  categoria: 125,
  prioridade: 115,
  situacao: 145,
  abertoEm: 150,
  prazo: 140,
  acoes: 95,
};

export function TabelaChamados({
  chamados,
  carregando = false,
  aoSelecionar,
}: PropsTabelaChamados) {
  const [atrasadosPrimeiro, setAtrasadosPrimeiro] = useState(false);
  const [larguras, setLarguras] =
    useState<Record<ChaveColuna, number>>(LARGURAS_INICIAIS);

  const iniciarRedimensionamento = (
    coluna: ChaveColuna,
    e: React.MouseEvent<HTMLSpanElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const xInicial = e.clientX;
    const larguraInicial = larguras[coluna];

    const aoMoverMouse = (eventoMove: MouseEvent) => {
      const novaLargura = Math.max(
        80,
        larguraInicial + (eventoMove.clientX - xInicial),
      );
      setLarguras((anterior) => ({ ...anterior, [coluna]: novaLargura }));
    };

    const aoSoltarMouse = () => {
      window.removeEventListener("mousemove", aoMoverMouse);
      window.removeEventListener("mouseup", aoSoltarMouse);
    };

    window.addEventListener("mousemove", aoMoverMouse);
    window.addEventListener("mouseup", aoSoltarMouse);
  };

  const chamadosOrdenados = useMemo(() => {
    if (!atrasadosPrimeiro) return chamados;

    const agora = Date.now();
    return [...chamados].sort((a, b) => {
      const prazoA = a.prazoEm ? new Date(a.prazoEm).getTime() : NaN;
      const prazoB = b.prazoEm ? new Date(b.prazoEm).getTime() : NaN;
      const ativoA = a.status !== "Concluído";
      const ativoB = b.status !== "Concluído";
      const grupoA =
        !ativoA ? 3 : Number.isNaN(prazoA) ? 2 : prazoA <= agora ? 0 : 1;
      const grupoB =
        !ativoB ? 3 : Number.isNaN(prazoB) ? 2 : prazoB <= agora ? 0 : 1;

      if (grupoA !== grupoB) return grupoA - grupoB;
      if (grupoA < 2) return prazoA - prazoB;
      return 0;
    });
  }, [chamados, atrasadosPrimeiro]);

  if (carregando) {
    return (
      <div
        role="status"
        aria-label="Carregando chamados"
        aria-busy="true"
        className="overflow-hidden rounded-xl border border-linha bg-papel shadow-sm"
      >
        <span className="sr-only">Carregando chamados...</span>
        <div className="animate-pulse">
          <div className="flex gap-6 border-b border-linha bg-slate-50 px-5 py-4">
            {[20, 32, 24, 20, 16, 20].map((largura, indice) => (
              <div
                key={indice}
                className="h-3 rounded bg-slate-200"
                style={{ width: `${largura * 4}px` }}
              />
            ))}
          </div>
          {Array.from({ length: 5 }, (_, indice) => (
            <div
              key={indice}
              className="flex items-center gap-6 border-b border-linha px-5 py-5 last:border-0"
            >
              {[20, 32, 24, 20, 16, 20].map((largura, coluna) => (
                <div
                  key={coluna}
                  className="h-4 rounded bg-slate-100"
                  style={{ width: `${largura * 4}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quando a lista filtrada está vazia, mostramos uma mensagem
  // amigável em vez de uma tabela com zero linhas. Isso ajuda o
  // agente a perceber que os filtros aplicados não retornaram nada.
  if (chamados.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center rounded-xl border border-dashed border-linha bg-papel px-6 py-14 text-center shadow-sm"
      >
        <div className="mb-4 rounded-full bg-slate-100 p-3 text-slate-500">
          <Inbox className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-tinta">
          Nenhum chamado por aqui
        </h2>
        <p className="mt-1 text-sm text-tintaFraca">
          Tente alterar a busca ou os filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-linha bg-papel shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-linha bg-slate-50 text-tintaFraca">
            <tr>
              <Th
                largura={larguras.protocolo}
                aoRedimensionar={(e) =>
                  iniciarRedimensionamento("protocolo", e)
                }
                className="hidden xl:table-cell"
              >
                Protocolo
              </Th>
              <Th
                largura={larguras.titulo}
                aoRedimensionar={(e) => iniciarRedimensionamento("titulo", e)}
              >
                Título
              </Th>
              <Th
                largura={larguras.solicitante}
                aoRedimensionar={(e) =>
                  iniciarRedimensionamento("solicitante", e)
                }
                className="hidden xl:table-cell"
              >
                Solicitante
              </Th>
              <Th
                largura={larguras.categoria}
                aoRedimensionar={(e) =>
                  iniciarRedimensionamento("categoria", e)
                }
                className="hidden xl:table-cell"
              >
                Categoria
              </Th>
              <Th
                largura={larguras.prioridade}
                aoRedimensionar={(e) =>
                  iniciarRedimensionamento("prioridade", e)
                }
                className="hidden lg:table-cell"
              >
                Prioridade
              </Th>
              <Th
                largura={larguras.situacao}
                aoRedimensionar={(e) => iniciarRedimensionamento("situacao", e)}
              >
                Situação
              </Th>
              <Th
                largura={larguras.abertoEm}
                aoRedimensionar={(e) => iniciarRedimensionamento("abertoEm", e)}
                className="hidden xl:table-cell"
              >
                Aberto em
              </Th>
              <Th
                largura={larguras.prazo}
                aoRedimensionar={(e) => iniciarRedimensionamento("prazo", e)}
              >
                <button
                  type="button"
                  aria-pressed={atrasadosPrimeiro}
                  aria-label={
                    atrasadosPrimeiro
                      ? "Desativar ordenação de chamados atrasados primeiro"
                      : "Ordenar chamados atrasados primeiro"
                  }
                  onClick={() => setAtrasadosPrimeiro((ativo) => !ativo)}
                  className="transition-colors hover:text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-marca"
                >
                  Prazo
                </button>
              </Th>
              <Th largura={larguras.acoes} className="text-right">
                Ações
              </Th>
            </tr>
          </thead>
          <tbody>
            {chamadosOrdenados.map((c) => (
              <tr
                key={c.id}
                className="border-b border-linha last:border-b-0 transition-colors duration-150 hover:bg-slate-50"
              >
                <Td className="hidden truncate font-mono text-xs xl:table-cell">
                  {c.protocolo}
                </Td>
                <Td className="font-medium text-tinta">
                  <span className="block truncate" title={c.titulo}>
                    {c.titulo}
                  </span>
                </Td>
                <Td className="hidden xl:table-cell">
                  <span className="block truncate" title={c.solicitante}>
                    {c.solicitante}
                  </span>
                </Td>
                <Td className="hidden xl:table-cell">
                  <span className="block truncate" title={c.categoria}>
                    {c.categoria}
                  </span>
                </Td>
                <Td className="hidden lg:table-cell">
                  <Etiqueta classeCor={corPorPrioridade(c.prioridade)}>
                    {c.prioridade}
                  </Etiqueta>
                </Td>
                <Td>
                  <Etiqueta classeCor={corPorStatus(c.status)}>
                    {c.status}
                  </Etiqueta>
                </Td>
                <Td className="hidden truncate text-xs text-tintaFraca xl:table-cell">
                  {c.criadoEmFormatado}
                </Td>
                <Td>
                  <EtiquetaPrazo prazoEm={c.prazoEm} status={c.status} />
                </Td>
                <Td className="text-right">
                  <button
                    onClick={() => aoSelecionar?.(c.id)}
                    className="whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-marca-forte transition-colors hover:bg-marca-fraca focus-visible:outline focus-visible:outline-2 focus-visible:outline-marca"
                  >
                    Detalhes
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
- Subcomponente local que padroniza o estilo das células de
- cabeçalho e inclui o puxador arrastável na borda direita.
 */
function Th({
  children,
  className = "",
  largura,
  aoRedimensionar,
}: {
  children: React.ReactNode;
  className?: string;
  largura?: number;
  aoRedimensionar?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}) {
  return (
    <th
      style={largura ? { width: `${largura}px` } : undefined}
      className={[
        "relative select-none whitespace-nowrap py-3 text-left text-[11px] font-semibold uppercase tracking-wide",
        "px-2 sm:px-4",
        className,
      ].join(" ")}
    >
      {children}
      {aoRedimensionar && (
        <span
          role="separator"
          aria-orientation="vertical"
          title="Arraste para ajustar a largura da coluna"
          onMouseDown={aoRedimensionar}
          className="absolute bottom-1 right-0 top-1 w-1.5 cursor-col-resize rounded transition-colors hover:bg-marca/60 active:bg-marca"
        />
      )}
    </th>
  );
}

/**
- Subcomponente local que padroniza o estilo das células do
- corpo da tabela. Mantém o mesmo espaçamento horizontal do Th
- para que as colunas fiquem alinhadas.
 */
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-2 py-3 sm:px-4", className].join(" ")}>
      {children}
    </td>
  );
}
