import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PropsBaseCampo {
  rotulo?: string;
  ajuda?: string;
  erro?: string;
}

export interface PropsCampoTexto
  extends React.InputHTMLAttributes<HTMLInputElement>,
    PropsBaseCampo {}

export function CampoTexto({
  rotulo,
  ajuda,
  erro,
  id,
  className = '',
  ...props
}: PropsCampoTexto) {
  const inputId = id || rotulo?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {rotulo && (
        <label htmlFor={inputId} className="text-xs font-semibold text-texto">
          {rotulo}
        </label>
      )}

      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm bg-superficie text-texto placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2 ${
          erro
            ? 'border-perigo focus:ring-perigo/30'
            : 'border-borda focus:border-marca focus:ring-marca/25'
        } disabled:bg-slate-50 disabled:text-textoSuave ${className}`}
        {...props}
      />

      {erro ? (
        <span className="inline-flex items-center gap-1 text-xs text-perigo font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {erro}
        </span>
      ) : (
        ajuda && <span className="text-xs text-textoSuave">{ajuda}</span>
      )}
    </div>
  );
}

export interface PropsCampoSelect
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    PropsBaseCampo {
  opcoes?: { valor: string; label: string }[];
}

export function CampoSelect({
  rotulo,
  ajuda,
  erro,
  opcoes,
  children,
  id,
  className = '',
  ...props
}: PropsCampoSelect) {
  const selectId = id || rotulo?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {rotulo && (
        <label htmlFor={selectId} className="text-xs font-semibold text-texto">
          {rotulo}
        </label>
      )}

      <select
        id={selectId}
        className={`w-full rounded-lg border px-3 py-2 text-sm bg-superficie text-texto transition-colors duration-150 focus:outline-none focus:ring-2 ${
          erro
            ? 'border-perigo focus:ring-perigo/30'
            : 'border-borda focus:border-marca focus:ring-marca/25'
        } ${className}`}
        {...props}
      >
        {opcoes
          ? opcoes.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.label}
              </option>
            ))
          : children}
      </select>

      {erro ? (
        <span className="inline-flex items-center gap-1 text-xs text-perigo font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {erro}
        </span>
      ) : (
        ajuda && <span className="text-xs text-textoSuave">{ajuda}</span>
      )}
    </div>
  );
}

export interface PropsCampoAreaTexto
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    PropsBaseCampo {}

export function CampoAreaTexto({
  rotulo,
  ajuda,
  erro,
  id,
  className = '',
  ...props
}: PropsCampoAreaTexto) {
  const areaId = id || rotulo?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {rotulo && (
        <label htmlFor={areaId} className="text-xs font-semibold text-texto">
          {rotulo}
        </label>
      )}

      <textarea
        id={areaId}
        className={`w-full rounded-lg border px-3 py-2 text-sm bg-superficie text-texto placeholder:text-slate-400 transition-colors duration-150 focus:outline-none focus:ring-2 ${
          erro
            ? 'border-perigo focus:ring-perigo/30'
            : 'border-borda focus:border-marca focus:ring-marca/25'
        } ${className}`}
        {...props}
      />

      {erro ? (
        <span className="inline-flex items-center gap-1 text-xs text-perigo font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {erro}
        </span>
      ) : (
        ajuda && <span className="text-xs text-textoSuave">{ajuda}</span>
      )}
    </div>
  );
}

export default CampoTexto;
