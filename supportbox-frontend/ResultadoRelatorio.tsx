// src/lib/api.ts

import { requisitar, Sessao } from './api';

export interface AtendimentoApi {
  agenteId: string;
  concluidos: number;
  tempoMedioHoras: number;
}

export interface CategoriaApi {
  categoria: string;
  total: number;
}

export interface RelatorioApi {
  totalCriados: number;
  totalConcluidos: number;
  tempoMedioHoras: number;
  porAtendente: AtendimentoApi[];
  porCategoria: CategoriaApi[];
}

/**
 * Busca o relatório de atendimentos em um determinado período no backend.
 * 
 * @param sessao Sessão do agente autenticado.
 * @param de Data inicial no formato AAAA-MM-DD.
 * @param ate Data final no formato AAAA-MM-DD.
 */
export async function obterRelatorio(
  sessao: Sessao,
  de: string,
  ate: string
): Promise<RelatorioApi> {
  const parametros = new URLSearchParams({ de, ate });
  return requisitar<RelatorioApi>(sessao, `/api/relatorios?${parametros.toString()}`, {
    method: 'GET',
  });
}
