// Regras de negocio dos chamados - o miolo do sistema.
//
// Aplica o REGRAS_DE_NEGOCIO.md: quem pode fazer o que, quando, e quais
// transicoes de estado sao validas. Nao sabe nada de HTTP nem de SQL.
//
// Quando uma regra e violada, lanca um erro de dominio (erros.ts) que a
// camada HTTP traduz no status certo.
//
// PENDENTE (parte da regra 5): comentarios automaticos do autor "Sistema"
// a cada mudanca de status, atribuicao ou prioridade.

import type { Ator, Chamado, Prioridade } from "../dominio";
import { ChamadosDAO } from "../dao/ChamadosDAO";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";

export type DadosAbrirChamado = {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  // Prioridade sugerida pela triagem (POST /api/triagem). Opcional: sem ela
  // vale "media". E `unknown` porque vem do corpo da requisicao e ainda nao
  // foi conferida - quem valida e este Service, no metodo `abrir`.
  //
  // LIMITACAO: hoje confiamos que este valor veio da nossa triagem, do mesmo
  // jeito que confiamos nos cabecalhos X-Usuario-*. Quando entrar
  // autenticacao real, a triagem passa a ser chamada DENTRO do `abrir` e a
  // brecha fecha.
  prioridade?: unknown;
};

// Os mesmos valores aceitos pelos CHECK do banco (banco/schema.sql).
const CATEGORIAS_VALIDAS = ["hardware", "software", "acesso", "rede"];
const TIPOS_VALIDOS = ["incidente", "solicitacao"];
const PRIORIDADES_VALIDAS: Prioridade[] = ["baixa", "media", "alta"];
const STATUS_VALIDOS = ["aberto", "em_andamento", "concluido"];

function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function exigirAgente(ator: Ator): void {
  if (ator.papel !== "agente") {
    throw new ErroAcessoNegado("Apenas um agente pode executar esta acao.");
  }
}

export class ChamadosService {
  // A DAO vem por parametro, com um padrao, para dar para trocar por uma
  // versao falsa em teste sem precisar de banco.
  constructor(private dao: ChamadosDAO = new ChamadosDAO()) {}

  // Regra 4: validacao obrigatoria na abertura.
  async abrir(ator: Ator, dados: DadosAbrirChamado): Promise<Chamado> {
    const titulo = comoTexto(dados.titulo);
    const descricao = comoTexto(dados.descricao);
    const categoria = comoTexto(dados.categoria).toLowerCase();
    const tipo = comoTexto(dados.tipo).toLowerCase();

    if (titulo.length < 5) {
      throw new ErroValidacao(
        "Titulo do chamado deve ter no minimo 5 caracteres.",
      );
    }
    if (descricao.length < 20) {
      throw new ErroValidacao(
        "Descricao do chamado deve ter no minimo 20 caracteres.",
      );
    }
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      throw new ErroValidacao(
        `Categoria invalida. Use uma de: ${CATEGORIAS_VALIDAS.join(", ")}.`,
      );
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      throw new ErroValidacao(
        `Tipo invalido. Use um de: ${TIPOS_VALIDOS.join(", ")}.`,
      );
    }

    // Nao importa de onde a sugestao veio: so entra no banco se for um dos
    // tres niveis validos. Valor ausente ou estranho vira "media", sem erro -
    // abrir chamado nunca pode falhar por causa de uma sugestao ruim.
    const sugerida = comoTexto(dados.prioridade).toLowerCase();
    const prioridade =
      PRIORIDADES_VALIDAS.find((p) => p === sugerida) ?? "media";

