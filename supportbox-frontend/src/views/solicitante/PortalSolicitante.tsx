'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle,
  Clock,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';
import Botao from '../compartilhado/Botao';
import {
  CampoTexto,
  CampoSelect,
  CampoAreaTexto,
} from '../compartilhado/Campos';
import Etiqueta from '../compartilhado/Etiqueta';
import {
  EstadoVazio,
  EsqueletoBloco,
  AvisoConfirmacao,
} from '../compartilhado/Cabecalho';

export interface ChamadoSolicitante {
  id: string;
  protocolo?: string | number;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  prioridade: string;
  criadoEm: string;
}

export interface PropsPortalSolicitante {
  chamados: ChamadoSolicitante[];
  carregandoLista?: boolean;
  aoAnalisarComIA?: (dados: {
    titulo: string;
    categoria: string;
    descricao: string;
  }) => Promise<string[]>;
  aoAbrirChamado: (dados: {
    titulo: string;
    categoria: string;
    descricao: string;
  }) => Promise<void>;
  aoSelecionarChamado?: (chamado: ChamadoSolicitante) => void;
}

export default function PortalSolicitante({
  chamados,
  carregandoLista = false,
  aoAnalisarComIA,
  aoAbrirChamado,
  aoSelecionarChamado,
}: PropsPortalSolicitante) {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('hardware');
  const [descricao, setDescricao] = useState('');
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState<string[]>([]);
  const [triagemConcluida, setTriagemConcluida] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [avisoSucesso, setAvisoSucesso] = useState<string | null>(null);

  function exibirAviso(mensagem: string) {
    setAvisoSucesso(mensagem);
    setTimeout(() => setAvisoSucesso(null), 3500);
  }

  function formatarCategoria(cat: string) {
    if (!cat) return '-';
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  }

  async function lidarComFormulario(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      setErroForm('Preencha o assunto e a descrição para continuar.');
      return;
    }

    setErroForm(null);

    if (aoAnalisarComIA && !triagemConcluida) {
      try {
        setAnalisandoIA(true);
        const passos = await aoAnalisarComIA({ titulo, categoria, descricao });
        if (passos && passos.length > 0) {
          setSugestoesIA(passos);
          setTriagemConcluida(true);
          return;
        }
      } catch {
      } finally {
        setAnalisandoIA(false);
      }
    }

    await confirmarEnvioChamado();
  }

  async function confirmarEnvioChamado() {
    try {
      setEnviando(true);
      await aoAbrirChamado({
        titulo: titulo.trim(),
        categoria,
        descricao: descricao.trim(),
      });

      setTitulo('');
      setDescricao('');
      setSugestoesIA([]);
      setTriagemConcluida(false);
      exibirAviso('Chamado aberto com sucesso!');
    } catch (err: any) {
      setErroForm(err?.message || 'Não foi possível abrir o chamado. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function resolverComDicasIA() {
    setTitulo('');
    setDescricao('');
    setSugestoesIA([]);
    setTriagemConcluida(false);
    exibirAviso('Ótimo! Ficamos felizes que as sugestões resolveram.');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-2 text-marca text-xs font-semibold uppercase tracking-wider">
          <LifeBuoy className="w-4 h-4" />
          <span>Portal do Solicitante</span>
        </div>
        <h1 className="text-2xl font-bold text-texto">Como podemos ajudar hoje?</h1>
        <p className="text-sm text-textoSuave">
          Descreva sua solicitação abaixo ou acompanhe o andamento dos seus chamados abertos.
        </p>
      </div>

      <section className="bg-superficie border border-borda rounded-xl shadow-sm p-6 flex flex-col gap-5">
        <div className="border-b border-borda pb-3">
          <h2 className="text-base font-bold text-texto">Abrir Nova Solicitação</h2>
          <p className="text-xs text-textoSuave mt-0.5">
            Quanto mais detalhes você informar, mais rápido nossa equipe consegue atender.
          </p>
        </div>

        <form onSubmit={lidarComFormulario} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <CampoTexto
                rotulo="Assunto da solicitação"
                placeholder="Ex: Monitor secundário não dá vídeo"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (triagemConcluida) setTriagemConcluida(false);
                }}
                required
              />
            </div>

            <CampoSelect
              rotulo="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              opcoes={[
                { valor: 'hardware', label: 'Hardware' },
                { valor: 'software', label: 'Software' },
                { valor: 'rede', label: 'Rede e Internet' },
                { valor: 'acesso', label: 'Acessos e Senhas' },
              ]}
            />
          </div>

          <CampoAreaTexto
            rotulo="Descrição detalhada"
            rows={4}
            placeholder="Explique o que aconteceu, mensagens de erro exibidas e desde quando o problema ocorre..."
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              if (triagemConcluida) setTriagemConcluida(false);
            }}
            erro={erroForm || undefined}
            required
          />

          {sugestoesIA.length > 0 && (
            <div className="bg-marca-suave border border-marca-borda rounded-xl p-5 flex flex-col gap-4 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-marca text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-texto">
                    Sugestões para tentar antes de enviar
                  </h3>
                  <p className="text-xs text-textoSuave mt-0.5">
                    Nossa triagem inteligente identificou passos rápidos que costumam resolver esse problema:
                  </p>
                </div>
              </div>

              <ol className="flex flex-col gap-2.5 pl-1">
                {sugestoesIA.map((passo, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 bg-superficie/90 border border-marca-borda/70 rounded-lg p-3 text-xs text-texto"
                  >
                    <span className="w-5 h-5 rounded-full bg-marca text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{passo}</span>
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <Botao
                  type="button"
                  variante="secundario"
                  tamanho="sm"
                  onClick={resolverComDicasIA}
                  icone={<CheckCircle className="w-4 h-4 text-sucesso" />}
                >
                  Isso resolveu meu problema!
                </Botao>

                <Botao
                  type="button"
                  variante="primario"
                  tamanho="sm"
                  carregando={enviando}
                  onClick={confirmarEnvioChamado}
                  icone={<Send className="w-4 h-4" />}
                >
                  Ainda preciso de ajuda, abrir chamado
                </Botao>
              </div>
            </div>
          )}

          {sugestoesIA.length === 0 && (
            <div className="flex justify-end pt-1">
              <Botao
                type="submit"
                variante="primario"
                carregando={analisandoIA || enviando}
                icone={<Send className="w-4 h-4" />}
              >
                {analisandoIA ? 'Analisando solicitação...' : 'Enviar Solicitação'}
              </Botao>
            </div>
          )}
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-texto">Meus Chamados</h2>
            <p className="text-xs text-textoSuave">
              Clique em um chamado para acompanhar o histórico de respostas.
            </p>
          </div>
          <span className="text-xs font-semibold text-textoSuave bg-superficie border border-borda px-2.5 py-1 rounded-full">
            {chamados.length} {chamados.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {carregandoLista ? (
          <EsqueletoBloco linhas={3} />
        ) : chamados.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum chamado por aqui ainda"
            descricao="Quando você abrir uma solicitação acima, ela aparecerá aqui para acompanhamento."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chamados.map((item) => {
              const protocolo = item.protocolo || item.id.slice(0, 6).toUpperCase();

              return (
                <div
                  key={item.id}
                  onClick={() => aoSelecionarChamado && aoSelecionarChamado(item)}
                  className={`bg-superficie border border-borda rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3 transition-all duration-150 ${
                    aoSelecionarChamado
                      ? 'cursor-pointer hover:border-marca/60 hover:shadow-md'
                      : ''
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-textoSuave bg-slate-100 px-2 py-0.5 rounded">
                        #{protocolo}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Etiqueta tipo="situacao" valor={item.status} />
                        <Etiqueta tipo="prioridade" valor={item.prioridade} />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-texto line-clamp-1">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-textoSuave line-clamp-2 leading-relaxed">
                      {item.descricao}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-borda flex items-center justify-between text-xs text-textoSuave">
                    <span className="font-medium text-texto">
                      {formatarCategoria(item.categoria)}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
                      </span>
                      {aoSelecionarChamado && (
                        <ChevronRight className="w-4 h-4 text-marca" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AvisoConfirmacao mensagem={avisoSucesso} />
    </div>
  );
}
