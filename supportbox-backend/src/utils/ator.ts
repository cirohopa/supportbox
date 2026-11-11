// Descobre QUEM esta fazendo a requisicao, lendo o token de sessao enviado
// no cabecalho Authorization: "Bearer <token>".
//
// E o unico arquivo da camada HTTP que sabe como a identidade chega. Os
// Controllers so perguntam "quem e?" e recebem um Ator ou null.

import type { IncomingMessage } from "http";
import type { Ator } from "../dominio";
import { lerToken } from "./token";

const PREFIXO = "Bearer ";

// Devolve `null` quando nao da para identificar - ai o Controller responde 401.
export function extrairAtor(req: IncomingMessage): Ator | null {
  const cabecalho = req.headers.authorization;
  if (typeof cabecalho !== "string" || !cabecalho.startsWith(PREFIXO)) {
    return null;
  }
  return lerToken(cabecalho.slice(PREFIXO.length).trim());
}
