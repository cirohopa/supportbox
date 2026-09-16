// Regras de negocio dos comentarios. Nao sabe nada de HTTP nem de SQL.
//
// Usa DUAS DAOs: a de chamados (para saber de quem e o chamado e checar
// permissao) e a de comentarios (para gravar e listar).
//
// Regras cobertas: so o solicitante do chamado e o agente atribuido podem
// comentar (regra 5); quem nao ve o chamado nao ve os comentarios (regra 3).

import type { Ator, Comentario } from "../dominio";
import { ChamadosDAO } from "../dao/ChamadosDAO";
import { ComentariosDAO } from "../dao/ComentariosDAO";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";

function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export class ComentariosService {
  // As DAOs vem por parametro, com um padrao, para dar para trocar por
  // versoes falsas em teste sem precisar de banco.
  constructor(
    private chamadosDao: ChamadosDAO = new ChamadosDAO(),
    private comentariosDao: ComentariosDAO = new ComentariosDAO(),
  ) {}

  async adicionar(
    idChamado: string,
    ator: Ator,
    texto: unknown,
  ): Promise<Comentario> {
    const chamado = await this.chamadosDao.buscarPorId(idChamado);
    if (!chamado) {
      throw new ErroNaoEncontrado("Chamado nao encontrado.");
    }

    // Regra 5: checagem por IDENTIDADE, nao por papel. Um agente que nao
    // esteja atribuido a ESTE chamado tambem nao pode comentar.
    const ehSolicitante = ator.id === chamado.solicitanteId;
    const ehAgenteAtribuido = ator.id === chamado.agenteId;
    if (!ehSolicitante && !ehAgenteAtribuido) {
      throw new ErroAcessoNegado(
        "Apenas o solicitante do chamado e o agente atribuido podem comentar.",
      );
    }

    const conteudo = comoTexto(texto);
    if (conteudo.length === 0) {
      throw new ErroValidacao("O comentario nao pode estar vazio.");
    }

    return this.comentariosDao.criar({
      chamadoId: idChamado,
      autor: ator.id,
      texto: conteudo,
    });
  }

  async listar(idChamado: string, ator: Ator): Promise<Comentario[]> {
    const chamado = await this.chamadosDao.buscarPorId(idChamado);
    if (!chamado) {
      throw new ErroNaoEncontrado("Chamado nao encontrado.");
    }

    // Regra 3: solicitante so ve os chamados que ele mesmo abriu.
    if (ator.papel === "solicitante" && chamado.solicitanteId !== ator.id) {
      throw new ErroAcessoNegado("Voce nao tem acesso a este chamado.");
    }

    return this.comentariosDao.listarPorChamado(idChamado);
  }
}
