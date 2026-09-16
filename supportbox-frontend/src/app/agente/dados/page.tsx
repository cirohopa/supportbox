"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoldeCartaoDados } from "@/views/agente/MoldeCartaoDados";
import { lerSessao } from "@/lib/sessao";
import { listarChamados, type ChamadoApi } from "@/lib/api";

export default function PaginaPainelDados() {
  const router = useRouter();
  const [chamados, setChamados] = useState<ChamadoApi[]>([]);
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
      .catch(() => setErro("Falha ao carregar os chamados."));
  }, [router]);

  const requisicoes = chamados.filter((c) => c.tipo === "solicitacao").length;
  const incidentes = chamados.filter((c) => c.tipo === "incidente").length;
  const semAgente = chamados.filter((c) => c.agenteId === null).length;

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MoldeCartaoDados rotulo="Requisições" valor={requisicoes} />
        <MoldeCartaoDados rotulo="Incidentes" valor={incidentes} />
        <MoldeCartaoDados rotulo="Sem Agente" valor={semAgente} />
      </div>
    </div>
  );
}
