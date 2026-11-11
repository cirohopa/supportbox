// Regras de login: confere e-mail e senha e entrega o token de sessao.
//
// Nao sabe nada de HTTP. Quando o login nao pode acontecer, lanca um erro de
// dominio (erros.ts) que a camada HTTP traduz no status certo.

import type { Ator, UsuarioPublico } from "../dominio";
import { UsuariosDAO } from "../dao/UsuariosDAO";
import { ErroNaoAutenticado, ErroValidacao } from "../erros";
import { conferirSenha } from "../utils/senha";
import { gerarToken } from "../utils/token";

export class AuthService {
  // A DAO vem por parametro, com um padrao, para dar para trocar por uma
  // versao falsa em teste sem precisar de banco.
  constructor(private dao: UsuariosDAO = new UsuariosDAO()) {}

  async entrar(
    email: unknown,
    senha: unknown,
  ): Promise<{ token: string; usuario: UsuarioPublico }> {
    const emailInformado = typeof email === "string" ? email.trim() : "";
    const senhaInformada = typeof senha === "string" ? senha : "";

    if (emailInformado === "" || senhaInformada === "") {
      throw new ErroValidacao("Informe e-mail e senha.");
    }

    // A mesma mensagem para e-mail e senha errados: dizer qual dos dois
    // falhou ajudaria quem esta tentando invadir uma conta.
    const encontrado = await this.dao.buscarPorEmail(emailInformado);
    if (
      !encontrado ||
      !(await conferirSenha(senhaInformada, encontrado.senhaHash))
    ) {
      throw new ErroNaoAutenticado("E-mail ou senha inválidos.");
    }

    const usuario: UsuarioPublico = {
      email: encontrado.email,
      nome: encontrado.nome,
      papel: encontrado.papel,
    };
    return { token: gerarToken(usuario), usuario };
  }

  // O token pode continuar valido depois de o usuario ser removido do banco;
  // por isso aqui a conferencia e feita na tabela, e nao so no token.
  async quemSou(ator: Ator): Promise<UsuarioPublico> {
    const encontrado = await this.dao.buscarPorEmail(ator.id);
    if (!encontrado) {
      throw new ErroNaoAutenticado("Sessão inválida ou expirada.");
    }
    return {
      email: encontrado.email,
      nome: encontrado.nome,
      papel: encontrado.papel,
    };
  }
}
