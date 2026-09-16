// Descobre QUEM esta fazendo a requisicao, lendo dois cabecalhos HTTP.
//
// SOLUCAO TEMPORARIA: nao existe autenticacao de verdade ainda. O cliente
// diz quem e, e o servidor acredita. Quando entrar login com token, so este
// arquivo muda - os Controllers continuam iguais.

import type { IncomingMessage } from "http";
import type { Ator } from "../dominio";

// Devolve `null` quando nao da para identificar - ai o Controller responde 401.
export function extrairAtor(req: IncomingMessage): Ator | null {
  const id = req.headers["x-usuario-id"];
  const papel = req.headers["x-usuario-papel"];

  if (typeof id !== "string" || id.trim() === "") return null;
  if (papel !== "solicitante" && papel !== "agente") return null;

  return { id: id.trim(), papel };
}
