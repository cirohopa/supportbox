// Regras de negocio dos chamados - o miolo do sistema.
//
// Aplica o REGRAS_DE_NEGOCIO.md: quem pode fazer o que, quando, e quais
// transicoes de estado sao validas. Nao sabe nada de HTTP nem de SQL.
//
// Quando uma regra e violada, lanca um erro de dominio (erros.ts) que a
// camada HTTP traduz no status certo.
//
// Toda mudanca de status, responsavel ou prioridade tambem e registrada no
// historico, com o autor "Sistema" (regra 5). Como isso acontece aqui, vale
// para o site e para o Telegram.

import type { Ator, Chamado, Prioridade } from "../dominio";
import { ChamadosDAO } from "../dao/ChamadosDAO";
import { ComentariosDAO } from "../dao/ComentariosDAO";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";
import { calcularPrazo } from "./prazos";

export type DadosAbrirChamado = {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: string;
  // Prioridade sugerida pela triagem (POST /api/triagem). Opcional: sem ela
  // vale "media". E `unknown` porque vem do corpo da requisicao e ainda nao
  // foi conferida - quem valida e este Service, no metodo `abrir`.
  //
  // LIMITACAO: confiamos que este valor veio da nossa triagem. O `abrir` so
  // confere se e um dos tres niveis validos.
  prioridade?: unknown;
};

// Os mesmos valores aceitos pelos CHECK do banco (banco/schema.sql).
const CATEGORIAS_VALIDAS = ["hardware", "software", "acesso", "rede"];
const TIPOS_VALIDOS = ["incidente", "solicitacao"];
const PRIORIDADES_VALIDAS: Prioridade[] = ["baixa", "media", "alta"];
const STATUS_VALIDOS = ["aberto", "em_andamento", "concluido"];

// Como cada prioridade aparece escrita no historico.
const ROTULOS_PRIORIDADE: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function exigirAgente(ator: Ator): void {
  if (ator.papel !== "agente") {
    throw new ErroAcessoNegado("Apenas um agente pode executar esta acao.");
  }
}

export class ChamadosService {
  // As DAOs vem por parametro, com um padrao, para dar para trocar por
  // versoes falsas em teste sem precisar de banco.
  constructor(
    private dao: ChamadosDAO = new ChamadosDAO(),
    private comentarios: ComentariosDAO = new ComentariosDAO(),
  ) {}

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
      prazoEm: calcularPrazo(new Date(), prioridade), // regra 6
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
    const atualizado = await this.dao.atualizar(chamado);

    await this.registrarHistorico(
      chamado.id,
      `Chamado assumido por ${ator.id}. Situação: Aberto → Em Andamento.`,
    );
    return atualizado;
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
    const atualizado = await this.dao.atualizar(chamado);

    await this.registrarHistorico(chamado.id, `Chamado concluído por ${ator.id}.`);
    return atualizado;
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
    // Regra 6: o atendimento recomeca, entao o prazo conta a partir de agora.
    chamado.prazoEm = calcularPrazo(new Date(), chamado.prioridade);
    const atualizado = await this.dao.atualizar(chamado);

    await this.registrarHistorico(
      chamado.id,
      `Chamado reaberto por ${ator.id}. Situação: Concluído → Em Andamento.`,
    );
    return atualizado;
  }

  // So vale para chamado "em_andamento" - ou seja, que ja tem dono. Isso
  // preserva a maquina de estados: um chamado "aberto" ganha agente
  // ASSUMINDO, e um "concluido" nao troca de dono.
  //
  // Ainda nao conferimos se o id recebido e de um agente cadastrado.
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
    const anterior = chamado.agenteId;
    chamado.agenteId = novo;
    const atualizado = await this.dao.atualizar(chamado);

    if (anterior !== novo) {
      await this.registrarHistorico(
        chamado.id,
        `Responsável alterado de ${anterior} para ${novo} por ${ator.id}.`,
      );
    }
    return atualizado;
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
    const anterior = chamado.prioridade;
    chamado.prioridade = prioridadeValida;
    // Regra 6: o prazo acompanha a prioridade, contado desde a abertura.
    chamado.prazoEm = calcularPrazo(chamado.criadoEm, prioridadeValida);
    const atualizado = await this.dao.atualizar(chamado);

    if (anterior !== prioridadeValida) {
      await this.registrarHistorico(
        chamado.id,
        `Prioridade alterada de ${ROTULOS_PRIORIDADE[anterior]} para ` +
          `${ROTULOS_PRIORIDADE[prioridadeValida]} por ${ator.id}.`,
      );
    }
    return atualizado;
  }

  // Regra 5: grava a mudanca no historico, com o autor "Sistema".
  private async registrarHistorico(
    chamadoId: string,
    texto: string,
  ): Promise<void> {
    await this.comentarios.criar({ chamadoId, autor: "Sistema", texto });
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
