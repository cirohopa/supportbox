// Controller de autenticacao - RESERVA DE LUGAR.
//
// Os tres endpoints existem para marcar onde o login vai entrar, mas ainda
// respondem 501: nao existe AuthService nem tabela de usuarios. Enquanto
// isso, a identidade vem dos cabecalhos X-Usuario-* (ver utils/ator.ts).

import type { IncomingMessage, ServerResponse } from "http";
import { responder } from "../utils/http";

export class AuthController {
  // POST /api/auth/login  - recebe email + senha, devolve token
  login = (_req: IncomingMessage, res: ServerResponse) => {
    responder(res, 501, { erro: "Service pendente: login." });
  };

  // POST /api/auth/logout - invalida o token no servidor
  logout = (_req: IncomingMessage, res: ServerResponse) => {
    responder(res, 501, { erro: "Service pendente: logout." });
  };

  // GET /api/auth/me      - devolve os dados de quem esta autenticado
  me = (_req: IncomingMessage, res: ServerResponse) => {
    responder(res, 501, { erro: "Service pendente: me." });
  };
}
