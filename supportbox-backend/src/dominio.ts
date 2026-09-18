// Os tipos do dominio do SupportBox - o vocabulario que Service e DAO
// compartilham. So descreve a FORMA dos dados: sem regra de negocio (isso e
// do Service) e sem acesso a banco (isso e da DAO).
//
// Os valores de texto aqui sao os mesmos aceitos pelos CHECK do banco
// (banco/schema.sql) e pelo frontend. Mudar um lado exige mudar os outros.

export type Papel = "solicitante" | "agente";

// Ordem permitida: aberto -> em_andamento -> concluido (regra 1).
export type StatusChamado = "aberto" | "em_andamento" | "concluido";

export type Prioridade = "baixa" | "media" | "alta";

// Quem esta executando a acao. Hoje vem dos cabecalhos X-Usuario-*.
export type Ator = {
  id: string;
  papel: Papel;
};

export type Chamado = {
  id: string;
  protocolo: string; // formato CH-AAAA-NNN, imutavel (regra 4)
  titulo: string;
  descricao: string;
  categoria: string; // hardware | software | acesso | rede
  tipo: string; // incidente | solicitacao
  status: StatusChamado;
  prioridade: Prioridade;
  solicitanteId: string;
  agenteId: string | null; // null enquanto o chamado esta "aberto"
  criadoEm: Date;
  concluidoEm: Date | null; // base para o prazo de 7 dias da regra 7
};

// Comentarios sao IMUTAVEIS (regra 5) - por isso nao existe "editadoEm".
export type Comentario = {
  id: string;
  chamadoId: string;
  autor: string; // id do usuario, ou "Sistema" nos automaticos
  texto: string;
  criadoEm: Date;
};

// Um atendente dentro do relatorio: quantos chamados concluiu no periodo
// e quanto tempo levou, em media.
export type AtendimentoPorAgente = {
  agenteId: string; // o agente é identificado pelo e-mail digitado no login. Ainda não existe tabela de usuários.
  concluidos: number;
  tempoMedioHoras: number;
};

// Os numeros de um relatorio de atendimentos. E o que a RelatoriosDAO
// devolve para o RelatoriosService.
export type DadosRelatorio = {
  totalCriados: number;
  totalConcluidos: number;
  tempoMedioHoras: number;
  porAtendente: AtendimentoPorAgente[];
  porCategoria: TotalPorCategoria[];
};

export type TotalPorCategoria = {
  categoria: string;
  total: number;
};