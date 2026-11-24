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

// Quem esta executando a acao. No site, vem do token de sessao; no Telegram,
// da agenda de agentes do .env.
export type Ator = {
  id: string;
  papel: Papel;
};

// Uma pessoa cadastrada na tabela usuarios. O e-mail e o que identifica a
// pessoa no resto do sistema: e ele que fica gravado nos chamados.
export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  criadoEm: Date;
};

// O que o login devolve para o frontend. NUNCA inclui a senha.
export type UsuarioPublico = {
  email: string;
  nome: string;
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
  prazoEm: Date | null; // prazo de resolucao (regra 6); null nos antigos
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
  agenteId: string; // o e-mail do agente (o mesmo de Usuario.email)
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