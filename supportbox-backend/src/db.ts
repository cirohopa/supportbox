// Conexao com o PostgreSQL. As DAOs usam a funcao `consultar` daqui.
//
// O Pool mantem algumas conexoes ja abertas e empresta conforme a
// necessidade - abrir uma conexao por requisicao seria lento demais.
// Por isso existe UM pool so, compartilhado por todas as DAOs.

import { Pool } from "pg";

const urlDoBanco = process.env.DATABASE_URL;

if (!urlDoBanco) {
  throw new Error(
    "DATABASE_URL ausente. Defina a conexao no arquivo .env " +
      "(veja o .env.example).",
  );
}

// Postgres em rede local costuma NAO ter SSL, e liga-lo quebra a conexao.
// Banco na internet (Supabase) exige SSL. A expressao detecta enderecos
// locais (localhost) e das faixas de rede privada (10.x, 192.168.x, 172.16-31.x).
const REDE_LOCAL =
  /@(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
const ehRedeLocal = REDE_LOCAL.test(urlDoBanco);

export const pool = new Pool({
  connectionString: urlDoBanco,
  max: 10,
  // `rejectUnauthorized: false`: a conexao continua criptografada, mas nao
  // conferimos quem emitiu o certificado. Suficiente para este projeto.
  ssl: ehRedeLocal ? undefined : { rejectUnauthorized: false },
});

// Os valores NUNCA vao colados dentro do texto do SQL - vao na lista
// `parametros`, e o Postgres os encaixa nos `$1`, `$2`... Isso evita SQL
// injection: o valor e sempre tratado como dado, nunca como comando.
//
//   certo:  consultar("SELECT * FROM chamados WHERE id = $1", [id])
//   errado: consultar(`SELECT * FROM chamados WHERE id = '${id}'`)
export async function consultar<T = any>(
  sql: string,
  parametros: unknown[] = [],
): Promise<T[]> {
  const resultado = await pool.query(sql, parametros);
  return resultado.rows as T[];
}
