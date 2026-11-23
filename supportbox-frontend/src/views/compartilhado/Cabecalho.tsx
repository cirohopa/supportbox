import React from 'react';
import { LogOut, Inbox, CheckCircle2 } from 'lucide-react';
import Botao from './Botao';

export interface PropsCabecalho {
  nomeUsuario?: string;
  emailUsuario?: string;
  perfil?: string;
  aoSair?: () => void;
}

export default function Cabecalho({
  nomeUsuario,
  emailUsuario,
  perfil,
  aoSair,
}: PropsCabecalho) {
  function obterIniciais() {
    const base = nomeUsuario?.trim() || emailUsuario?.trim() || 'U';
    const partes = base.split(' ').filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return base.slice(0, 2).toUpperCase();
  }

  return (
    <header className="w-full bg-superficie border-b border-borda px-6 py-3 flex items-center justify-between no-print">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-marca text-white font-bold flex items-center justify-center text-sm shadow-sm">
          SB
        </div>
        <div>
          <span className="font-bold text-texto text-base tracking-tight">
            SupportBox
          </span>
          {perfil && (
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-textoSuave">
              {perfil}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-marca-suave border border-marca-borda text-marca font-semibold text-xs flex items-center justify-center">
            {obterIniciais()}
          </div>
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-texto leading-tight">
              {nomeUsuario || emailUsuario || 'Usuário'}
            </span>
            {nomeUsuario && emailUsuario && (
              <span className="text-[11px] text-textoSuave leading-tight">
                {emailUsuario}
              </span>
            )}
          </div>
        </div>

        {aoSair && (
          <Botao
            variante="fantasma"
            tamanho="sm"
            onClick={aoSair}
            icone={<LogOut className="w-4 h-4" />}
            title="Sair do sistema"
          >
            <span className="hidden md:inline">Sair</span>
          </Botao>
        )}
      </div>
    </header>
  );
}

export function EstadoVazio({
  titulo = 'Nenhum registro encontrado',
  descricao = 'Não há itens para exibir no momento.',
}: {
  titulo?: string;
  descricao?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed border-borda rounded-xl bg-slate-50/50">
      <div className="w-10 h-10 rounded-full bg-slate-100 text-textoSuave flex items-center justify-center mb-3">
        <Inbox className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-texto">{titulo}</p>
      <p className="text-xs text-textoSuave mt-1 max-w-sm">{descricao}</p>
    </div>
  );
}

export function EsqueletoBloco({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="animate-pulse flex flex-col gap-3 w-full">
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-slate-200/70 rounded-lg w-full"
        />
      ))}
    </div>
  );
}

export function AvisoConfirmacao({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-texto text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg transition-all duration-200">
      <CheckCircle2 className="w-4 h-4 text-sucesso shrink-0" />
      <span>{mensagem}</span>
    </div>
  );
}
