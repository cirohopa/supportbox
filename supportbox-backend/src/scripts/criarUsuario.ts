// Cadastra um usuario pelo terminal. Nao existe tela de cadastro (fica fora
// do escopo), entao os usuarios da demonstracao sao criados assim:
//
//   npm run criar-usuario -- email senha papel "Nome Completo"
//
//   exemplo:
//   npm run criar-usuario -- renata@empresa.com umaSenhaBoa agente "Renata Esther"
//
// O "--" separa os argumentos do npm dos argumentos do script.

// PRECISA ser o primeiro import, igual ao server.ts: o db.ts le a
// DATABASE_URL assim que e importado.
import "dotenv/config";
import { pool } from "../db";
import { UsuariosDAO } from "../dao/UsuariosDAO";
import { gerarHashSenha } from "../utils/senha";
import type { Papel } from "../dominio";

const PAPEIS_VALIDOS: Papel[] = ["solicitante", "agente"];
const TAMANHO_MINIMO_SENHA = 6;

async function principal(): Promise<void> {
  const [emailDigitado, senha, papel, nome] = process.argv.slice(2);

  if (!emailDigitado || !senha || !papel || !nome) {
    throw new Error(
      'Uso: npm run criar-usuario -- email senha papel "Nome Completo"',
    );
  }

  // Guardado sempre em minusculas: e esse e-mail que vai para o token e
  // fica gravado nos chamados, entao ele precisa ter um jeito so.
  const email = emailDigitado.trim().toLowerCase();

  if (!PAPEIS_VALIDOS.includes(papel as Papel)) {
    throw new Error(`Papel invalido: use ${PAPEIS_VALIDOS.join(" ou ")}.`);
  }
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    throw new Error(
      `A senha precisa ter ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`,
    );
  }

  const dao = new UsuariosDAO();
  if (await dao.buscarPorEmail(email)) {
    throw new Error(`Ja existe um usuario com o e-mail ${email}.`);
  }

  const usuario = await dao.criar({
    nome,
    email,
    senhaHash: await gerarHashSenha(senha),
    papel: papel as Papel,
  });

  // A senha NUNCA aparece na saida.
  console.log(
    `Usuario criado: ${usuario.nome} <${usuario.email}> (${usuario.papel})`,
  );
}

principal()
  .catch((erro) => {
    console.error(`Erro: ${erro instanceof Error ? erro.message : erro}`);
    process.exitCode = 1;
  })
  // Fecha as conexoes com o banco; sem isso o terminal fica "preso".
  .finally(() => pool.end());
