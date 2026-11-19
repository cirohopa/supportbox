/**
 * Tela de entrada do sistema, autenticada pelo backend.
 */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormularioLogin } from "@/views/auth/FormularioLogin";
import { salvarSessao } from "@/lib/sessao";
import { entrar, ErroApi } from "@/lib/api";

export default function PaginaLogin() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  useEffect(() => {
    setSessaoExpirada(
      new URLSearchParams(window.location.search).get("expirou") === "1",
    );
  }, []);

  const aoEnviar = async (email: string, senha: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const sessao = await entrar(email, senha);
      salvarSessao(sessao);
      router.replace(sessao.papel === "agente" ? "/agente" : "/solicitante");
    } catch (e) {
      setErro(
        e instanceof ErroApi && e.status === 401
          ? "E-mail ou senha inválidos."
          : e instanceof Error
            ? e.message
            : "Não foi possível entrar.",
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-fundo md:grid-cols-2">
      <section className="flex min-h-[34vh] flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-10 md:min-h-screen md:px-12 md:py-12">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-supportbox.png"
            alt=""
            width={512}
            height={453}
            priority
            className="h-12 w-12 rounded-xl bg-white p-1.5 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">SupportBox</span>
        </div>
        <div className="mt-8 max-w-lg md:mb-12">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-orange-300">
            Central de Serviços de TI
          </p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            Atendimento organizado, do primeiro contato à solução.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Acesse sua conta para acompanhar solicitações e manter o trabalho
            fluindo.
          </p>
        </div>
        <p className="hidden text-xs text-slate-400 md:block">
          SupportBox · Central de Serviços de TI
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 md:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-medium text-marca-forte">Bem-vindo</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-tinta">
              Entre na sua conta
            </h2>
            <p className="mt-2 text-sm text-tintaFraca">
              Use seu e-mail corporativo e sua senha.
            </p>
          </div>
          {sessaoExpirada && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              Sua sessão expirou. Entre novamente.
            </p>
          )}
          <FormularioLogin
            aoEnviar={aoEnviar}
            carregando={carregando}
            erro={erro}
          />
        </div>
      </section>
    </main>
  );
}
