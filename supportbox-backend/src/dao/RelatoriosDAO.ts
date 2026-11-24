// Persistencia do relatorio de atendimentos. So calcula agregados em cima
// da tabela chamados - nao decide como o relatorio e exibido (isso e do
// Service/Controller) nem formata nada para o usuario final.
//
// Todos os metodos sao assincronos, porque falar com o banco leva tempo.

import { consultar } from "../db";
import {AtendimentoPorAgente, DadosRelatorio, TotalPorCategoria} from "../dominio";

const TABELA = "chamados";


export class RelatoriosDAO {
  // Monta o relatorio inteiro do periodo [dataInicio, dataFim]. Cada bloco
  // e uma consulta separada porque cada uma agrega por uma coluna de data
  // diferente (criado_em num caso, concluido_em noutro) - forcar tudo numa
  // unica query so complicaria o SQL sem ganhar performance.
  async gerarRelatorioAtendimentos(
    dataInicio: Date,
    dataFim: Date,
  ): Promise<DadosRelatorio> {
    const [totalAbertos, concluidos, porAtendente, porCategoria] =
      await Promise.all([
        this.contarAbertos(dataInicio, dataFim),
        this.contarConcluidosComMedia(dataInicio, dataFim),
        this.agruparPorAtendente(dataInicio, dataFim),
        this.agruparPorCategoria(dataInicio, dataFim),
      ]);

    return {
      totalCriados: totalAbertos,
      totalConcluidos: concluidos.total,
      tempoMedioHoras: concluidos.mediaHoras,
      porAtendente,
      porCategoria,
    };
  }

  // "Abertos no periodo" conta pela data de CRIACAO, nao pelo status atual:
  // um chamado criado no periodo entra aqui mesmo que ja tenha sido
  // concluido depois.
  //
  // O `::int` nao e enfeite: sem ele a biblioteca `pg` devolve a contagem
  // como TEXTO (COUNT retorna bigint).
  private async contarAbertos(inicio: Date, fim: Date): Promise<number> {
    const linhas = await consultar<{ total: number }>(
      `SELECT COUNT(*)::int AS total
         FROM ${TABELA}
        WHERE criado_em >=$1 AND criado_em <$2`,
      [inicio, fim],
    );

    return linhas[0].total;
  }

  // "Concluidos no periodo" conta pela data de CONCLUSAO. A media de horas
  // usa so essas linhas, como pedido: "so dos concluidos". AVG de uma
  // coluna double precision não volta como numero (semelhante ao bigint do
  // COUNT), entao precisa de cast (::float).
  private async contarConcluidosComMedia(
    inicio: Date,
    fim: Date,
  ): Promise<{ total: number; mediaHoras: number }> {
    const linhas = await consultar<{
      total: number;
      media_horas: number;
    }>(
      `SELECT COUNT(*)::int AS total,
              COALESCE(AVG(EXTRACT(EPOCH FROM (concluido_em - criado_em)) / 3600), 0)::float AS media_horas
         FROM ${TABELA}
        WHERE concluido_em >=$1 AND concluido_em <$2`,
      [inicio, fim],
    );

    return {
      total: linhas[0].total,
      mediaHoras: linhas[0].media_horas,
    };
  }

  // Agrupa os concluidos do periodo por quem atendeu. Linhas com
  // agente_id nulo sao ignoradas: agrupar por NULL nao identifica
  // ninguem e so poluiria o relatorio.
  private async agruparPorAtendente(
    inicio: Date,
    fim: Date,
  ): Promise<AtendimentoPorAgente[]> {
    const linhas = await consultar<{
      agente_id: string;
      total: number;
      media_horas: number;
    }>(
      `SELECT agente_id,
              COUNT(*)::int AS total,
              COALESCE(AVG(EXTRACT(EPOCH FROM (concluido_em - criado_em)) / 3600), 0)::float AS media_horas
         FROM ${TABELA}
        WHERE concluido_em >=$1 AND concluido_em <$2
          AND agente_id IS NOT NULL
        GROUP BY agente_id`,
      [inicio, fim],
    );

    return linhas.map((linha) => ({
      agenteId: linha.agente_id,
      concluidos: linha.total,
      tempoMedioHoras: linha.media_horas,
    }));
  }

  // Contagem por categoria, no mesmo criterio do total de abertos (data de
  // CRIACAO): mostra do que trata a demanda que chegou no periodo.
  private async agruparPorCategoria(
    inicio: Date,
    fim: Date,
  ): Promise<TotalPorCategoria[]> {
    const linhas = await consultar<{ categoria: string; total: number }>(
      `SELECT categoria, COUNT(*)::int AS total
         FROM ${TABELA}
        WHERE criado_em >=$1 AND criado_em <$2
        GROUP BY categoria`,
      [inicio, fim],
    );

    return linhas.map((linha) => ({
      categoria: linha.categoria,
      total: linha.total,
    }));
  }
}
