import React from 'react';

export interface PropsMoldeCartaoDados {
  titulo: string;
  valor: string | number;
  icone?: React.ReactNode;
  subtitulo?: string;
  destaquePerigo?: boolean;
}

export default function MoldeCartaoDados({
  titulo,
  valor,
  icone,
  subtitulo,
  destaquePerigo = false,
}: PropsMoldeCartaoDados) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all duration-150 flex flex-col justify-between gap-3 ${
        destaquePerigo
          ? 'bg-perigo-fundo border-perigo-borda'
          : 'bg-superficie border-borda'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            destaquePerigo ? 'text-perigo' : 'text-textoSuave'
          }`}
        >
          {titulo}
        </span>

        {icone && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              destaquePerigo
                ? 'bg-perigo/10 text-perigo'
                : 'bg-slate-100 text-textoSuave'
            }`}
          >
            {icone}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span
          className={`text-3xl font-bold tracking-tight ${
            destaquePerigo ? 'text-perigo' : 'text-texto'
          }`}
        >
          {valor}
        </span>

        {subtitulo && (
          <span
            className={`text-xs ${
              destaquePerigo ? 'text-perigo/80' : 'text-textoSuave'
            }`}
          >
            {subtitulo}
          </span>
        )}
      </div>
    </div>
  );
}
