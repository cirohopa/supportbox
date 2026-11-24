import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PropsBotao extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'fantasma' | 'perigo';
  tamanho?: 'sm' | 'md' | 'lg';
  carregando?: boolean;
  icone?: React.ReactNode;
  larguraTotal?: boolean;
}

export function Botao({
  children,
  variante = 'primario',
  tamanho = 'md',
  carregando = false,
  icone,
  larguraTotal = false,
  disabled,
  className = '',
  ...props
}: PropsBotao) {
  const estilosBase =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const estilosVariante = {
    primario:
      'bg-marca text-white hover:bg-marca-hover focus:ring-marca shadow-sm',
    secundario:
      'bg-superficie text-texto border border-borda hover:bg-slate-50 focus:ring-slate-400 shadow-sm',
    fantasma:
      'bg-transparent text-textoSuave hover:text-texto hover:bg-slate-100 focus:ring-slate-300',
    perigo:
      'bg-perigo text-white hover:bg-red-700 focus:ring-perigo shadow-sm',
  };

  const estilosTamanho = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  return (
    <button
      disabled={disabled || carregando}
      className={`${estilosBase} ${estilosVariante[variante]} ${estilosTamanho[tamanho]} ${
        larguraTotal ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {carregando ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icone && <span className="shrink-0">{icone}</span>
      )}
      {/* inline-flex: ícones passados junto com o texto ficam na mesma linha */}
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

export default Botao;
