"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/views/compartilhado/Botao";
import { CampoTexto } from "@/views/compartilhado/CampoTexto";
import ResultadoRelatorio from "@/views/agente/ResultadoRelatorio";
import { lerSessao } from "@/lib/sessao";
import { obterRelatorio, type RelatorioApi } from "@/lib/api";

export default function PaginaRelatorios() {
  const router = useRouter();
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioApi | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Ao abrir a página: confere a sessão, igual às outras páginas do agente.
  useEffect(() => {
    const s = lerSessao();
    if (!s) {
      router.replace("/login");
    }
  }, [router]);

  // Busca o relatório do período escolhido e guarda o resultado.
  async function extrair() {
    const sessao = lerSessao();
    if (!sessao) {
      router.replace("/login");
      return;
    }

    setCarregando(true);
    setErro(null);
    try {
      const dados = await obterRelatorio(sessao, de, ate);
      setRelatorio(dados);
    } catch {
      setErro("Falha ao extrair o relatório.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-tinta">Relatórios</h1>
        <p className="text-sm text-tintaFraca">
          Números de atendimento de um período.
        </p>
      </div>

      {erro && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {erro}
        </p>
      )}

      <div className="flex items-end gap-3">
        <CampoTexto
          rotulo="De"
          type="date"
          value={de}
          onChange={(e) => setDe(e.target.value)}
        />
        <CampoTexto
          rotulo="Até"
          type="date"
          min={de}
          value={ate}
          onChange={(e) => setAte(e.target.value)}
        />
        <Botao onClick={extrair} disabled={!de || !ate || carregando}>
          {carregando ? "Extraindo..." : "Extrair"}
        </Botao>
      </div>

      {relatorio && <ResultadoRelatorio dados={relatorio} />}
    </div>
  );
}
