/**
 * Estrutura comum a todas as páginas dentro de /agente.
 *
 * Coloca a barra lateral fixa à esquerda e abre o restante da tela para o
 * conteúdo da rota filha. O nome exibido na barra e o botao Sair usam a
 * sessao guardada no navegador (`lib/sessao.ts`).
 *
 * O nome e lido dentro de um `useEffect` (e nao direto na renderizacao)
 * porque `localStorage` so existe no navegador; ler na primeira
 * renderizacao quebraria no servidor. A checagem de sessao em si (e o
 * redirecionamento para /login) fica na propria pagina do agente.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuLateralAgente } from "@/views/agente/MenuLateralAgente";
import { lerSessao, limparSessao } from "@/lib/sessao";

export default function LayoutAgente({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [nome, setNome] = useState("");

  // Depois de montar no navegador, le o nome do usuario entrado.
  useEffect(() => {
    const sessao = lerSessao();
    if (sessao) setNome(sessao.nome);
  }, []);

  /** Sair: apaga a sessao e volta para a tela de entrada. */
  const sair = () => {
    limparSessao();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-fundo">
      <MenuLateralAgente nomeUsuario={nome} aoSairClicado={sair} />
      {/*
        A área principal ocupa o espaço restante e tem rolagem própria.
        Assim a barra lateral permanece fixa enquanto o conteúdo rola.
      */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
