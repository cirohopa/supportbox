// Utilitarios HTTP: os tipos compartilhados entre o dispatcher e os
// Controllers, e as duas funcoes que escrevem a resposta.

import type { IncomingMessage, ServerResponse } from "http";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";

// O que o dispatcher (app.ts) extrai da URL e entrega ao Controller.
//   parametros: os `:id` da rota      -> /api/chamados/42  vira { id: "42" }
//   busca:      a query string        -> ?status=aberto    vira { status: "aberto" }
export type Contexto = {
  parametros: Record<string, string>;
  busca: Record<string, string>;
};

// A forma que todo metodo de Controller precisa ter.
export type Manipulador = (
  req: IncomingMessage,
  res: ServerResponse,
  ctx: Contexto,
) => Promise<void> | void;

// Escreve a resposta em JSON e ENCERRA a conexao. Chamar duas vezes na mesma
// resposta da erro ("write after end").
export function responder(
  res: ServerResponse,
  status: number,
  corpo: unknown,
): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(corpo));
}

// Traduz os erros de dominio (erros.ts) no status HTTP correspondente.
// E o que permite cada Controller ter um `catch` de uma linha so.
export function responderErro(res: ServerResponse, erro: unknown): void {
  if (erro instanceof ErroValidacao) {
    return responder(res, 400, { erro: erro.message });
  }
  if (erro instanceof ErroAcessoNegado) {
    return responder(res, 403, { erro: erro.message });
  }
  if (erro instanceof ErroNaoEncontrado) {
    return responder(res, 404, { erro: erro.message });
  }

  // Erro nao previsto: loga no servidor e devolve mensagem generica, sem
  // vazar detalhes internos para quem chamou.
  console.error("Erro inesperado:", erro);
  return responder(res, 500, { erro: "Erro interno do servidor." });
}
