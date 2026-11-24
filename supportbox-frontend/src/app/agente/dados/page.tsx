'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { listarChamados, type ChamadoApi } from '@/lib/api';
import { lerSessao } from '@/lib/sessao';
import MoldeCartaoDados from '@/views/agente/MoldeCartaoDados';
import MoldeBarraDados from '@/views/agente/MoldeBarraDados';
import { EsqueletoBloco } from '@/views/compartilhado/Cabecalho';

/**
 * Painel de Dados do agente: indicadores calculados no navegador a partir
 * da lista de chamados que o backend devolve (GET /api/chamados).
 */
export default function PaginaPainelDados() {
  const router = useRouter();
  const [chamados, setChamados] = useState<ChamadoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      // Sem sessão no navegador: volta ao login com o aviso de sessão expirada.
      const sessao = lerSessao();
      if (!sessao) {
        router.replace('/login?expirou=1');
        return;
      }

      try {
        setCarregando(true);
        // A API devolve { itens: [...] }, e não a lista direto.
        const { itens } = await listarChamados(sessao);
        setChamados(itens);
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao carregar os indicadores do painel.');
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [router]);

  const agora = new Date();

  const totalChamados = chamados.length;
  const abertos = chamados.filter((c) => c.status === 'aberto').length;
  const emAndamento = chamados.filter((c) => c.status === 'em_andamento').length;
  const concluidos = chamados.filter((c) => c.status === 'concluido').length;

  const atrasados = chamados.filter((c) => {
    if (c.status === 'concluido' || !c.prazoEm) return false;
    return new Date(c.prazoEm) < agora;
  }).length;

  const baixa = chamados.filter((c) => c.prioridade === 'baixa').length;
  const media = chamados.filter((c) => c.prioridade === 'media').length;
  const alta = chamados.filter((c) => c.prioridade === 'alta').length;

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-texto">Painel de Dados</h1>
        <p className="text-sm text-textoSuave">
          Visão em tempo real do volume de chamados, prazos e prioridades.
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-xl bg-perigo-fundo border border-perigo-borda text-perigo text-sm">
          {erro}
        </div>
      )}

      {carregando ? (
        <EsqueletoBloco linhas={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MoldeCartaoDados
              titulo="Total de Chamados"
              valor={totalChamados}
              icone={<Ticket className="w-4 h-4" />}
              subtitulo="Registrados no sistema"
            />

            <MoldeCartaoDados
              titulo="Em Andamento"
              valor={emAndamento}
              icone={<Clock className="w-4 h-4" />}
              subtitulo={`${abertos} aguardando atendimento`}
            />

            <MoldeCartaoDados
              titulo="Concluídos"
              valor={concluidos}
              icone={<CheckCircle2 className="w-4 h-4" />}
              subtitulo="Finalizados pela equipe"
            />

            <MoldeCartaoDados
              titulo="Atrasados"
              valor={atrasados}
              icone={<AlertTriangle className="w-4 h-4" />}
              subtitulo={
                atrasados > 0
                  ? 'Prazo vencido — atenção imediata'
                  : 'Nenhum chamado em atraso'
              }
              destaquePerigo={atrasados > 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MoldeBarraDados
              titulo="Distribuição por Situação"
              itens={[
                { rotulo: 'Abertos', quantidade: abertos, corClasse: 'bg-info' },
                { rotulo: 'Em andamento', quantidade: emAndamento, corClasse: 'bg-atencao' },
                { rotulo: 'Concluídos', quantidade: concluidos, corClasse: 'bg-sucesso' },
              ]}
            />

            <MoldeBarraDados
              titulo="Distribuição por Prioridade"
              itens={[
                { rotulo: 'Baixa', quantidade: baixa, corClasse: 'bg-slate-500' },
                { rotulo: 'Média', quantidade: media, corClasse: 'bg-atencao' },
                { rotulo: 'Alta', quantidade: alta, corClasse: 'bg-perigo' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
