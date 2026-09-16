// Camada HTTP dos comentarios. As rotas sao aninhadas em
// /chamados/:idChamado/comentarios porque comentario pertence a um chamado.
//
// So existe adicionar e listar: comentario e IMUTAVEL (regra 5), entao nao
// ha endpoint de editar nem de apagar.

import type { IncomingMessage, ServerResponse } from "http";
import { responder, responderErro, type Contexto } from "../utils/http";
import { lerCorpoJson } from "../utils/corpo";
import { extrairAtor } from "../utils/ator";
import { ComentariosService } from "../services/ComentariosService";

export class ComentariosController {
  private service = new ComentariosService();

  // POST /api/chamados/:idChamado/comentarios
  // Body: { texto } -> 201 com o comentario criado.
  adicionar = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<{ texto?: unknown }>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const comentario = await this.service.adicionar(
        ctx.parametros.idChamado,
        ator,
        corpo.dados.texto,
      );
      responder(res, 201, comentario);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // GET /api/chamados/:idChamado/comentarios -> 200 com { itens: [...] }
  listar = async (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const itens = await this.service.listar(ctx.parametros.idChamado, ator);
      responder(res, 200, { itens });
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
