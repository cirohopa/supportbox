import React from 'react';

export interface ItemBarraDados {
  rotulo: string;
  quantidade: number;
  corClasse: string;
}

export interface PropsMoldeBarraDados {
  titulo: string;
  itens: ItemBarraDados[];
}

export default function MoldeBarraDados({ titulo, itens }: PropsMoldeBarraDados) {
  const total = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <div className="bg-superficie border border-borda rounded-xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-texto">{titulo}</h3>
        <span className="text-xs font-medium text-textoSuave">
          Total: {total}
        </span>
      </div>

      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
        {total === 0 ? (
          <div className="w-full h-full bg-slate-200/70" />
        ) : (
          itens.map((item, idx) => {
            const percentual = (item.quantidade / total) * 100;
            if (percentual <= 0) return null;

            return (
              <div
                key={idx}
                style={{ width: `${percentual}%` }}
                className={`${item.corClasse} h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                title={`${item.rotulo}: ${item.quantidade} (${Math.round(percentual)}%)`}
              />
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {itens.map((item, idx) => {
          const percentual = total > 0 ? Math.round((item.quantidade / total) * 100) : 0;

          return (
            <div
              key={idx}
              className="flex items-center justify-between bg-fundo px-3 py-2 rounded-lg border border-borda text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.corClasse}`} />
                <span className="font-medium text-texto">{item.rotulo}</span>
              </div>
              <span className="font-semibold text-textoSuave">
                {item.quantidade} ({percentual}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
