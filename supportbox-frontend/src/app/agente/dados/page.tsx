"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoldeCartaoDados } from "@/views/agente/MoldeCartaoDados";
import { MoldeBarraDados, type FatiaBarra } from "@/views/agente/MoldeBarraDados";
import { lerSessao } from "@/lib/sessao";
import { listarChamados, type ChamadoApi } from "@/lib/api";

export default function PaginaPainelDados() {
  const router = useRouter();
  const [chamados, setChamados] = useState<ChamadoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Ao abrir a página: confere a sessão e busca os chamados.
  useEffect(() => {
    const s = lerSessao();
    if (!s) {
      router.replace("/login");
      return;
    }
    listarChamados(s)
      .then(({ itens }) => setChamados(itens))
      .catch(() => setErro("Falha ao carregar os chamados."))
      .finally(() => setCarregando(false));
  }, [router]);

  const requisicoes = chamados.filter((c) => c.tipo === "solicitacao").length;
  const incidentes = chamados.filter((c) => c.tipo === "incidente").length;
  const semAgente = chamados.filter((c) => c.agenteId === null).length;

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
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-tinta">Painel de Dados</h1>
        <p className="text-sm text-tintaFraca">
          Indicadores de volume, prioridade e tempo de atendimento dos chamados.
        </p>
      </div>

      {erro && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {erro}
        </p>
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
    </div>
  );
}
