/**
 * Cliente HTTP do backend SupportBox.
 *
 * Concentra TODA a conversa com a API: a URL base, os cabecalhos de
 * identificacao (`X-Usuario-*`) e a leitura da resposta. As telas nunca
 * chamam `fetch` direto - elas usam as funcoes daqui.
 *
 * Identidade: como ainda nao ha login de verdade, cada funcao recebe a
 * `Sessao` (quem esta agindo) e a envia nos cabecalhos. Quando a auth real
 * chegar, basta trocar esses cabecalhos por um token, so aqui dentro.
 */
import type { Sessao } from "./sessao";

/**
 * Endereco do backend. Vem de `NEXT_PUBLIC_API_URL` (definido em
 * `.env.local`); o padrao e o backend local em desenvolvimento.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Formato de um chamado como o BACKEND devolve (valores em minusculo,
 * datas em texto ISO, pessoas por id). As telas usam um formato diferente
 * (rotulos bonitos, datas formatadas) - a traducao fica em `mapeamento.ts`.
 */
export interface ChamadoApi {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  status: "aberto" | "em_andamento" | "concluido";
  prioridade: "baixa" | "media" | "alta";
  solicitanteId: string;
  agenteId: string | null;
  criadoEm: string;
  concluidoEm: string | null;
}

/** Formato de um comentario como o backend devolve. */
export interface ComentarioApi {
  id: string;
  chamadoId: string;
  autor: string;
  texto: string;
  criadoEm: string;
}

/** Dados enviados para abrir um chamado novo. */
export interface NovoChamadoApi {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  /** Prioridade sugerida pela triagem por IA. Opcional. */
  prioridade?: string;
}

/** Um passo que a IA sugere ao solicitante tentar sozinho. */
export interface PassoApi {
  titulo: string;
  detalhe: string;
}

/** O que a triagem por IA devolve. */
export interface TriagemApi {
  /** `false` quando a IA nao respondeu (fora do ar, demorou demais). */
  disponivel: boolean;
  passos: PassoApi[];
  prioridade: "baixa" | "media" | "alta";
}

/**
 * Faz uma requisicao a API e devolve o JSON ja parseado. Se a resposta
 * vier com erro (status >= 400), lanca um `Error` com a mensagem que o
 * backend mandou, para a tela conseguir mostrar algo util ao usuario.
 *
 * @param metodo verbo HTTP (GET, POST, PATCH...)
 * @param caminho caminho da rota (ex.: "/api/chamados")
 * @param sessao quem esta fazendo a chamada (vira os cabecalhos de ator)
 * @param corpo objeto a enviar como JSON no corpo (opcional)
 */
async function requisitar<T>(
  metodo: string,
  caminho: string,
  sessao: Sessao,
  corpo?: unknown,
): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      "X-Usuario-Id": sessao.id,
      "X-Usuario-Papel": sessao.papel,
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  // Le o corpo como texto primeiro: assim lidamos com respostas sem corpo
  // (ex.: 204) sem o `JSON.parse` quebrar.
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    const mensagem =
      dados && typeof dados.erro === "string"
        ? dados.erro
        : `Erro ${resposta.status}`;
    throw new Error(mensagem);
  }

  return dados as T;
}

// --- Chamados ---------------------------------------------------------

/** Lista os chamados visiveis para o usuario (o backend filtra por papel). */
export function listarChamados(sessao: Sessao): Promise<{ itens: ChamadoApi[] }> {
  return requisitar("GET", "/api/chamados", sessao);
}

/** Busca um chamado pelo id. */
export function detalharChamado(
  sessao: Sessao,
  idChamado: string,
): Promise<ChamadoApi> {
  return requisitar("GET", `/api/chamados/${idChamado}`, sessao);
}

/** Abre um chamado novo. */
export function abrirChamado(
  sessao: Sessao,
  dados: NovoChamadoApi,
): Promise<ChamadoApi> {
  return requisitar("POST", "/api/chamados", sessao, dados);
}

/** Agente assume o chamado para si. */
export function assumirChamado(
  sessao: Sessao,
  idChamado: string,
): Promise<ChamadoApi> {
  return requisitar("POST", `/api/chamados/${idChamado}/assumir`, sessao);
}

/** Agente atribuido conclui o chamado. */
export function concluirChamado(
  sessao: Sessao,
  idChamado: string,
): Promise<ChamadoApi> {
  return requisitar("POST", `/api/chamados/${idChamado}/concluir`, sessao);
}

// --- Triagem por IA ---------------------------------------------------

/** Manda o rascunho para a IA analisar, ANTES de abrir o chamado. */
export function analisarChamado(
  sessao: Sessao,
  dados: NovoChamadoApi,
): Promise<TriagemApi> {
  return requisitar("POST", "/api/triagem", sessao, dados);
}

// --- Comentarios ------------------------------------------------------

/** Lista os comentarios de um chamado (ordem cronologica). */
export function listarComentarios(
  sessao: Sessao,
  idChamado: string,
): Promise<{ itens: ComentarioApi[] }> {
  return requisitar("GET", `/api/chamados/${idChamado}/comentarios`, sessao);
}

/** Adiciona um comentario a um chamado. */
export function adicionarComentario(
  sessao: Sessao,
  idChamado: string,
  texto: string,
): Promise<ComentarioApi> {
  return requisitar(
    "POST",
    `/api/chamados/${idChamado}/comentarios`,
    sessao,
    { texto },
  );
}
