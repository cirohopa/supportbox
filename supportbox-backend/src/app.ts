// O "roteador" da aplicacao: recebe cada requisicao, descobre qual metodo de
// Controller atende, e chama. Fica entre o server.ts e os Controllers.
//
// Isolado do server.ts para dar para testar sem subir servidor: basta
// importar `criarManipulador` e simular req/res.

import type { IncomingMessage, ServerResponse } from "http";
import { listarRotas } from "./routes/index";
import { responder } from "./utils/http";

const ORIGEM_FRONTEND = process.env.ORIGEM_FRONTEND ?? "http://localhost:3000";

export function criarManipulador() {
  // As rotas sao compiladas UMA vez, na partida - nao a cada requisicao.
  const rotas = listarRotas();

  return async (req: IncomingMessage, res: ServerResponse) => {
    // CORS: sem estes cabecalhos, o navegador bloqueia o frontend de chamar
    // esta API, porque ele roda em outra porta.
    res.setHeader("Access-Control-Allow-Origin", ORIGEM_FRONTEND);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    // Antes de um POST/PATCH com JSON, o navegador manda um OPTIONS
    // perguntando se a chamada e permitida ("preflight"). Respondemos 204.
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // `req.url` traz so o caminho, sem host - mas o construtor de URL exige
    // um. O host passado aqui e descartado; so usamos pathname e query.
    const url = new URL(req.url ?? "/", "http://localhost");

    for (const rota of rotas) {
      if (rota.metodo !== req.method) continue;

      const m = rota.regex.exec(url.pathname);
      if (!m) continue;

      // Monta os parametros nomeados: `nomesParametros[i]` casa com o grupo
      // capturado `m[i + 1]` (o indice 0 e o texto inteiro que casou).
      const parametros: Record<string, string> = {};
      rota.nomesParametros.forEach((nome, i) => {
        parametros[nome] = m[i + 1];
      });

      const busca = Object.fromEntries(url.searchParams);

      return rota.manipulador(req, res, { parametros, busca });
    }

    responder(res, 404, { erro: "Rota nao encontrada." });
  };
}
