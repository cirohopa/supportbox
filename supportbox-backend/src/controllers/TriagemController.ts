// Camada HTTP da triagem. Segue o mesmo roteiro dos outros Controllers:
// identifica quem chamou, le o corpo, chama o Service, responde.
// Nao conhece prompt nem IA - so traduz HTTP <-> Service.
//
// E POST, e nao GET, porque o rascunho vai no CORPO da requisicao: GET nao
// tem corpo, e texto de chamado nao deve viajar na URL (fica em log e
// historico do navegador).

import type { IncomingMessage, ServerResponse } from "http";
import { responder, responderErro } from "../utils/http";
import { lerCorpoJson } from "../utils/corpo";
import { extrairAtor } from "../utils/ator";
import {
  TriagemService,
  type RascunhoChamado,
} from "../services/TriagemService";

export class TriagemController {
  private service = new TriagemService();

  // POST /api/triagem -> 200 com os passos e a prioridade sugerida.
  //
  // Responde 200 MESMO com a IA fora do ar - nesse caso o corpo vem com
  // `disponivel: false`. Sugestao indisponivel nao e falha da requisicao:
  // o solicitante continua podendo abrir o chamado.
  analisar = async (req: IncomingMessage, res: ServerResponse) => {
    const ator = extrairAtor(req);
    if (!ator) return responder(res, 401, { erro: "Nao autenticado." });

    const corpo = await lerCorpoJson<Partial<RascunhoChamado>>(req);
    if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });

    try {
      const resultado = await this.service.analisar({
        titulo: corpo.dados.titulo ?? "",
        descricao: corpo.dados.descricao ?? "",
        categoria: corpo.dados.categoria ?? "",
        tipo: corpo.dados.tipo ?? "",
      });
      responder(res, 200, resultado);
    } catch (erro) {
      responderErro(res, erro);
    }
  };
}
