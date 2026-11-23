'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Send,
  UserCheck,
  CheckCircle2,
  Calendar,
  Tag,
  User,
  Headphones,
} from 'lucide-react';
import Botao from './Botao';
import { CampoAreaTexto } from './Campos';
import Etiqueta from './Etiqueta';
import EtiquetaPrazo from '../agente/EtiquetaPrazo';

export interface ComentarioChamado {
  id: string;
  autor: string;
  texto: string;
  criadoEm: string;
}

export interface ChamadoDetalhado {
  id: string;
  protocolo?: string | number;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  prioridade: string;
  solicitante: string;
  agenteId?: string | null;
  criadoEm: string;
  prazoEm?: string | null;
  comentarios: ComentarioChamado[];
}

export interface PropsModalDetalhesChamado {
  chamado: ChamadoDetalhado | null;
  aberto: boolean;
  aoFechar: () => void;
  aoEnviarComentario?: (chamadoId: string, texto: string) => Promise<void>;
  aoAssumirChamado?: (chamadoId: string) => Promise<void>;
  aoConcluirChamado?: (chamadoId: string) => Promise<void>;
}

export default function ModalDetalhesChamado({
  chamado,
  aberto,
  aoFechar,
  aoEnviarComentario,
  aoAssumirChamado,
  aoConcluirChamado,
}: PropsModalDetalhesChamado) {
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  useEffect(() => {
    function aoPressionarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape' && aberto) {
        aoFechar();
      }
    }
    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [aberto, aoFechar]);

  if (!aberto || !chamado) return null;

  function formatarDataHora(dataIso: string) {
    if (!dataIso) return '-';
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatarCategoria(cat: string) {
    if (!cat) return '-';
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  }

  function obterIniciais(nome: string) {
    const partes = nome.trim().split(' ').filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nome.slice(0, 2).toUpperCase();
  }

  async function lidarComEnvioComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoComentario.trim() || !aoEnviarComentario || !chamado) return;

    try {
      setEnviando(true);
      await aoEnviarComentario(chamado.id, novoComentario.trim());
      setNovoComentario('');
    } finally {
      setEnviando(false);
    }
  }

  async function lidarComAcao(acao?: (id: string) => Promise<void>) {
    if (!acao || !chamado) return;
    try {
      setProcessandoAcao(true);
      await acao(chamado.id);
    } finally {
      setProcessandoAcao(false);
    }
  }

  const protocoloExibicao = chamado.protocolo || chamado.id.slice(0, 6).toUpperCase();
  const estaConcluido = chamado.status === 'concluido';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4 transition-opacity duration-200"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo-chamado"
    >
      <div
        className="bg-superficie border border-borda rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-borda flex items-start justify-between gap-4 bg-superficie">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold text-textoSuave bg-slate-100 px-2 py-0.5 rounded-md border border-borda">
                #{protocoloExibicao}
              </span>
              <Etiqueta tipo="situacao" valor={chamado.status} />
              <Etiqueta tipo="prioridade" valor={chamado.prioridade} />

              {chamado.prazoEm && (
                <EtiquetaPrazo
                  prazoEm={chamado.prazoEm}
                  concluido={estaConcluido}
                />
              )}
            </div>

            <h2
              id="modal-titulo-chamado"
              className="text-lg font-bold text-texto leading-snug"
            >
              {chamado.titulo}
            </h2>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            className="p-1.5 rounded-lg text-textoSuave hover:text-texto hover:bg-slate-100 transition-colors"
            title="Fechar janela (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6 bg-fundo/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-superficie p-4 rounded-xl border border-borda">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-textoSuave">
                <User className="w-3.5 h-3.5" />
                Solicitante
              </span>
              <span className="text-xs font-semibold text-texto truncate">
                {chamado.solicitante}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-textoSuave">
                <Tag className="w-3.5 h-3.5" />
                Categoria
              </span>
              <span className="text-xs font-semibold text-texto">
                {formatarCategoria(chamado.categoria)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-textoSuave">
                <Headphones className="w-3.5 h-3.5" />
                Responsável
              </span>
              <span className="text-xs font-semibold text-texto truncate">
                {chamado.agenteId || 'Não atribuído'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-textoSuave">
                <Calendar className="w-3.5 h-3.5" />
                Aberto em
              </span>
              <span className="text-xs font-semibold text-texto">
                {formatarDataHora(chamado.criadoEm)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-textoSuave">
              Descrição da Solicitação
            </h3>
            <div className="bg-superficie p-4 rounded-xl border border-borda text-sm text-texto leading-relaxed whitespace-pre-line">
              {chamado.descricao}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-textoSuave">
              Histórico e Comentários ({chamado.comentarios.length})
            </h3>

            {chamado.comentarios.length === 0 ? (
              <p className="text-xs text-textoSuave text-center py-6 bg-superficie rounded-xl border border-dashed border-borda">
                Nenhuma interação registrada neste chamado ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-4 py-1">
                {chamado.comentarios.map((item) => {
                  const ehEventoSistema =
                    item.autor?.trim().toLowerCase() === 'sistema';

                  if (ehEventoSistema) {
                    return (
                      <div
                        key={item.id}
                        className="relative flex items-center justify-center my-1"
                      >
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-borda" />
                        </div>

                        <div className="relative z-10 inline-flex items-center gap-1.5 bg-fundo px-3 py-1 rounded-full border border-borda text-xs text-textoSuave">
                          <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.texto}</span>
                          <span className="text-[11px] text-slate-400">
                            • {formatarDataHora(item.criadoEm)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-marca-suave border border-marca-borda text-marca font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {obterIniciais(item.autor)}
                      </div>

                      <div className="flex-1 bg-superficie border border-borda rounded-xl p-3.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-texto">
                            {item.autor}
                          </span>
                          <span className="text-[11px] text-textoSuave">
                            {formatarDataHora(item.criadoEm)}
                          </span>
                        </div>
                        <p className="text-sm text-texto leading-relaxed whitespace-pre-line">
                          {item.texto}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {(aoEnviarComentario || aoAssumirChamado || aoConcluirChamado) && (
          <div className="px-6 py-4 border-t border-borda bg-superficie flex flex-col gap-3">
            {aoEnviarComentario && !estaConcluido && (
              <form
                onSubmit={lidarComEnvioComentario}
                className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2"
              >
                <div className="flex-1">
                  <CampoAreaTexto
                    rows={2}
                    placeholder="Escreva uma atualização ou resposta para este chamado..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                  />
                </div>
                <Botao
                  type="submit"
                  variante="primario"
                  carregando={enviando}
                  disabled={!novoComentario.trim()}
                  icone={<Send className="w-4 h-4" />}
                >
                  Enviar
                </Botao>
              </form>
            )}

            {(aoAssumirChamado || aoConcluirChamado) && !estaConcluido && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-borda">
                {aoAssumirChamado && !chamado.agenteId && (
                  <Botao
                    type="button"
                    variante="secundario"
                    tamanho="sm"
                    carregando={processandoAcao}
                    onClick={() => lidarComAcao(aoAssumirChamado)}
                    icone={<UserCheck className="w-4 h-4" />}
                  >
                    Assumir chamado
                  </Botao>
                )}

                {aoConcluirChamado && (
                  <Botao
                    type="button"
                    variante="primario"
                    tamanho="sm"
                    carregando={processandoAcao}
                    onClick={() => lidarComAcao(aoConcluirChamado)}
                    icone={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Concluir chamado
                  </Botao>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
