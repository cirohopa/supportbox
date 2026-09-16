// Camada HTTP dos chamados. Todo metodo segue o mesmo roteiro:
//   1. extrairAtor -> se nao identificar, 401
//   2. quando ha corpo, lerCorpoJson -> se for invalido, 400
//   3. await no Service, dentro de try/catch
//   4. responde; no catch, responderErro traduz o erro no status certo
//
// Nao decide regra de negocio nem toca no banco - so traduz HTTP <-> Service.

import type { IncomingMessage, ServerResponse } from "http";
import { responder, responderErro, type Contexto } from "../utils/http";
import { lerCorpoJson } from "../utils/corpo";
import { extrairAtor } from "../utils/ator";
import {
  ChamadosService,
  type DadosAbrirChamado,
} from "../services/ChamadosService";

export class ChamadosController {
  private service = new ChamadosService();

  // POST /api/chamados -> 201 com o chamado criado
  abrir = async (req: IncomingMessage, res: ServerResponse) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<DadosAbrirChamado>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const chamado = await this.service.abrir(ator, corpo.dados);
      responder(res, 201, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // GET /api/chamados?status=... -> 200 com { itens: [...] }
  listar = async (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const itens = await this.service.listar(ator, { status: ctx.busca.status });
      responder(res, 200, { itens });
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // GET /api/chamados/:id -> 200, ou 403 sem acesso, ou 404 se nao existir
  detalhar = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = await this.service.detalhar(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // POST /api/chamados/:id/assumir -> 200 com o chamado atualizado
  assumir = async (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = await this.service.assumir(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // POST /api/chamados/:id/concluir -> 200 com o chamado atualizado
  concluir = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = await this.service.concluir(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // POST /api/chamados/:id/reabrir -> 200 (solicitante, ate 7 dias)
  reabrir = async (req: IncomingMessage, res: ServerResponse, ctx: Contexto) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    try {
      const chamado = await this.service.reabrir(ctx.parametros.id, ator);
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // PATCH /api/chamados/:id/atribuir - body { agenteId } -> 200
  reatribuir = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<{ agenteId?: unknown }>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const chamado = await this.service.reatribuir(
        ctx.parametros.id,
        ator,
        corpo.dados.agenteId,
      );
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };

  // PATCH /api/chamados/:id/prioridade - body { prioridade } -> 200
  alterarPrioridade = async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: Contexto,
  ) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<{ prioridade?: unknown }>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const chamado = await this.service.alterarPrioridade(
        ctx.parametros.id,
        ator,
        corpo.dados.prioridade,
      );
      responder(res, 200, chamado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
