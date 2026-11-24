/**
 * Etiqueta (pílula) de situação ou de prioridade do chamado.
 *
 * Aceita dois jeitos de uso, para o redesign conviver com as telas que já
 * existiam:
 *
 *   Novo:    <Etiqueta tipo="situacao" valor="em_andamento" />
 *            (a própria etiqueta escolhe a cor e o texto; o valor pode vir
 *            em minúsculo do backend ou já formatado, como "Em Andamento")
 *
 *   Antigo:  <Etiqueta classeCor={corPorStatus(c.status)}>{c.status}</Etiqueta>
 *            (quem chama escolhe a cor pelas funções corPorStatus e
 *            corPorPrioridade, que agora usam a paleta nova)
 */
import React from "react";
import type { PrioridadeChamado, StatusChamado } from "./tipos-view";

interface PropsEtiquetaNova {
  tipo: "situacao" | "prioridade";
  valor: string;
  classeCor?: undefined;
  children?: undefined;
}

interface PropsEtiquetaAntiga {
  classeCor: string;
  children: React.ReactNode;
  tipo?: undefined;
  valor?: undefined;
}

export type PropsEtiqueta = PropsEtiquetaNova | PropsEtiquetaAntiga;

interface Estilo {
  texto: string;
  classe: string;
  ponto: string;
}

const NEUTRO: Estilo = {
  texto: "-",
  classe: "bg-slate-100 text-slate-700 border-slate-200",
  ponto: "bg-slate-400",
};

/** Cores e textos da paleta nova, pela chave normalizada. */
const MAPA_ESTILOS: Record<string, Estilo> = {
  aberto: { texto: "Aberto", classe: "bg-info-fundo text-info border-info-borda", ponto: "bg-info" },
  em_andamento: {
    texto: "Em andamento",
    classe: "bg-atencao-fundo text-atencao border-atencao-borda",
    ponto: "bg-atencao",
  },
  concluido: {
    texto: "Concluído",
    classe: "bg-sucesso-fundo text-sucesso border-sucesso-borda",
    ponto: "bg-sucesso",
  },
  baixa: { texto: "Baixa", classe: "bg-slate-100 text-slate-700 border-slate-200", ponto: "bg-slate-500" },
  media: {
    texto: "Média",
    classe: "bg-atencao-fundo text-atencao border-atencao-borda",
    ponto: "bg-atencao",
  },
  alta: { texto: "Alta", classe: "bg-perigo-fundo text-perigo border-perigo-borda", ponto: "bg-perigo" },
};

/**
 * Transforma "Em Andamento", "em_andamento" ou "Concluído" na mesma chave
 * ("em_andamento", "concluido"): minúsculas, sem acento e com "_" no lugar
 * dos espaços.
 */
function normalizar(valor: string | undefined | null): string {
  return (valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function estiloDe(valor: string | undefined | null): Estilo {
  return MAPA_ESTILOS[normalizar(valor)] ?? { ...NEUTRO, texto: valor || "-" };
}

export function Etiqueta(props: PropsEtiqueta) {
  // Uso antigo: a cor vem pronta de quem chama.
  if (props.classeCor !== undefined) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${props.classeCor}`}
      >
        {props.children}
      </span>
    );
  }

  // Uso novo: a etiqueta escolhe cor e texto pelo valor.
  const config = estiloDe(props.valor);
  return (
    <span
      title={`${props.tipo === "situacao" ? "Situação" : "Prioridade"}: ${config.texto}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classe}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.ponto}`} />
      {config.texto}
    </span>
  );
}

/** Classes da paleta nova para a situação do chamado (uso antigo). */
export function corPorStatus(status: StatusChamado): string {
  return estiloDe(status).classe;
}

/** Classes da paleta nova para a prioridade do chamado (uso antigo). */
export function corPorPrioridade(p: PrioridadeChamado): string {
  return estiloDe(p).classe;
}

export default Etiqueta;
