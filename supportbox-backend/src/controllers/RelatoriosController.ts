// Camada HTTP do relatorio. Segue o mesmo roteiro dos outros Controllers:
//   1. extrairAtor -> se nao identificar, 401
//   2. await no Service, dentro de try/catch
//   3. responde; no catch, responderErro traduz o erro no status certo
//
// Nao decide regra de negocio nem toca no banco - so traduz HTTP <-> Service.

import type { IncomingMessage, ServerResponse } from "http";
import { responder, responderErro, type Contexto } from "../utils/http";
import { extrairAtor } from "../utils/ator";
import { RelatoriosService } from "../services/RelatoriosService";

export class RelatoriosController {
  private service = new RelatoriosService();

  // GET /api/relatorios?de=2026-09-01&ate=2026-09-30 -> 200 com o relatorio
  //
  // As duas datas chegam pela query string, entao vem em `ctx.busca`. Nao ha
  // corpo para ler: GET so leva dados no endereco.
  gerar = async (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Sessão inválida ou expirada." });

    try {
      const relatorio = await this.service.gerar(
        ator,
        ctx.busca.de,
        ctx.busca.ate,
      );
      responder(res, 200, relatorio);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
