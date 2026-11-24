/**
 * Página /solicitante.
 *
 * Casca da rota: confere a sessão (senão volta para /login), busca os
 * chamados do solicitante no backend e entrega tudo ao PainelSolicitante,
 * junto com as ações reais (abrir chamado, comentar, ver detalhes). O
 * PainelSolicitante em si não mudou de forma; só a origem dos dados.
 *
 * Marcado como "use client" porque depende de `localStorage` (sessão) e de
 * efeitos no navegador para buscar os dados.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PainelSolicitante } from "@/views/solicitante/PainelSolicitante";
import type { DadosNovoChamado } from "@/views/solicitante/FormularioAberturaChamado";
import type {
  ChamadoDetalhado,
  ChamadoResumo,
} from "@/views/compartilhado/tipos-view";
import { lerSessao, limparSessao, type Sessao } from "@/lib/sessao";
import {
  abrirChamado,
  adicionarComentario,
  analisarChamado,
  detalharChamado,
  ErroApi,
  listarChamados,
  listarComentarios,
  sair as sairApi,
  type TriagemApi,
} from "@/lib/api";
import { paraDetalhado, paraResumo } from "@/lib/mapeamento";

export default function PaginaSolicitante() {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [chamados, setChamados] = useState<ChamadoResumo[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  /** Busca a lista de chamados do solicitante e atualiza a tela. */
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
      router.replace("/login?expirou=1");
      return;
    }
    setSessao(s);
    void carregarChamados(s);
  }, [router, carregarChamados]);

  // Enquanto confere a sessão (ou redireciona), não desenha nada.
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

  /** Abre um chamado novo e recarrega a lista. */
  const aoCriarChamado = async (dados: DadosNovoChamado) => {
    try {
      await abrirChamado(sessao, dados);
      await carregarChamados(sessao);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao abrir o chamado.");
    }
  };

  /** Pede a análise da IA para o rascunho que está no formulário. */
  const aoAnalisar = async (
    dados: DadosNovoChamado,
  ): Promise<TriagemApi | null> => {
    try {
      return await analisarChamado(sessao, dados);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha ao analisar o chamado.");
      return null;
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

  /** Notifica o backend, apaga a sessão e volta para a entrada. */
  const sair = async () => {
    let expirou = false;
    try {
      await sairApi(sessao);
    } catch (e) {
      expirou = e instanceof ErroApi && e.status === 401;
      if (!expirou) {
        alert(e instanceof Error ? e.message : "Não foi possível sair.");
      }
    } finally {
      limparSessao();
    }
    if (!expirou) router.replace("/login");
  };

  return (
    <>
      {erro && (
        <div className="bg-red-100 text-red-800 text-sm px-4 py-2 text-center">
          {erro} Verifique se o backend está rodando em
          http://localhost:4000.
        </div>
      )}
      <PainelSolicitante
        nomeUsuario={sessao.nome}
        chamados={chamados}
        obterDetalhes={obterDetalhes}
        aoSairClicado={sair}
        aoCriarChamado={aoCriarChamado}
        aoComentar={aoComentar}
        aoAnalisar={aoAnalisar}
      />
    </>
  );
}
