// Camada HTTP da autenticacao: entrar, sair e "quem sou eu".

import type { IncomingMessage, ServerResponse } from "http";
import { responder, responderErro } from "../utils/http";
import { lerCorpoJson } from "../utils/corpo";
import { extrairAtor } from "../utils/ator";
import { AuthService } from "../services/AuthService";

export class AuthController {
  private service = new AuthService();

  // POST /api/auth/login
  // Body: { email, senha } -> 200 com { token, usuario }.
  login = async (req: IncomingMessage, res: ServerResponse) => {
    const corpo = await lerCorpoJson<{ email?: unknown; senha?: unknown }>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const resultado = await this.service.entrar(
        corpo.dados.email,
        corpo.dados.senha,
      );
      responder(res, 200, resultado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // POST /api/auth/logout -> 204.
  // O token nao fica guardado no servidor: sair e o frontend apaga-lo.
  logout = (_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(204);
    res.end();
  };

  // GET /api/auth/me -> 200 com { email, nome, papel }.
  me = async (req: IncomingMessage, res: ServerResponse) => {
    const ator = extrairAtor(req);
    if (!ator) {
      return responder(res, 401, { erro: "Sessão inválida ou expirada." });
    }

    try {
      responder(res, 200, await this.service.quemSou(ator));
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
