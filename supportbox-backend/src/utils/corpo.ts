// Le e interpreta o corpo JSON de uma requisicao.
// E o ponto unico de leitura de corpo da API.

import type { IncomingMessage } from "http";

// NUNCA lanca excecao: devolve `ok: true` com os dados, ou `ok: false` com a
// mensagem de erro. Deixa o Controller com duas linhas:
//
//   const corpo = await lerCorpoJson(req);
//   if (!corpo.ok) return responder(res, 400, { erro: corpo.erro });
export type ResultadoCorpo<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

export async function lerCorpoJson<T = unknown>(
  req: IncomingMessage,
): Promise<ResultadoCorpo<T>> {
  return new Promise((resolve) => {
    let bruto = "";

    req.on("data", (pedaco) => {
      bruto += pedaco;
    });

    req.on("end", () => {
      // Corpo vazio vira objeto vazio - facilita quem tem campos opcionais.
      if (!bruto) return resolve({ ok: true, dados: {} as T });
      try {
        resolve({ ok: true, dados: JSON.parse(bruto) as T });
      } catch {
        resolve({ ok: false, erro: "JSON invalido no corpo da requisicao." });
      }
    });
  });
}
