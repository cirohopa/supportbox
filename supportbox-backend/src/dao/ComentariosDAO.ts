// Persistencia dos comentarios. So grava e le - nao conhece regra de
// negocio nem HTTP.
//
// So existe `criar` e `listarPorChamado`. Nao ha atualizar nem apagar, de
// proposito: comentario e IMUTAVEL (regra 5). A ausencia desses metodos e a
// propria regra virando codigo.

import { consultar } from "../db";
import type { Comentario } from "../dominio";

export type DadosCriarComentario = {
  chamadoId: string;
  autor: string; // id do usuario, ou "Sistema" nos automaticos
  texto: string;
};

const TABELA = "comentarios";

// O banco usa snake_case (chamado_id), o dominio usa camelCase (chamadoId).
// A traducao acontece so aqui.
function paraComentario(linha: any): Comentario {
  return {
    id: linha.id,
    chamadoId: linha.chamado_id,
    autor: linha.autor,
    texto: linha.texto,
    criadoEm: linha.criado_em,
  };
}

export class ComentariosDAO {
  // O `RETURNING *` traz de volta a linha gravada, ja com o id e o
  // criado_em que o banco gerou - evita uma segunda consulta.
  async criar(dados: DadosCriarComentario): Promise<Comentario> {
    const linhas = await consultar(
      `INSERT INTO ${TABELA} (chamado_id, autor, texto)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [dados.chamadoId, dados.autor, dados.texto],
    );

    return paraComentario(linhas[0]);
  }

  // Ordem cronologica: quem le a conversa espera de cima para baixo.
  // Quem checa se o chamado EXISTE e o Service, antes de chamar aqui.
  async listarPorChamado(chamadoId: string): Promise<Comentario[]> {
    const linhas = await consultar(
      `SELECT * FROM ${TABELA}
        WHERE chamado_id = $1
        ORDER BY criado_em ASC`,
      [chamadoId],
    );
    return linhas.map(paraComentario);
  }
}
