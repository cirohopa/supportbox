'use client';

import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  Users,
  Layers,
} from 'lucide-react';
import { RelatorioApi } from '@/lib/api';
import MoldeCartaoDados from './MoldeCartaoDados';
import Botao from '../compartilhado/Botao';
import { EstadoVazio } from '../compartilhado/Cabecalho';

export interface PropsResultadoRelatorio {
  dados: RelatorioApi;
}

export default function ResultadoRelatorio({ dados }: PropsResultadoRelatorio) {
  const tempoMedioGeral =
    dados.totalConcluidos > 0 && dados.tempoMedioHoras > 0
      ? `${Math.round(dados.tempoMedioHoras)}h`
      : '-';

  const atendentesOrdenados = [...dados.porAtendente].sort(
    (a, b) => b.concluidos - a.concluidos
  );

  function formatarCategoria(nome: string) {
    if (!nome) return '';
    return nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
  }

  function aoImprimir() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoldeCartaoDados
          titulo="Criados"
          valor={dados.totalCriados}
          icone={<FileText className="w-4 h-4" />}
          subtitulo="No período selecionado"
        />
        <MoldeCartaoDados
          titulo="Concluídos"
          valor={dados.totalConcluidos}
          icone={<CheckCircle2 className="w-4 h-4" />}
          subtitulo="Chamados finalizados"
        />
        <MoldeCartaoDados
          titulo="Tempo Médio"
          valor={tempoMedioGeral}
          icone={<Clock className="w-4 h-4" />}
          subtitulo="Média para conclusão"
        />
      </div>

      <div className="bg-superficie border border-borda rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-borda flex items-center gap-2">
          <Users className="w-4 h-4 text-marca" />
          <h3 className="text-sm font-bold text-texto">Desempenho por Atendente</h3>
        </div>

        {atendentesOrdenados.length === 0 ? (
          <div className="p-5">
            <EstadoVazio
              titulo="Nenhum atendimento concluído no período"
              descricao="Não houve chamados finalizados por agentes nas datas selecionadas."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-fundo text-xs font-semibold uppercase tracking-wider text-textoSuave border-b border-borda">
                <tr>
                  <th className="py-3 px-5">Atendente</th>
                  <th className="py-3 px-5 text-center">Concluídos</th>
                  <th className="py-3 px-5 text-right">Tempo Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {atendentesOrdenados.map((atendente, idx) => {
                  const tempoIndividual =
                    atendente.concluidos > 0 && atendente.tempoMedioHoras > 0
                      ? `${Math.round(atendente.tempoMedioHoras)}h`
                      : '-';

                  return (
                    <tr
                      key={atendente.agenteId || idx}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-texto">
                        {atendente.agenteId}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sucesso-fundo text-sucesso border border-sucesso-borda">
                          {atendente.concluidos}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-texto">
                        {tempoIndividual}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-superficie border border-borda rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-marca" />
          <h3 className="text-sm font-bold text-texto">Chamados por Categoria</h3>
        </div>

        {dados.porCategoria.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma categoria registrada"
            descricao="Não existem chamados categorizados neste intervalo de datas."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dados.porCategoria.map((item, idx) => (
              <MoldeCartaoDados
                key={item.categoria || idx}
                titulo={formatarCategoria(item.categoria)}
                valor={item.total}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end no-print">
        <Botao
          type="button"
          variante="secundario"
          onClick={aoImprimir}
          icone={<Printer className="w-4 h-4" />}
        >
          Imprimir Relatório
        </Botao>
      </div>
    </div>
  );
}
