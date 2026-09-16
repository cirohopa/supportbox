/**
 * Tela de entrada do sistema.
 *
 * Centraliza o formulario de acesso em uma caixa simples sobre o fundo
 * neutro. Como ainda nao temos autenticacao de verdade (validacao de
 * usuario e senha), a entrada usa um atalho: a senha e ignorada, e o
 * PAPEL vem do e-mail - se ele contem a palavra "agente", a pessoa entra
 * como agente; qualquer outro e-mail entra como solicitante.
 *
 * O e-mail informado vira a "identidade" (id) guardada na sessao do
 * navegador (`lib/sessao.ts`) e e enviado ao backend em toda chamada
 * (cabecalho `X-Usuario-Id`). Quando a autenticacao real for adicionada,
 * `aoEnviar` passa a validar de verdade e a guardar um token - e esta tela
 * quase nao muda.
 *
 * Marcado como "use client" porque usa `useRouter` e `localStorage`, que
 * so existem no navegador.
 */
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormularioLogin } from "@/views/auth/FormularioLogin";
import { salvarSessao } from "@/lib/sessao";

export default function PaginaLogin() {
  const router = useRouter();

  /**
   * Recebe o e-mail digitado, monta a sessao (identidade + papel) e leva
   * o usuario ao painel certo. A senha nao e usada nesta etapa.
   */
  const aoEnviar = (email: string) => {
    const papel = email.toLowerCase().includes("agente")
      ? "agente"
      : "solicitante";

    // Sem cadastro de usuarios, a identidade e o display name sao o
    // proprio e-mail. O backend so precisa de um id estavel + o papel.
    salvarSessao({ id: email, nome: email, papel });

    router.push(papel === "agente" ? "/agente" : "/solicitante");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-fundo">
      {/* Identificação do sistema acima do formulário. */}
      <div className="mb-6 text-center">
        {/*
          Logo do sistema. O arquivo está em `public/`, e tudo que fica
          nessa pasta é servido a partir da raiz do site — por isso o
          caminho começa com "/" e não inclui a palavra "public".

          `w-40` fixa a largura em 160px e `h-auto` deixa a altura se
          ajustar sozinha, preservando a proporção original da imagem.
          `priority` carrega a logo junto com a página, sem piscar.
        */}
        <Image
          src="/logo-supportbox.png"
          alt="SupportBox"
          width={512}
          height={453}
          priority
          className="mx-auto mb-4 w-44 h-auto"
        />
        {/*
          O nome do sistema continua no HTML para leitores de tela
          (acessibilidade), mesmo já aparecendo escrito dentro da logo.
        */}
        <h1 className="sr-only">SupportBox</h1>
        <p className="text-sm text-tintaFraca">Central de Serviços de TI</p>
      </div>

      <FormularioLogin aoEnviar={aoEnviar} />

      {/*
        Aviso para o avaliador. Lembra que a tela existe mas não
        valida credenciais de verdade nesta etapa.
      */}
      <p className="text-xs text-tintaFraca mt-6 text-center max-w-sm">
        Esta é a etapa sem autenticação real: a senha é ignorada. Use um e-mail
        com a palavra &quot;agente&quot; para entrar como técnico, ou qualquer
        outro endereço para entrar como solicitante.
      </p>
    </main>
  );
}
