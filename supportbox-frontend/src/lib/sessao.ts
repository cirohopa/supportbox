/**
 * Sessao do usuario (identidade temporaria, sem login de verdade).
 *
 * Como o backend ainda nao tem autenticacao, "quem esta usando o sistema"
 * fica guardado aqui no navegador (localStorage) depois da tela de entrada.
 * Esses dados viram os cabecalhos `X-Usuario-Id` e `X-Usuario-Papel` em
 * toda chamada a API (veja `lib/api.ts`).
 *
 * Quando a autenticacao real chegar, este arquivo passa a guardar o token /
 * usuario autenticado, e o resto do front quase nao muda.
 */

/** Papel do usuario (decide o que ele pode fazer). */
export type PapelUsuario = "solicitante" | "agente";

export interface Sessao {
  /** Identidade enviada ao backend como `X-Usuario-Id` (hoje, o e-mail). */
  id: string;
  /** Nome exibido na tela (hoje igual ao id, pois nao ha cadastro). */
  nome: string;
  /** Papel do usuario. */
  papel: PapelUsuario;
}

/** Chave usada no localStorage. */
const CHAVE = "supportbox.sessao";

/** Guarda a sessao no navegador (chamado apos a "entrada"). */
export function salvarSessao(sessao: Sessao): void {
  localStorage.setItem(CHAVE, JSON.stringify(sessao));
}

/**
 * Le a sessao guardada. Devolve `null` se nao houver ninguem "entrado" -
 * ou se rodar no servidor, onde `localStorage` nao existe (por isso o
 * guarda de `typeof window`).
 */
export function lerSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  const bruto = window.localStorage.getItem(CHAVE);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Sessao;
  } catch {
    return null;
  }
}

/** Apaga a sessao (usado no botao "Sair"). */
export function limparSessao(): void {
  localStorage.removeItem(CHAVE);
}
