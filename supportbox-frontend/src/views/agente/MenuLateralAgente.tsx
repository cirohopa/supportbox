/**
 * Barra lateral fixa usada nas páginas do agente.
 *
 * Aparece à esquerda em todas as rotas dentro de /agente. Mostra
 * a identidade do sistema, os atalhos de navegação, a identificação
 * do usuário entrado e o botão de sair. A navegação tem três
 * atalhos: Tickets, Painel de Dados e Relatórios. A estrutura já
 * está pronta para receber outros atalhos quando o sistema crescer.
 *
 * O componente não sabe como o sistema desliga a sessão. Ele só
 * dispara aoSairClicado e deixa a decisão para quem o utiliza.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ChartColumn, FileText, Ticket, LogOut } from "lucide-react";

interface PropsMenuLateralAgente {
  /** Nome do usuário entrado, exibido no rodapé da barra. */
  nomeUsuario: string;
  /** Papel da sessão autenticada. */
  papelUsuario: string;
  /** Função chamada quando o usuário aperta Sair. */
  aoSairClicado?: () => void;
}

export function MenuLateralAgente({
  nomeUsuario,
  papelUsuario,
  aoSairClicado,
}: PropsMenuLateralAgente) {
  // O hook usePathname devolve a rota atual. Usamos para destacar
  // visualmente o atalho que corresponde à página em que o agente
  // está agora.
  const caminho = usePathname();
  const emTickets = caminho === "/agente";
  const emDados = caminho === "/agente/dados";
  const emRelatorios = caminho === "/agente/relatorios";
  const iniciais =
    nomeUsuario
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "AG";

  return (
    <aside className="flex w-full flex-shrink-0 flex-col border-b border-linha bg-papel md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3 border-b border-linha px-5 py-4">
        <Image
          src="/logo-supportbox.png"
          alt=""
          width={512}
          height={453}
          className="h-9 w-auto"
        />
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-tinta">
            SupportBox
          </h1>
          <p className="text-xs text-tintaFraca">Área do agente</p>
        </div>
      </div>

      <nav
        aria-label="Navegação do agente"
        className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible"
      >
        <Link
          href="/agente"
          aria-current={emTickets ? "page" : undefined}
          className={[
            "flex flex-shrink-0 items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors",
            emTickets
              ? "border-marca bg-marca-fraca font-medium text-marca-forte"
              : "border-transparent text-tintaFraca hover:bg-fundo hover:text-tinta",
          ].join(" ")}
        >
          <Ticket className="h-4 w-4" aria-hidden="true" />
          Tickets
        </Link>
        <Link
          href="/agente/dados"
          aria-current={emDados ? "page" : undefined}
          className={[
            "flex flex-shrink-0 items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors",
            emDados
              ? "border-marca bg-marca-fraca font-medium text-marca-forte"
              : "border-transparent text-tintaFraca hover:bg-fundo hover:text-tinta",
          ].join(" ")}
        >
          <ChartColumn className="h-4 w-4" aria-hidden="true" />
          Painel de Dados
        </Link>
        <Link
          href="/agente/relatorios"
          aria-current={emRelatorios ? "page" : undefined}
          className={[
            "flex flex-shrink-0 items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors",
            emRelatorios
              ? "border-marca bg-marca-fraca font-medium text-marca-forte"
              : "border-transparent text-tintaFraca hover:bg-fundo hover:text-tinta",
          ].join(" ")}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Relatórios
        </Link>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-linha p-3 md:block md:space-y-2">
        <div className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 md:border md:border-linha md:bg-fundo md:px-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {iniciais}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-tinta">
              {nomeUsuario || "Carregando usuário..."}
            </p>
            <p className="text-xs text-tintaFraca">{papelUsuario}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={aoSairClicado}
          className="flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-tintaFraca transition-colors hover:bg-fundo hover:text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-marca md:w-full"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  );
}
