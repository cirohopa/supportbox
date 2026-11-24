renata
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

/**
 * Barra de distribuição proporcional usada no painel de dados do agente.
 *
 * Recebe uma lista de fatias (rótulo, valor e cor) e desenha uma barra
 * horizontal em que cada fatia ocupa a largura proporcional ao seu valor
 * dentro do total, com uma legenda logo abaixo. Quando a soma de todos os
 * valores é zero, a barra é desenhada neutra para evitar dividir por zero.
 */
export interface FatiaBarra {
  /** Nome da fatia, exibido na legenda. */
  rotulo: string;
  /** Valor numérico da fatia (quantidade de chamados). */
  valor: number;
  /** Classe do Tailwind para a cor de fundo da fatia (ex.: "bg-marca"). */
  corBg: string;
}

interface PropsMoldeBarraDados {
  /** Título exibido acima da barra. */
  titulo: string;
  /** Fatias que compõem a distribuição. */
  fatias: FatiaBarra[];
}

export function MoldeBarraDados({ titulo, fatias }: PropsMoldeBarraDados) {
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);

  return (
    <div className="bg-papel border border-linha rounded-md p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-tintaFraca">
        {titulo}
      </p>

      <div className="w-full h-3 bg-fundo rounded-full overflow-hidden flex mt-3">
        {total === 0 ? (
          <div className="w-full h-full bg-linha" title="Sem dados" />
        ) : (
          fatias.map((fatia) =>
            fatia.valor <= 0 ? null : (
              <div
                key={fatia.rotulo}
                className={`h-full ${fatia.corBg}`}
                style={{ width: `${(fatia.valor / total) * 100}%` }}
                title={`${fatia.rotulo}: ${fatia.valor}`}
              />
            ),
          )
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-tintaFraca">
        {fatias.map((fatia) => (
          <span key={fatia.rotulo} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${fatia.corBg}`} />
            {fatia.rotulo}: <strong className="text-tinta">{fatia.valor}</strong>
          </span>
        ))}
 main
      </div>
    </div>
  );
}
