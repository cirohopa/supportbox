// Persistencia dos chamados. So grava e le - nao conhece regra de negocio
// (isso e do Service) nem HTTP (isso e do Controller).
//
// Todos os metodos sao assincronos, porque falar com o banco leva tempo.

import { consultar } from "../db";
import type { Chamado, Prioridade } from "../dominio";

export type DadosCriarChamado = {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  solicitanteId: string;
  // Vem ja validada do Service (da triagem por IA, ou "media" por padrao).
  // A DAO nao decide prioridade: so grava a que recebeu.
  prioridade: Prioridade;
};

const TABELA = "chamados";

// O banco usa snake_case (solicitante_id), o dominio usa camelCase
// (solicitanteId). A traducao acontece so aqui.
// Colunas `timestamptz` ja chegam da biblioteca `pg` como Date.
function paraChamado(linha: any): Chamado {
  return {
    id: linha.id,
    protocolo: linha.protocolo,
    titulo: linha.titulo,
    descricao: linha.descricao,
    categoria: linha.categoria,
    tipo: linha.tipo,
    status: linha.status,
    prioridade: linha.prioridade,
    solicitanteId: linha.solicitante_id,
    agenteId: linha.agente_id,
    criadoEm: linha.criado_em,
    concluidoEm: linha.concluido_em ?? null,
  };
}

export class ChamadosDAO {
  // O banco preenche id e criado_em sozinho (DEFAULTs do schema.sql).
  // O `RETURNING *` traz a linha ja gravada, evitando uma segunda consulta.
  async criar(dados: DadosCriarChamado): Promise<Chamado> {
    const protocolo = await this.gerarProtocolo(new Date().getFullYear());

    const linhas = await consultar(
      `INSERT INTO ${TABELA}
         (protocolo, titulo, descricao, categoria, tipo,
          status, prioridade, solicitante_id, agente_id, concluido_em)
       VALUES ($1, $2, $3, $4, $5, 'aberto', $6, $7, NULL, NULL)
       RETURNING *`,
      [
        protocolo,
        dados.titulo,
        dados.descricao,
        dados.categoria,
        dados.tipo,
        dados.prioridade,
        dados.solicitanteId,
      ],
    );

    return paraChamado(linhas[0]);
  }

  async buscarPorId(id: string): Promise<Chamado | null> {
    const linhas = await consultar(`SELECT * FROM ${TABELA} WHERE id = $1`, [id]);
    return linhas.length > 0 ? paraChamado(linhas[0]) : null;
  }

  // Devolve TODOS, sem filtrar. Quem decide o que cada um pode ver
  // (regra 3) e o Service.
  async listar(): Promise<Chamado[]> {
    const linhas = await consultar(
      `SELECT * FROM ${TABELA} ORDER BY criado_em DESC`,
    );
    return linhas.map(paraChamado);
  }

  // Grava so os campos que as acoes do sistema mudam. Titulo, descricao e
  // protocolo sao imutaveis depois da criacao.
  async atualizar(chamado: Chamado): Promise<Chamado> {
    const linhas = await consultar(
      `UPDATE ${TABELA}
          SET status       = $1,
              prioridade   = $2,
              agente_id    = $3,
              concluido_em = $4
        WHERE id = $5
        RETURNING *`,
      [
        chamado.status,
        chamado.prioridade,
        chamado.agenteId,
        chamado.concluidoEm,
        chamado.id,
      ],
    );

    return paraChamado(linhas[0]);
  }

  // Protocolo CH-AAAA-NNN, sequencial por ano (regra 4): conta os chamados
  // do ano e soma 1.
  //
  // O `::int` nao e enfeite: sem ele a biblioteca `pg` devolve a contagem
  // como TEXTO (COUNT retorna bigint), e "7" + 1 viraria "71" em vez de 8.
  private async gerarProtocolo(ano: number): Promise<string> {
    const inicio = new Date(Date.UTC(ano, 0, 1));
    const fim = new Date(Date.UTC(ano + 1, 0, 1));

    const linhas = await consultar<{ total: number }>(
      `SELECT COUNT(*)::int AS total
         FROM ${TABELA}
        WHERE criado_em >= $1
          AND criado_em <  $2`,
      [inicio, fim],
    );

    const sequencial = String(linhas[0].total + 1).padStart(3, "0");
    return `CH-${ano}-${sequencial}`;
  }
}
