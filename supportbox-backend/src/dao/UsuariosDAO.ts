// Persistencia dos usuarios. So grava e le - quem confere a senha e o
// AuthService, e quem gera o resumo dela e o utils/senha.ts.

import { consultar } from "../db";
import type { Papel, Usuario } from "../dominio";

export type DadosCriarUsuario = {
  nome: string;
  email: string;
  senhaHash: string; // o resumo, NUNCA a senha (utils/senha.ts)
  papel: Papel;
};

const TABELA = "usuarios";

// O banco usa snake_case (criado_em), o dominio usa camelCase (criadoEm).
// A traducao acontece so aqui. O senha_hash fica de fora de proposito:
// so o buscarPorEmail devolve, porque so o login precisa dele.
function paraUsuario(linha: any): Usuario {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    papel: linha.papel,
    criadoEm: linha.criado_em,
  };
}

export class UsuariosDAO {
  // Usado pelo login. Devolve o usuario COM o senhaHash, para o AuthService
  // conferir a senha - por isso o resultado nunca deve sair numa resposta.
  //
  // O lower() dos dois lados faz "Renata@Empresa.com" achar
  // "renata@empresa.com": ninguem fica de fora por causa de maiuscula.
  async buscarPorEmail(
    email: string,
  ): Promise<(Usuario & { senhaHash: string }) | null> {
    const linhas = await consultar(
      `SELECT * FROM ${TABELA} WHERE lower(email) = lower($1)`,
      [email],
    );
    if (linhas.length === 0) {
      return null;
    }
    return { ...paraUsuario(linhas[0]), senhaHash: linhas[0].senha_hash };
  }

  // O banco preenche id e criado_em sozinho (DEFAULTs do schema.sql).
  async criar(dados: DadosCriarUsuario): Promise<Usuario> {
    const linhas = await consultar(
      `INSERT INTO ${TABELA} (nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dados.nome, dados.email, dados.senhaHash, dados.papel],
    );
    return paraUsuario(linhas[0]);
  }
}
