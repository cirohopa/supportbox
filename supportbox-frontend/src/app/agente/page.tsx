/**
 * Página /agente.
 *
 * Casca da rota: confere a sessão (senão volta para /login), busca todos
 * os chamados no backend (o backend libera a visão completa para o agente)
 * e entrega ao PainelAgente, junto com as ações reais (assumir, concluir,
 * comentar, ver detalhes). O PainelAgente não mudou de forma.
 *
 * Marcado como "use client" porque depende de `localStorage` (sessão) e de
 * efeitos no navegador para buscar os dados.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { PainelAgente } from "@/views/agente/PainelAgente";
import type {
  ChamadoDetalhado,
  ChamadoResumo,
  PrioridadeChamado,
} from "@/views/compartilhado/tipos-view";
import { lerSessao, type Sessao } from "@/lib/sessao";
import {
  adicionarComentario,
  alterarPrioridade,
  assumirChamado,
  concluirChamado,
  detalharChamado,
  listarChamados,
  listarComentarios,
} from "@/lib/api";
import { paraDetalhado, paraPrioridadeApi, paraResumo } from "@/lib/mapeamento";

export default function PaginaAgente() {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [chamados, setChamados] = useState<ChamadoResumo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  /** Busca a lista completa de chamados e atualiza a tela. */
  const carregarChamados = useCallback(async (s: Sessao) => {
    setCarregando(true);
    try {
      const { itens } = await listarChamados(s);
      setChamados(itens.map(paraResumo));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar os chamados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  // Ao montar: confere a sessão (senão redireciona) e carrega os dados.
  useEffect(() => {
    const s = lerSessao();
    if (!s) {
      router.replace("/login?expirou=1");
      return;
    }
    setSessao(s);
    void carregarChamados(s);
  }, [router, carregarChamados]);

  if (!sessao) {
    return (
      <main
        role="status"
        aria-label="Carregando painel"
        className="space-y-6 p-4 sm:p-6 lg:p-8"
      >
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 w-full animate-pulse rounded-xl border border-linha bg-papel" />
      </main>
    );
  }

  /** Busca um chamado completo (chamado + comentários) para a janela. */
  const obterDetalhes = async (
    id: string,
  ): Promise<ChamadoDetalhado | null> => {
    try {
      const [chamado, comentarios] = await Promise.all([
        detalharChamado(sessao, id),
        listarComentarios(sessao, id),
      ]);
      return paraDetalhado(chamado, comentarios.itens);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao carregar os detalhes.");
      return null;
    }
  };

  /** Assume o chamado e recarrega a lista. */
  const aoAssumir = async (id: string) => {
    try {
      await assumirChamado(sessao, id);
      await carregarChamados(sessao);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao assumir o chamado.");
    }
  };

  /** Conclui o chamado e recarrega a lista. */
  const aoConcluir = async (id: string) => {
    try {
      await concluirChamado(sessao, id);
      await carregarChamados(sessao);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao concluir o chamado.");
    }
  };

  /**
   * Troca a prioridade do chamado e recarrega a lista.
   * A tela entrega o rótulo ("Alta"); aqui ele vira o valor do backend
   * ("alta") antes de ir para a API.
   */
  const aoAlterarPrioridade = async (
    id: string,
    prioridade: PrioridadeChamado,
  ) => {
    try {
      await alterarPrioridade(sessao, id, paraPrioridadeApi(prioridade));
      await carregarChamados(sessao);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao alterar a prioridade.");
    }
  };

  /** Envia um comentário e recarrega a lista. */
  const aoComentar = async (idChamado: string, texto: string) => {
    try {
      await adicionarComentario(sessao, idChamado, texto);
      await carregarChamados(sessao);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao enviar o comentário.");
    }
  };

  return (
    <>
      {erro && (
        <div
          role="alert"
          className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-6 lg:mx-8"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <p>
            {erro} Verifique se o backend está rodando em
            http://localhost:4000.
          </p>
        </div>
      )}
      <PainelAgente
        chamados={chamados}
        carregando={carregando}
        obterDetalhes={obterDetalhes}
        aoAssumir={aoAssumir}
        aoConcluir={aoConcluir}
        aoAlterarPrioridade={aoAlterarPrioridade}
        aoComentar={aoComentar}
      />
    </>
  );
}
