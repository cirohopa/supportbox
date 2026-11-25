/**
 * Traducao entre o formato do backend e o formato que as telas usam.
 *
 * O backend fala "minusculo" (status "aberto", prioridade "media",
 * categoria "hardware"), guarda datas em texto ISO e identifica pessoas
 * por id. As telas querem rotulos com inicial maiuscula ("Aberto",
 * "Media", "Hardware"), datas ja formatadas e nomes. Toda essa conversao
 * mora aqui, em um lugar so.
 *
 * Observacao: como ainda nao ha cadastro de usuarios no backend, o "nome"
 * do solicitante / agente e, por enquanto, o proprio id (o e-mail
 * informado na entrada). Quando existir cadastro, basta resolver o nome
 * de verdade aqui dentro.
 */
import type { ChamadoApi, ComentarioApi } from "./api";
import type {
  CategoriaChamado,
  ChamadoDetalhado,
  ChamadoResumo,
  ComentarioVisivel,
  PrioridadeChamado,
  StatusChamado,
} from "@/views/compartilhado/tipos-view";

/** status do backend -> rotulo da tela. */
const STATUS: Record<ChamadoApi["status"], StatusChamado> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
};

/** prioridade do backend -> rotulo da tela. */
const PRIORIDADE: Record<ChamadoApi["prioridade"], PrioridadeChamado> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

/**
 * Caminho inverso da prioridade: rotulo da tela -> valor do backend.
 *
 * Usado quando o agente troca a prioridade na janela de detalhes: a tela
 * conhece "Média", mas o backend so aceita "media". Exemplo:
 * paraPrioridadeApi("Média") devolve "media".
 */
export function paraPrioridadeApi(
  rotulo: PrioridadeChamado,
): ChamadoApi["prioridade"] {
  const par = Object.entries(PRIORIDADE).find(([, r]) => r === rotulo);
  return (par?.[0] ?? "media") as ChamadoApi["prioridade"];
}

/** categoria do backend -> rotulo da tela. */
const CATEGORIA: Record<string, CategoriaChamado> = {
  hardware: "Hardware",
  software: "Software",
  acesso: "Acesso",
  rede: "Rede",
};

/** Formata um instante ISO como "DD/MM/AAAA HH:MM". */
function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** Formata um instante ISO como "DD/MM HH:MM" (usado nos comentarios). */
function formatarDataCurta(iso: string): string {
  const d = new Date(iso);
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** Converte um chamado do backend na versao resumida usada em listas. */
export function paraResumo(c: ChamadoApi): ChamadoResumo {
  return {
    id: c.id,
    protocolo: c.protocolo,
    titulo: c.titulo,
    solicitante: c.solicitanteId,
    categoria: CATEGORIA[c.categoria] ?? "Hardware",
    prioridade: PRIORIDADE[c.prioridade],
    status: STATUS[c.status],
    atribuidoA: c.agenteId ?? undefined,
    criadoEmFormatado: formatarDataHora(c.criadoEm),
    prazoEm: c.prazoEm,
  };
}

/** Converte um comentario do backend na versao exibida na tela. */
export function paraComentario(c: ComentarioApi): ComentarioVisivel {
  return {
    id: c.id,
    autor: c.autor,
    texto: c.texto,
    criadoEm: formatarDataCurta(c.criadoEm),
  };
}

/**
 * Converte um chamado + seus comentarios na versao completa usada na
 * janela de detalhes.
 */
export function paraDetalhado(
  c: ChamadoApi,
  comentarios: ComentarioApi[],
): ChamadoDetalhado {
  return {
    ...paraResumo(c),
    descricao: c.descricao,
    comentarios: comentarios.map(paraComentario),
  };
}
