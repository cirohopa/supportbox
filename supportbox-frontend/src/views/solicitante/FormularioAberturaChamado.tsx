/**
 * Formulário de abertura de chamado.
 *
 * Coleta os dados de um novo chamado e devolve esse pacote para quem usa o
 * componente. O formulário não sabe o que fazer com os dados depois: ele só
 * dispara aoEnviar e deixa que a página decida.
 *
 * O botão "Analisar com IA" faz o mesmo: dispara aoAnalisar e mostra o que
 * voltar. Quem fala com o backend é a página, nunca este componente.
 */
"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import Botao from "@/views/compartilhado/Botao";
import { CampoTexto } from "@/views/compartilhado/CampoTexto";
import { CampoTextoArea } from "@/views/compartilhado/CampoTextoArea";
import { CampoSelect } from "@/views/compartilhado/CampoSelect";
import {
  CATEGORIAS_DISPONIVEIS,
  type CategoriaChamado,
  type TipoChamado,
} from "@/views/compartilhado/tipos-view";
import type { TriagemApi } from "@/lib/api";

/**
 * Formato dos dados que o formulário entrega quando é enviado.
 * A prioridade só existe quando o usuário passou pela análise da IA.
 */
export interface DadosNovoChamado {
  titulo: string;
  descricao: string;
  categoria: CategoriaChamado;
  tipo: TipoChamado;
  prioridade?: string;
}

interface PropsFormularioAberturaChamado {
  /** Chamada quando o usuário aperta Enviar com dados válidos. */
  aoEnviar?: (dados: DadosNovoChamado) => void;
  /** Chamada quando o usuário aperta Analisar. Devolve o que a IA disse. */
  aoAnalisar?: (dados: DadosNovoChamado) => Promise<TriagemApi | null>;
}

export function FormularioAberturaChamado({
  aoEnviar,
  aoAnalisar,
}: PropsFormularioAberturaChamado) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [tipo, setTipo] = useState<TipoChamado>("incidente");

  // O que a IA respondeu. Null enquanto ninguém pediu análise.
  const [analise, setAnalise] = useState<TriagemApi | null>(null);
  // Enquanto true, o botão vira "Analisando..." e fica desabilitado.
  const [analisando, setAnalisando] = useState(false);

  const podeEnviar =
    titulo.trim().length > 0 &&
    descricao.trim().length > 0 &&
    CATEGORIAS_DISPONIVEIS.includes(categoria as CategoriaChamado);

  /** Monta o pacote de dados a partir do que está digitado. */
  const dadosAtuais = (): DadosNovoChamado => ({
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    categoria: categoria as CategoriaChamado,
    tipo,
  });

  /** Pede a análise da IA e guarda o resultado para exibir. */
  const analisar = async () => {
    if (!aoAnalisar || !podeEnviar) return;
    setAnalisando(true);
    setAnalise(await aoAnalisar(dadosAtuais()));
    setAnalisando(false);
  };

  /**
   * Envia o chamado. Se houve análise, manda junto a prioridade que a IA
   * sugeriu - é assim que a sugestão chega ao banco.
   */
  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) return;
    aoEnviar?.({ ...dadosAtuais(), prioridade: analise?.prioridade });

    setTitulo("");
    setDescricao("");
    setCategoria("");
    setTipo("incidente");
    setAnalise(null);
  };

  return (
    <form
      onSubmit={submeter}
      className="bg-papel border border-linha rounded-md p-5 space-y-4"
    >
      <div>
        <h2 className="text-base font-semibold text-tinta">Abrir Chamado</h2>
        <p className="text-sm text-tintaFraca">
          Informe abaixo os detalhes do problema ou solicitação.
        </p>
      </div>

      <CampoTexto
        rotulo="Título"
        placeholder="Resumo curto do problema"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
      />

      <CampoTextoArea
        rotulo="Descrição"
        placeholder="Descreva o que aconteceu, com o máximo de detalhe possível."
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={4}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampoSelect
          rotulo="Categoria"
          opcoes={CATEGORIAS_DISPONIVEIS}
          textoPadrao="Selecione..."
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
        />
        <CampoSelect
          rotulo="Tipo"
          opcoes={[
            { valor: "incidente", rotulo: "Incidente" },
            { valor: "solicitacao", rotulo: "Solicitação" },
          ]}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoChamado)}
        />
      </div>

      {/*
        Resultado da triagem. Só aparece depois que o usuário clica em
        Analisar. Quando a IA está fora do ar, mostra um aviso em vez de
        um erro - ele continua podendo abrir o chamado.
      */}
      {analise && (
        <div className="border border-linha rounded-md p-4 bg-fundo space-y-3">
          {analise.disponivel ? (
            <>
              <p className="text-sm font-medium text-tinta">
                Antes de abrir, tente estes passos:
              </p>
              <ol className="space-y-2">
                {analise.passos.map((passo, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-tinta">
                      {i + 1}. {passo.titulo}
                    </span>
                    <p className="text-tintaFraca ml-4">{passo.detalhe}</p>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-tintaFraca border-t border-linha pt-2">
                Prioridade sugerida: <strong>{analise.prioridade}</strong>. Se
                nada resolver, envie o chamado.
              </p>
            </>
          ) : (
            <p className="text-sm text-tintaFraca">
              Não foi possível analisar agora. Você pode enviar o chamado
              normalmente.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Botao
          type="button"
          variante="secundario"
          onClick={analisar}
          disabled={!podeEnviar || analisando}
        >
          <Sparkles className="w-4 h-4" />
          {analisando ? "Analisando..." : "Analisar com IA"}
        </Botao>
        <Botao type="submit" disabled={!podeEnviar}>
          <Send className="w-4 h-4" /> Enviar
        </Botao>
      </div>
    </form>
  );
}
