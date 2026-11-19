"use client";

import { AlertTriangle } from "lucide-react";
import type { StatusChamado } from "@/views/compartilhado/tipos-view";

interface PropsEtiquetaPrazo {
  prazoEm: string | null;
  status: StatusChamado;
}

export function EtiquetaPrazo({ prazoEm, status }: PropsEtiquetaPrazo) {
  if (status === "Concluído" || !prazoEm) return null;

  const prazo = new Date(prazoEm).getTime();
  if (Number.isNaN(prazo)) return null;

  const horasRestantes = (prazo - Date.now()) / (60 * 60 * 1000);
  if (horasRestantes <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        Atrasado
      </span>
    );
  }

  if (horasRestantes > 24) {
    const dias = Math.ceil(horasRestantes / 24);
    return (
      <span className="inline-block rounded border border-linha bg-fundo px-2 py-0.5 text-xs font-medium text-tintaFraca">
        Vence em {dias} {dias === 1 ? "dia" : "dias"}
      </span>
    );
  }

  const horas = Math.ceil(horasRestantes);
  return (
    <span className="inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
      Vence em {horas}h
    </span>
  );
}