    return this.dao.criar({
      titulo,
      descricao,
      categoria,
      tipo,
      solicitanteId: ator.id,
      prioridade,
    });
  }

  // Regra 3: agente ve todos; solicitante ve so os que ele abriu.
  async listar(
    ator: Ator,
    filtros: { status?: string } = {},
  ): Promise<Chamado[]> {
    let lista = await this.dao.listar();

    if (ator.papel === "solicitante") {
      lista = lista.filter((chamado) => chamado.solicitanteId === ator.id);
    }

    if (filtros.status !== undefined) {
      const status = comoTexto(filtros.status).toLowerCase();
      if (!STATUS_VALIDOS.includes(status)) {
        throw new ErroValidacao(
          `Status invalido. Use um de: ${STATUS_VALIDOS.join(", ")}.`,
        );
      }
      lista = lista.filter((chamado) => chamado.status === status);
    }

    return lista;
  }

  async detalhar(idChamado: string, ator: Ator): Promise<Chamado> {
    const chamado = await this.buscarOuFalhar(idChamado);
    if (ator.papel === "solicitante" && chamado.solicitanteId !== ator.id) {
      throw new ErroAcessoNegado("Voce nao tem acesso a este chamado.");
    }
    return chamado;
  }

  // Regras 1 e 2: so agente assume, e so chamado "aberto".
  async assumir(idChamado: string, ator: Ator): Promise<Chamado> {
    exigirAgente(ator);
    const chamado = await this.buscarOuFalhar(idChamado);
    if (chamado.status !== "aberto") {
      throw new ErroValidacao(
        'So e possivel assumir um chamado com status "aberto".',
      );
    }
    chamado.status = "em_andamento";
    chamado.agenteId = ator.id;
    return this.dao.atualizar(chamado);
  }

  // Regra 2: so o agente ATRIBUIDO conclui. A data gravada aqui e a base do
  // prazo de 7 dias da regra 7.
  async concluir(idChamado: string, ator: Ator): Promise<Chamado> {
    exigirAgente(ator);
    const chamado = await this.buscarOuFalhar(idChamado);
    if (chamado.agenteId !== ator.id) {
      throw new ErroAcessoNegado(
        "Apenas o agente atribuido pode concluir o chamado.",
      );
    }
    if (chamado.status !== "em_andamento") {
      throw new ErroValidacao('So e possivel concluir um chamado "em_andamento".');
    }
    chamado.status = "concluido";
    chamado.concluidoEm = new Date();
    return this.dao.atualizar(chamado);
  }

  // Regra 7: o solicitante que abriu pode reabrir em ate 7 dias corridos.
  async reabrir(idChamado: string, ator: Ator): Promise<Chamado> {
    const chamado = await this.buscarOuFalhar(idChamado);

    if (ator.papel !== "solicitante" || chamado.solicitanteId !== ator.id) {
      throw new ErroAcessoNegado(
        "Apenas o solicitante que abriu o chamado pode reabri-lo.",
      );
    }
    if (chamado.status !== "concluido" || chamado.concluidoEm === null) {
      throw new ErroValidacao('So e possivel reabrir um chamado "concluido".');
    }

    const SETE_DIAS_EM_MS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() > chamado.concluidoEm.getTime() + SETE_DIAS_EM_MS) {
      throw new ErroValidacao(
        "Prazo de 7 dias para reabertura expirou. Abra um novo chamado.",
      );
    }

    chamado.status = "em_andamento";
    // Zera a data: um chamado que voltou a ser atendido nao tem conclusao.
    chamado.concluidoEm = null;
    return this.dao.atualizar(chamado);
  }

  // So vale para chamado "em_andamento" - ou seja, que ja tem dono. Isso
  // preserva a maquina de estados: um chamado "aberto" ganha agente
  // ASSUMINDO, e um "concluido" nao troca de dono.
  //
  // Nao ha como conferir se o id recebido e mesmo de um agente: falta a
  // tabela de usuarios, que chega com a autenticacao.
  async reatribuir(
    idChamado: string,
    ator: Ator,
    novoAgenteId: unknown,
  ): Promise<Chamado> {
    exigirAgente(ator);
    const chamado = await this.buscarOuFalhar(idChamado);
    if (chamado.status !== "em_andamento") {
      throw new ErroValidacao(
        'So e possivel reatribuir um chamado "em_andamento".',
      );
    }
    const novo = comoTexto(novoAgenteId);
    if (novo.length === 0) {
      throw new ErroValidacao("Informe o agente que recebera o chamado.");
    }
    chamado.agenteId = novo;
    return this.dao.atualizar(chamado);
  }

  // Regra 3: solicitante nao mexe em prioridade.
  async alterarPrioridade(
    idChamado: string,
    ator: Ator,
    prioridade: unknown,
  ): Promise<Chamado> {
    exigirAgente(ator);
    const chamado = await this.buscarOuFalhar(idChamado);
    const valor = comoTexto(prioridade).toLowerCase();
    const prioridadeValida = PRIORIDADES_VALIDAS.find((p) => p === valor);
    if (!prioridadeValida) {
      throw new ErroValidacao(
        `Prioridade invalida. Use uma de: ${PRIORIDADES_VALIDAS.join(", ")}.`,
      );
    }
    chamado.prioridade = prioridadeValida;
    return this.dao.atualizar(chamado);
  }

  private async buscarOuFalhar(idChamado: string): Promise<Chamado> {
    const chamado = await this.dao.buscarPorId(idChamado);
    if (!chamado) {
      throw new ErroNaoEncontrado("Chamado nao encontrado.");
    }
    return chamado;
  }

    // Busca pelo protocolo (ex.: "ch-2026-008" vira "CH-2026-008") e aplica
// a mesma regra de acesso do detalhar.
  async buscarPorProtocolo(protocolo: unknown, ator: Ator): Promise<Chamado> {
    
    const codigo = comoTexto(protocolo).toUpperCase();
    const chamado = await this.dao.buscarPorProtocolo(codigo);
    if (!chamado) {
      throw new ErroNaoEncontrado("Chamado nao encontrado.");
    }
    
    if (ator.papel === "solicitante" && chamado.solicitanteId !== ator.id) {
      throw new ErroAcessoNegado("Voce nao tem acesso a este chamado.");
    }

  return chamado;
}
}
