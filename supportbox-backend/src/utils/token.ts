// O "cracha" de sessao: cria e confere o token que o frontend envia em toda
// requisicao depois do login.
//
// O token tem duas partes, separadas por ponto: "conteudo.assinatura".
//   conteudo:   quem e a pessoa e ate quando o cracha vale (em base64url)
//   assinatura: um HMAC do conteudo, feito com a chave secreta do .env
//
// Quem alterar o conteudo nao consegue refazer a assinatura sem a chave, e o
// token e recusado. Assim nao e preciso consultar o banco a cada requisicao.

import { createHmac, timingSafeEqual } from "crypto";
import type { Ator, UsuarioPublico } from "../dominio";

const segredo = process.env.SESSAO_SEGREDO;

// Igual a DATABASE_URL e a GEMINI_API_KEY: sem a chave, o servidor nem sobe.
if (!segredo) {
  throw new Error(
    "SESSAO_SEGREDO ausente. Defina no arquivo .env uma frase longa e " +
      "aleatoria (veja o .env.example).",
  );
}

const CHAVE: string = segredo;
const OITO_HORAS_EM_MS = 8 * 60 * 60 * 1000;

function assinar(conteudo: string): string {
  return createHmac("sha256", CHAVE).update(conteudo).digest("base64url");
}

export function gerarToken(usuario: UsuarioPublico): string {
  const conteudo = Buffer.from(
    JSON.stringify({
      id: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      exp: Date.now() + OITO_HORAS_EM_MS,
    }),
  ).toString("base64url");

  return `${conteudo}.${assinar(conteudo)}`;
}

// Devolve `null` para qualquer problema: formato errado, assinatura que nao
// bate ou cracha vencido. Quem chama nao precisa saber qual foi.
export function lerToken(token: string): Ator | null {
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [conteudo, assinatura] = partes;

  const recebida = Buffer.from(assinatura);
  const esperada = Buffer.from(assinar(conteudo));
  // timingSafeEqual leva o mesmo tempo acerte ou erre, para nao dar pistas a
  // quem tenta adivinhar a assinatura. Ele exige tamanhos iguais.
  if (recebida.length !== esperada.length) return null;
  if (!timingSafeEqual(recebida, esperada)) return null;

  try {
    const dados = JSON.parse(Buffer.from(conteudo, "base64url").toString());
    if (typeof dados.exp !== "number" || Date.now() > dados.exp) return null;
    if (typeof dados.id !== "string") return null;
    if (dados.papel !== "solicitante" && dados.papel !== "agente") return null;
    return { id: dados.id, papel: dados.papel };
  } catch {
    return null;
  }
}
