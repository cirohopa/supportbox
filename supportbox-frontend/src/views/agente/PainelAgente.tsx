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
  PrioridadeChamado,
} from "@/views/compartilhado/tipos-view";
import { ModalDetalhesChamado } from "@/views/compartilhado/ModalDetalhesChamado";
import { BarraFiltros, type AbaStatus } from "./BarraFiltros";
import { TabelaChamados } from "./TabelaChamados";

interface PropsPainelAgente {
  /** Lista completa de chamados que aparece no painel. */
  chamados: ChamadoResumo[];
  /** Exibe o esqueleto enquanto a lista está sendo carregada. */
  carregando?: boolean;
  /**
   * Busca a versão completa de um chamado a partir do id (chamado +
   * comentários, vindos do backend). Devolve `null` se não carregar.
   */
  obterDetalhes: (idChamado: string) => Promise<ChamadoDetalhado | null>;
  /** Função chamada quando o agente aperta Assumir na janela. */
  aoAssumir?: (idChamado: string) => void | Promise<void>;
  /** Função chamada quando o agente aperta Concluir na janela. */
  aoConcluir?: (idChamado: string) => void | Promise<void>;
  /** Função chamada quando o agente troca a prioridade na janela. */
  aoAlterarPrioridade?: (
    idChamado: string,
    prioridade: PrioridadeChamado,
  ) => void | Promise<void>;
  /** Função chamada quando o agente envia um comentário. */
  aoComentar?: (idChamado: string, texto: string) => void | Promise<void>;
}

export function PainelAgente({
  chamados,
  carregando = false,
  obterDetalhes,
  aoAssumir,
  aoConcluir,
  aoAlterarPrioridade,
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
  const alterarPrioridadeERecarregar = async (prioridade: PrioridadeChamado) => {
    if (idSelecionado === null) return;
    await aoAlterarPrioridade?.(idSelecionado, prioridade);
    await recarregarDetalhes();
  };
  const comentarERecarregar = async (texto: string) => {
    if (idSelecionado === null) return;
    await aoComentar?.(idSelecionado, texto);
    await recarregarDetalhes();
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-medium text-marca-forte">Atendimento</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-tinta">
          Tickets
        </h1>
        <p className="mt-1 text-sm text-tintaFraca">
          Acompanhe e organize os chamados da sua equipe.
        </p>
      </header>

      <section aria-label="Busca e filtros" className="space-y-4">
        <BarraFiltros
          termoBusca={termoBusca}
          abaAtiva={abaStatus}
          aoMudarBusca={setTermoBusca}
          aoMudarAba={setAbaStatus}
        />
      </section>

      <section aria-label="Lista de chamados">
        <TabelaChamados
          chamados={chamadosFiltrados}
          carregando={carregando}
          aoSelecionar={(id) => setIdSelecionado(id)}
        />
      </section>

      <ModalDetalhesChamado
        chamado={detalhes}
        aberto={idSelecionado !== null}
        aoFechar={() => setIdSelecionado(null)}
        modoAgente
        aoAssumir={assumirERecarregar}
        aoConcluir={concluirERecarregar}
        aoAlterarPrioridade={alterarPrioridadeERecarregar}
        aoEnviarComentario={comentarERecarregar}
      />
    </div>
  );
}
