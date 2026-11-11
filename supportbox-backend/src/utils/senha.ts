// Protecao das senhas. A senha NUNCA e guardada: o banco guarda so um
// "resumo" dela (hash), do qual nao da para voltar a senha original. Se o
// banco vazar, as senhas nao vazam.
//
// Tudo com o modulo crypto do proprio Node - nenhuma biblioteca nova.
//
//   scrypt          gera o resumo. E LENTO de proposito: para quem tenta
//                   adivinhar senhas, cada tentativa custa caro.
//   salt            16 bytes aleatorios, diferentes para cada senha. Assim,
//                   duas pessoas com a mesma senha tem resumos diferentes.
//   timingSafeEqual compara em tempo constante, sem "entregar" pela demora
//                   quantos caracteres estavam certos.

import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

// O scrypt original trabalha com callback; o promisify deixa usar com await.
const scryptAsync = promisify(scrypt) as (
  senha: string,
  salt: Buffer,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO_SALT = 16;
const TAMANHO_HASH = 64;

// Devolve 'salt:hash' em hexadecimal - o salt vai junto porque e preciso
// dele para conferir a senha depois.
export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(TAMANHO_SALT);
  const hash = await scryptAsync(senha, salt, TAMANHO_HASH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

// Refaz o resumo da senha digitada com o MESMO salt guardado e compara.
export async function conferirSenha(
  senha: string,
  hashGuardado: string,
): Promise<boolean> {
  const [saltHex, hashHex] = hashGuardado.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }

  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scryptAsync(
    senha,
    Buffer.from(saltHex, "hex"),
    esperado.length,
  );

  // O timingSafeEqual exige dois buffers do mesmo tamanho.
  return (
    calculado.length === esperado.length &&
    timingSafeEqual(calculado, esperado)
  );
}
