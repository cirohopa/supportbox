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
import { PainelAgente } from "@/views/agente/PainelAgente";
import type {
  ChamadoDetalhado,
  ChamadoResumo,
} from "@/views/compartilhado/tipos-view";
import { lerSessao, type Sessao } from "@/lib/sessao";
import {
  adicionarComentario,
  assumirChamado,
  concluirChamado,
  detalharChamado,
  listarChamados,
  listarComentarios,
} from "@/lib/api";
import { paraDetalhado, paraResumo } from "@/lib/mapeamento";

export default function PaginaAgente() {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [chamados, setChamados] = useState<ChamadoResumo[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  /** Busca a lista completa de chamados e atualiza a tela. */
  const carregarChamados = useCallback(async (s: Sessao) => {
    try {
      const { itens } = await listarChamados(s);
      setChamados(itens.map(paraResumo));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar os chamados.");
    }
  }, []);

  // Ao montar: confere a sessão (senão redireciona) e carrega os dados.
  useEffect(() => {
    const s = lerSessao();
    if (!s) {
      router.replace("/login");
      return;
    }
    setSessao(s);
    void carregarChamados(s);
  }, [router, carregarChamados]);

  if (!sessao) return null;

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
        <div className="bg-red-100 text-red-800 text-sm px-4 py-2 text-center">
          {erro} Verifique se o backend está rodando em
          http://localhost:4000.
        </div>
      )}
      <PainelAgente
        chamados={chamados}
        obterDetalhes={obterDetalhes}
        aoAssumir={aoAssumir}
        aoConcluir={aoConcluir}
        aoComentar={aoComentar}
      />
    </>
  );
}
