// A tabela de rotas: cada linha liga um metodo HTTP + caminho a um metodo
// de Controller. Conecta o app.ts aos Controllers, sem logica de negocio.
//
// Convencoes: prefixo /api em tudo; POST para criar ou acionar, GET para
// ler, PATCH para alterar parte de algo que ja existe.

import { AuthController } from "../controllers/AuthController";
import { ChamadosController } from "../controllers/ChamadosController";
import { ComentariosController } from "../controllers/ComentariosController";
import { TriagemController } from "../controllers/TriagemController";
import type { Manipulador } from "../utils/http";

export type Rota = {
  metodo: string;
  regex: RegExp;
  nomesParametros: string[];
  manipulador: Manipulador;
};

// Transforma "/api/chamados/:id" em uma expressao regular com grupo de
// captura, e guarda os nomes na ordem em que aparecem. O `([^/]+)` casa
// qualquer coisa ate a proxima barra; o `^...$` obriga a casar o caminho
// inteiro, para "/api/chamados" nao casar com "/api/chamados/extra".
function compilar(padrao: string): {
  regex: RegExp;
  nomesParametros: string[];
} {
  const nomes: string[] = [];
  const fonte = padrao.replace(/:(\w+)/g, (_, nome: string) => {
    nomes.push(nome);
    return "([^/]+)";
  });
  return { regex: new RegExp(`^${fonte}$`), nomesParametros: nomes };
}

function rota(metodo: string, padrao: string, manipulador: Manipulador): Rota {
  const { regex, nomesParametros } = compilar(padrao);
  return { metodo, regex, nomesParametros, manipulador };
}

export function listarRotas(): Rota[] {
  // Uma instancia de cada Controller por processo. Como eles nao guardam
  // estado, compartilhar entre todas as requisicoes e seguro.
  const auth = new AuthController();
  const chamados = new ChamadosController();
  const comentarios = new ComentariosController();
  const triagem = new TriagemController();

  return [
    // Autenticacao - ainda respondem 501: nao existe AuthService.
    rota("POST", "/api/auth/login", auth.login),
    rota("POST", "/api/auth/logout", auth.logout),
    rota("GET", "/api/auth/me", auth.me),

    // Triagem - analisa um RASCUNHO, que ainda nao existe no banco.
    rota("POST", "/api/triagem", triagem.analisar),

    // Chamados
    rota("POST", "/api/chamados", chamados.abrir),
    rota("GET", "/api/chamados", chamados.listar),
    rota("GET", "/api/chamados/:id", chamados.detalhar),
    rota("POST", "/api/chamados/:id/assumir", chamados.assumir),
    rota("POST", "/api/chamados/:id/concluir", chamados.concluir),
    rota("POST", "/api/chamados/:id/reabrir", chamados.reabrir),
    rota("PATCH", "/api/chamados/:id/atribuir", chamados.reatribuir),
    rota("PATCH", "/api/chamados/:id/prioridade", chamados.alterarPrioridade),

    // Comentarios sao imutaveis (regra 5): nao ha rota de editar nem apagar.
    rota("POST", "/api/chamados/:idChamado/comentarios", comentarios.adicionar),
    rota("GET", "/api/chamados/:idChamado/comentarios", comentarios.listar),
  ];
}
