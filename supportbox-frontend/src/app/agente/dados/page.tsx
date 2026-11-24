'use client';

 renata
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { listarChamados, obterSessao } from '@/lib/api';
import MoldeCartaoDados from '@/views/agente/MoldeCartaoDados';
import MoldeBarraDados from '@/views/agente/MoldeBarraDados';
import { EsqueletoBloco } from '@/views/compartilhado/Cabecalho';

export default function PaginaPainelDados() {
  const router = useRouter();
  const [chamados, setChamados] = useState<any[]>([]);

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoldeCartaoDados } from "@/views/agente/MoldeCartaoDados";
import { MoldeBarraDados, type FatiaBarra } from "@/views/agente/MoldeBarraDados";
import { lerSessao } from "@/lib/sessao";
import { listarChamados, type ChamadoApi } from "@/lib/api";

export default function PaginaPainelDados() {
  const router = useRouter();
  const [chamados, setChamados] = useState<ChamadoApi[]>([]);
 main
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
 renata
    async function carregarDados() {
      const sessao = obterSessao();
      if (!sessao) {
        router.push('/login');
        return;
      }

      try {
        setCarregando(true);
        const lista = await listarChamados(sessao);
        setChamados(lista || []);
      } catch (err: any) {
        setErro(err?.message || 'Erro ao carregar os indicadores do painel.');
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();

    const s = lerSessao();
    if (!s) {
      router.replace("/login?expirou=1");
      return;
    }
    listarChamados(s)
      .then(({ itens }) => setChamados(itens))
      .catch(() => setErro("Falha ao carregar os chamados."))
      .finally(() => setCarregando(false));
 main
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

  // Distribuição por prioridade.
  const fatiasPrioridade: FatiaBarra[] = [
    {
      rotulo: "Baixa",
      valor: chamados.filter((c) => c.prioridade === "baixa").length,
      corBg: "bg-slate-300",
    },
    {
      rotulo: "Média",
      valor: chamados.filter((c) => c.prioridade === "media").length,
      corBg: "bg-marca",
    },
    {
      rotulo: "Alta",
      valor: chamados.filter((c) => c.prioridade === "alta").length,
      corBg: "bg-red-500",
    },
  ];

  // Distribuição por situação.
  const fatiasStatus: FatiaBarra[] = [
    {
      rotulo: "Aberto",
      valor: chamados.filter((c) => c.status === "aberto").length,
      corBg: "bg-marca",
    },
    {
      rotulo: "Em Andamento",
      valor: chamados.filter((c) => c.status === "em_andamento").length,
      corBg: "bg-destaque",
    },
    {
      rotulo: "Concluído",
      valor: chamados.filter((c) => c.status === "concluido").length,
      corBg: "bg-emerald-500",
    },
  ];

  // Tempo médio de atendimento, calculado a partir dos chamados concluídos.
  const chamadosConcluidos = chamados.filter(
    (c) => c.status === "concluido" && c.concluidoEm,
  );

  let tempoMedio: string | number = "-";
  if (chamadosConcluidos.length > 0) {
    const somaHoras = chamadosConcluidos.reduce((soma, c) => {
      const horas =
        (new Date(c.concluidoEm!).getTime() - new Date(c.criadoEm).getTime()) /
        (1000 * 60 * 60);
      return soma + Math.max(horas, 0);
    }, 0);
    tempoMedio = `${Math.round(somaHoras / chamadosConcluidos.length)}h`;
  }

  if (carregando) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-tintaFraca animate-pulse">
          Carregando painel de dados...
        </p>
      </div>
    );
  }

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

 renata
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MoldeCartaoDados rotulo="Requisições" valor={requisicoes} />
        <MoldeCartaoDados rotulo="Incidentes" valor={incidentes} />
        <MoldeCartaoDados rotulo="Sem Agente" valor={semAgente} />
        <MoldeCartaoDados rotulo="Tempo Médio" valor={tempoMedio} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MoldeBarraDados
          titulo="Distribuição por Prioridade"
          fatias={fatiasPrioridade}
        />
        <MoldeBarraDados
          titulo="Distribuição por Situação"
          fatias={fatiasStatus}
        />
      </div>
 main
    </div>
  );
}
