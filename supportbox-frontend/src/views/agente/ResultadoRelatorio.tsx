'use client';

import React from 'react';
import { RelatorioApi } from '@/lib/api';
import { MoldeCartaoDados } from '@/views/agente/MoldeCartaoDados';

export interface PropsResultadoRelatorio {
  dados: RelatorioApi;
}

export default function ResultadoRelatorio({ dados }: PropsResultadoRelatorio) {
  // Trata tempo médio geral: exibe traço '-' se totalConcluidos ou tempoMedioHoras for 0
  const tempoMedioGeral =
    dados.totalConcluidos > 0 && dados.tempoMedioHoras > 0
      ? `${Math.round(dados.tempoMedioHoras)}h`
      : '-';

  // Ordenação dos atendentes: de quem mais concluiu para quem menos concluiu
  const atendentesOrdenados = [...dados.porAtendente].sort(
    (a, b) => b.concluidos - a.concluidos
  );

  // Formata o nome da categoria tornando a primeira letra maiúscula
  function formatarCategoria(nome: string) {
    if (!nome) return '';
    return nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
  }

  // Ação para acionar a caixa de diálogo de impressão nativa
  function aoImprimir() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 1. TOTAIS: Cartões de Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoldeCartaoDados rotulo="Criados" valor={dados.totalCriados} />
        <MoldeCartaoDados rotulo="Concluídos" valor={dados.totalConcluidos} />
        <MoldeCartaoDados rotulo="Tempo médio" valor={tempoMedioGeral} />
      </div>

      {/* 2. POR ATENDENTE: Tabela de Desempenho */}
      <div className="bg-fundoCard p-4 rounded-lg border border-borda shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-tinta uppercase tracking-wide">
          Por Atendente
        </h3>

        {atendentesOrdenados.length === 0 ? (
          <p className="text-xs text-tintaFraca py-2">
            Nenhum atendimento concluído no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-tintaFraca border-b border-borda">
                <tr>
                  <th className="py-2 px-3">Atendente</th>
                  <th className="py-2 px-3 text-center">Concluídos</th>
                  <th className="py-2 px-3 text-right">Tempo médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {atendentesOrdenados.map((atendente, index) => {
                  const tempoAtendente =
                    atendente.concluidos > 0 && atendente.tempoMedioHoras > 0
                      ? `${Math.round(atendente.tempoMedioHoras)}h`
                      : '-';

                  return (
                    <tr
                      key={atendente.agenteId || index}
                      className="hover:bg-fundo transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-tinta">
                        {atendente.agenteId}
                      </td>
                      <td className="py-2.5 px-3 text-center text-tinta">
                        {atendente.concluidos}
                      </td>
                      <td className="py-2.5 px-3 text-right text-tinta font-medium">
                        {tempoAtendente}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. POR CATEGORIA: Cartões por Categoria */}
      <div className="bg-fundoCard p-4 rounded-lg border border-borda shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-tinta uppercase tracking-wide">
          Por Categoria
        </h3>

        {dados.porCategoria.length === 0 ? (
          <p className="text-xs text-tintaFraca py-2">
            Nenhuma categoria registrada.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dados.porCategoria.map((item, index) => (
              <MoldeCartaoDados
                key={item.categoria || index}
                rotulo={formatarCategoria(item.categoria)}
                valor={item.total}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. AÇÃO: Botão de Impressão */}
      <div className="flex justify-end print:hidden">
        <button
          type="button"
          onClick={aoImprimir}
          className="bg-fundo border border-borda text-tinta text-sm font-medium px-4 py-2 rounded-md hover:bg-borda transition-all"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}
