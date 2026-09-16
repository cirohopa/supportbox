/**
 * Painel principal do agente.
 *
 * Reúne a barra de filtros, a tabela de chamados e a janela de detalhes
 * em modo agente. Aplica em memória os filtros locais (busca por palavra
 * e aba de situação) sobre a lista de chamados que recebe.
 *
 * Os filtros são puramente visuais (não alteram dados). Os detalhes do
 * chamado aberto, porém, vêm do backend de forma ASSÍNCRONA: carregam
 * quando a seleção muda e recarregam após cada ação (assumir, concluir,
 * comentar), para a janela refletir o novo estado.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChamadoDetalhado,
  ChamadoResumo,
} from "@/views/compartilhado/tipos-view";
import { ModalDetalhesChamado } from "@/views/compartilhado/ModalDetalhesChamado";
import { BarraFiltros, type AbaStatus } from "./BarraFiltros";
import { TabelaChamados } from "./TabelaChamados";

interface PropsPainelAgente {
  /** Lista completa de chamados que aparece no painel. */
  chamados: ChamadoResumo[];
  /**
   * Busca a versão completa de um chamado a partir do id (chamado +
   * comentários, vindos do backend). Devolve `null` se não carregar.
   */
  obterDetalhes: (idChamado: string) => Promise<ChamadoDetalhado | null>;
  /** Função chamada quando o agente aperta Assumir na janela. */
  aoAssumir?: (idChamado: string) => void | Promise<void>;
  /** Função chamada quando o agente aperta Concluir na janela. */
  aoConcluir?: (idChamado: string) => void | Promise<void>;
  /** Função chamada quando o agente envia um comentário. */
  aoComentar?: (idChamado: string, texto: string) => void | Promise<void>;
}

export function PainelAgente({
  chamados,
  obterDetalhes,
  aoAssumir,
  aoConcluir,
  aoComentar,
}: PropsPainelAgente) {
  // Filtros aplicados pelo agente (puramente visuais).
  const [termoBusca, setTermoBusca] = useState("");
  const [abaStatus, setAbaStatus] = useState<AbaStatus>("todos");

  // Janela de detalhes: id selecionado e os detalhes já carregados.
  const [idSelecionado, setIdSelecionado] = useState<string | null>(null);
  const [detalhes, setDetalhes] = useState<ChamadoDetalhado | null>(null);

  /*
    O useMemo evita refiltrar a cada redesenho quando nada relevante
    mudou. O filtro combina a aba de situação com a busca por palavra em
    título, protocolo e solicitante.
  */
  const chamadosFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    return chamados.filter((c) => {
      const correspondeStatus = abaStatus === "todos" || c.status === abaStatus;
      const correspondeBusca =
        termo === "" ||
        [c.titulo, c.protocolo, c.solicitante].some((t) =>
          t.toLowerCase().includes(termo),
        );
      return correspondeStatus && correspondeBusca;
    });
  }, [chamados, abaStatus, termoBusca]);

  /** Recarrega os detalhes do chamado aberto (após uma ação). */
  const recarregarDetalhes = useCallback(async () => {
    if (idSelecionado === null) return;
    setDetalhes(await obterDetalhes(idSelecionado));
  }, [idSelecionado, obterDetalhes]);

  // Carrega os detalhes sempre que a seleção muda.
  useEffect(() => {
    if (idSelecionado === null) {
      setDetalhes(null);
      return;
    }
    let ativo = true;
    obterDetalhes(idSelecionado).then((d) => {
      if (ativo) setDetalhes(d);
    });
    return () => {
      ativo = false;
    };
  }, [idSelecionado, obterDetalhes]);

  // Cada ação chama o backend (via prop) e depois recarrega os detalhes,
  // para a janela mostrar o novo estado sem precisar reabrir.
  const assumirERecarregar = async () => {
    if (idSelecionado === null) return;
    await aoAssumir?.(idSelecionado);
    await recarregarDetalhes();
  };
  const concluirERecarregar = async () => {
    if (idSelecionado === null) return;
    await aoConcluir?.(idSelecionado);
    await recarregarDetalhes();
  };
  const comentarERecarregar = async (texto: string) => {
    if (idSelecionado === null) return;
    await aoComentar?.(idSelecionado, texto);
    await recarregarDetalhes();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-tinta">
          Tickets Registrados
        </h1>
        <p className="text-sm text-tintaFraca">
          Visão geral dos chamados do sistema.
        </p>
      </div>

      <BarraFiltros
        termoBusca={termoBusca}
        abaAtiva={abaStatus}
        aoMudarBusca={setTermoBusca}
        aoMudarAba={setAbaStatus}
      />

      <TabelaChamados
        chamados={chamadosFiltrados}
        aoSelecionar={(id) => setIdSelecionado(id)}
      />

      <ModalDetalhesChamado
        chamado={detalhes}
        aberto={idSelecionado !== null}
        aoFechar={() => setIdSelecionado(null)}
        modoAgente
        aoAssumir={assumirERecarregar}
        aoConcluir={concluirERecarregar}
        aoEnviarComentario={comentarERecarregar}
      />
    </div>
  );
}
