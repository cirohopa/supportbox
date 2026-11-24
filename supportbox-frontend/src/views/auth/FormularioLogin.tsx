/**
 * Formulário de entrada do sistema.
 *
 * Apresenta os campos de e-mail e senha em um cartão e
 * dispara aoEnviar com os valores digitados. O formulário não sabe
 * validar o acesso por conta própria. Quem usa o componente recebe
 * os dados e decide o que fazer.
 *
 * A página de entrada trata a autenticação e decide o destino.
 */
"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import Botao from "@/views/compartilhado/Botao";
import { CampoTexto } from "@/views/compartilhado/CampoTexto";

interface PropsFormularioLogin {
  aoEnviar: (email: string, senha: string) => Promise<void>;
  carregando: boolean;
  erro: string | null;
}

export function FormularioLogin({
  aoEnviar,
  carregando,
  erro,
}: PropsFormularioLogin) {
  // Estado interno dos campos.
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // Controla se a senha aparece em texto claro ou em pontos. Ajuda
  // o usuário a conferir o que digitou sem precisar apagar tudo.
  const [mostrarSenha, setMostrarSenha] = useState(false);

  /**
   * Submete o formulário, repassando os valores digitados para a
   * função externa. O e-mail é tratado com trim para evitar
   * espaços acidentais no começo ou no fim.
   */
  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carregando) void aoEnviar(email.trim(), senha);
  };

  return (
    <form
      onSubmit={submeter}
      className="w-full space-y-5 rounded-xl border border-linha bg-papel p-6 shadow-sm sm:p-8"
    >
      <div>
        <h3 className="text-lg font-semibold text-tinta">Acessar o sistema</h3>
      </div>

      <CampoTexto
        rotulo="E-mail"
        type="email"
        placeholder="usuario@empresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      {/*
        Campo de senha junto com o botão para mostrar e esconder.
        O botão fica posicionado de forma absoluta sobre o campo,
        no canto direito, sem entrar na ordem de tabulação para
        não atrapalhar quem usa o teclado.
      */}
      <div className="relative">
        <CampoTexto
          rotulo="Senha"
          type={mostrarSenha ? "text" : "password"}
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setMostrarSenha((m) => !m)}
          className="absolute right-2 top-[34px] rounded p-1 text-tintaFraca transition-colors hover:text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-marca"
          aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={mostrarSenha}
        >
          {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <Botao
        type="submit"
        larguraTotal
        disabled={!email.trim() || !senha.trim() || carregando}
        aria-busy={carregando}
      >
        {carregando ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden="true" /> Entrar
          </>
        )}
      </Botao>
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </form>
  );
}
