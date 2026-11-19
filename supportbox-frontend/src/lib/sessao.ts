/**
 * Sessao autenticada do usuario, guardada no navegador.
 */

/** Papel do usuario (decide o que ele pode fazer). */
export type PapelUsuario = "solicitante" | "agente";

export interface Sessao {
  /** E-mail usado como identificador do usuario. */
  id: string;
  /** Nome exibido na tela. */
  nome: string;
  /** Papel do usuario. */
  papel: PapelUsuario;
  /** Token enviado ao backend nas requisicoes autenticadas. */
  token: string;
}

/** Chave usada no localStorage. */
const CHAVE = "supportbox.sessao";

/** Guarda a sessao autenticada no navegador. */
export function salvarSessao(sessao: Sessao): void {
  localStorage.setItem(CHAVE, JSON.stringify(sessao));
}

/**
 * Le a sessao guardada. Dados antigos ou invalidos nao contam como sessao.
 */
export function lerSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  const bruto = window.localStorage.getItem(CHAVE);
  if (!bruto) return null;
  try {
    const valor: unknown = JSON.parse(bruto);
    if (
      typeof valor !== "object" ||
      valor === null ||
      !("id" in valor) ||
      typeof valor.id !== "string" ||
      !("nome" in valor) ||
      typeof valor.nome !== "string" ||
      !("papel" in valor) ||
      (valor.papel !== "agente" && valor.papel !== "solicitante") ||
      !("token" in valor) ||
      typeof valor.token !== "string" ||
      valor.token.length === 0
    ) {
      limparSessao();
      return null;
    }
    return valor as Sessao;
  } catch {
    limparSessao();
    return null;
  }
}

/** Apaga a sessao (usado no botao "Sair"). */
export function limparSessao(): void {
  localStorage.removeItem(CHAVE);
}
