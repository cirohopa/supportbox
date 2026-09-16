/**
 * Painel principal do solicitante.
 *
 * Compõe a tela do portal: cabeçalho no topo, formulário para abrir um
 * chamado, lista dos chamados do usuário entrado e a janela de detalhes
 * em modo somente leitura. O componente organiza os filhos; a lógica
 * visual fica neles.
 *
 * Estado guardado aqui: qual chamado está aberto na janela de detalhes
 * (`idSelecionado`) e os detalhes carregados desse chamado (`detalhes`).
 * Como agora os detalhes vêm do backend, eles são buscados de forma
 * ASSÍNCRONA: um `useEffect` carrega quando a seleção muda, e cada ação
 * (por enquanto, comentar) recarrega para a janela refletir a mudança.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Cabecalho } from "@/views/compartilhado/Cabecalho";
import { ModalDetalhesChamado } from "@/views/compartilhado/ModalDetalhesChamado";
import type {
  ChamadoDetalhado,
  ChamadoResumo,
} from "@/views/compartilhado/tipos-view";
import { FormularioAberturaChamado, type DadosNovoChamado } from "./FormularioAberturaChamado";
import type { TriagemApi } from "@/lib/api";
import { ListaMeusChamados } from "./ListaMeusChamados";

interface PropsPainelSolicitante {
  /** Nome exibido no cabeçalho ao lado do botão Sair. */
  nomeUsuario: string;
  /** Lista resumida usada para alimentar a seção Meus Chamados. */
  chamados: ChamadoResumo[];
  /**
   * Busca a versão completa de um chamado a partir do id. Agora é
   * assíncrona, porque vai ao backend buscar o chamado e seus
   * comentários. Devolve `null` se não der para carregar.
   */
  obterDetalhes: (idChamado: string) => Promise<ChamadoDetalhado | null>;
  /** Função chamada quando o usuário aperta Sair no cabeçalho. */
  aoSairClicado?: () => void;
  /** Função chamada quando o formulário de abertura é enviado. */
  aoCriarChamado?: (dados: DadosNovoChamado) => void | Promise<void>;
  /** Função chamada quando o usuário envia um comentário. */
  aoComentar?: (idChamado: string, texto: string) => void | Promise<void>;
  /** Função chamada quando o usuário pede a análise da IA. */
  aoAnalisar?: (dados: DadosNovoChamado) => Promise<TriagemApi | null>;
}

export function PainelSolicitante({
  nomeUsuario,
  chamados,
  obterDetalhes,
  aoSairClicado,
  aoCriarChamado,
  aoComentar,
  aoAnalisar,
}: PropsPainelSolicitante) {
  // Id do chamado aberto na janela. Quando vale null, a janela está fechada.
  const [idSelecionado, setIdSelecionado] = useState<string | null>(null);
  // Detalhes (já carregados) do chamado aberto.
  const [detalhes, setDetalhes] = useState<ChamadoDetalhado | null>(null);

  /** Recarrega os detalhes do chamado aberto (após uma ação, por ex.). */
  const recarregarDetalhes = useCallback(async () => {
    if (idSelecionado === null) return;
    setDetalhes(await obterDetalhes(idSelecionado));
  }, [idSelecionado, obterDetalhes]);

  // Carrega os detalhes sempre que a seleção muda. O sinalizador `ativo`
  // evita atualizar o estado se a seleção mudar antes da busca terminar.
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

  /** Envia o comentário e recarrega os detalhes para ele aparecer. */
  const comentarERecarregar = async (texto: string) => {
    if (idSelecionado === null) return;
    await aoComentar?.(idSelecionado, texto);
    await recarregarDetalhes();
  };

  return (
    <>
      <Cabecalho
        nomeUsuario={nomeUsuario}
        subtitulo="Portal do Solicitante"
        aoSairClicado={aoSairClicado}
      />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Formulário para abrir um novo chamado, em destaque no topo. */}
        <section>
          <FormularioAberturaChamado
            aoEnviar={aoCriarChamado}
            aoAnalisar={aoAnalisar}
          />
        </section>

        {/* Lista dos chamados que esse usuário já abriu. */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-tinta">Meus Chamados</h2>
          <ListaMeusChamados
            chamados={chamados}
            aoSelecionar={(id) => setIdSelecionado(id)}
          />
        </section>
      </main>

      {/*
        Janela de detalhes em modo somente leitura. O solicitante pode
        comentar, mas não pode assumir nem concluir o chamado.
      */}
      <ModalDetalhesChamado
        chamado={detalhes}
        aberto={idSelecionado !== null}
        aoFechar={() => setIdSelecionado(null)}
        modoAgente={false}
        aoEnviarComentario={comentarERecarregar}
      />
    </>
  );
}
