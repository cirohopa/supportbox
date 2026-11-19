/**
 * Cliente HTTP do backend SupportBox.
 *
 * Concentra toda a conversa com a API, incluindo autenticacao por token.
 */
import { limparSessao, type PapelUsuario, type Sessao } from "./sessao";

/**
 * Endereco do backend. Vem de `NEXT_PUBLIC_API_URL` (definido em
 * `.env.local`); o padrao e o backend local em desenvolvimento.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  const texto = await resposta.text();
  let dados: unknown = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      throw new Error("Resposta inválida do servidor.");
    }
  }

  if (!resposta.ok) {
    const mensagem =
      typeof dados === "object" &&
      dados !== null &&
      "erro" in dados &&
      typeof dados.erro === "string"
        ? dados.erro
        : `Erro ${resposta.status}`;
    throw new ErroApi(resposta.status, mensagem);
  }

  return dados as T;
}

function tratarSessaoExpirada(): void {
  limparSessao();
  if (typeof window !== "undefined") {
    window.location.assign("/login?expirou=1");
  }
}

/** Autentica o usuario e monta a sessao usada pelo restante do frontend. */
export async function entrar(email: string, senha: string): Promise<Sessao> {
  const resposta = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const dados = await lerResposta<{
    token: string;
    usuario: { email: string; nome: string; papel: PapelUsuario };
  }>(resposta);

  if (
    !dados ||
    typeof dados.token !== "string" ||
    !dados.token ||
    !dados.usuario ||
    typeof dados.usuario.email !== "string" ||
    typeof dados.usuario.nome !== "string" ||
    (dados.usuario.papel !== "agente" &&
      dados.usuario.papel !== "solicitante")
  ) {
    throw new Error("Resposta de login inválida.");
  }

  return {
    id: dados.usuario.email,
    nome: dados.usuario.nome,
    papel: dados.usuario.papel,
    token: dados.token,
  };
}

/** Notifica o backend da saída; a sessao é apagada pela tela que chamou. */
export async function sair(sessao: Sessao): Promise<void> {
  await requisitar<void>("POST", "/api/auth/logout", sessao);
}

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
  prazoEm: string | null;
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

/** Quanto um atendente concluiu no periodo do relatorio. */
export interface AtendimentoApi {
  agenteId: string;
  concluidos: number;
  tempoMedioHoras: number;
}

/** Quanto uma categoria somou no periodo do relatorio. */
export interface CategoriaApi {
  categoria: string;
  total: number;
}

/** O que o backend devolve para o relatorio de um periodo. */
export interface RelatorioApi {
  totalCriados: number;
  totalConcluidos: number;
  tempoMedioHoras: number;
  porAtendente: AtendimentoApi[];
  porCategoria: CategoriaApi[];
}

/**
 * Faz uma requisicao a API e devolve o JSON ja parseado. Se a resposta
 * vier com erro (status >= 400), lanca um `Error` com a mensagem que o
 * backend mandou, para a tela conseguir mostrar algo util ao usuario.
 *
 * @param metodo verbo HTTP (GET, POST, PATCH...)
 * @param caminho caminho da rota (ex.: "/api/chamados")
 * @param sessao quem esta fazendo a chamada (token Bearer de autenticacao)
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
      Authorization: `Bearer ${sessao.token}`,
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  if (resposta.status === 401) {
    tratarSessaoExpirada();
  }

  return lerResposta<T>(resposta);
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

// --- Relatorios ---------------------------------------------------------

/** Busca o relatorio de atendimento de um periodo (datas no formato AAAA-MM-DD). */
export function obterRelatorio(
  sessao: Sessao,
  de: string,
  ate: string,
): Promise<RelatorioApi> {
  return requisitar("GET", `/api/relatorios?de=${de}&ate=${ate}`, sessao);
}
