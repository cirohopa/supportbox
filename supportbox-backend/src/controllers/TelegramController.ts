// Porta de entrada do Telegram. E o equivalente aos Controllers HTTP: nao
// decide regra de negocio nem toca no banco, so traduz uma mensagem de chat
// em chamadas aos Services de sempre.
//
// Roteiro de cada mensagem:
//   1. quem e essa pessoa? (lista do .env) -> se nao souber, avisa e para
//   2. o que ela quer? (AssistenteService pergunta ao Gemini)
//   3. qual chamado? (ChamadosService busca pelo protocolo)
//   4. executa no Service certo e responde no chat
//
// As regras continuam nos Services: so o agente atribuido conclui, so
// chamado "em_andamento" pode ser concluido, e assim por diante. Se um
// Service recusar, a propria mensagem dele vira a resposta do bot.

import type { Ator } from "../dominio";
import {
  enviarMensagem,
  receberMensagens,
  type MensagemTelegram,
} from "../telegram";
import { AssistenteService } from "../services/AssistenteService";
import { ChamadosService } from "../services/ChamadosService";
import { ComentariosService } from "../services/ComentariosService";
import { ErroAcessoNegado, ErroNaoEncontrado, ErroValidacao } from "../erros";

const AJUDA = `Nao entendi. Voce pode escrever assim:

Comentar: comenta no CH-2026-008 que troquei o cabo
Concluir: pode fechar o CH-2026-008, resolvido`;

// Le a lista "numero:email,numero:email" do .env. O numero e o id do
// Telegram, que o proprio Telegram garante - ninguem se passa por outro.
function lerAgentes(): Map<number, string> {
  const agentes = new Map<number, string>();

  for (const par of (process.env.TELEGRAM_AGENTES ?? "").split(",")) {
    const [numero, email] = par.split(":");
    if (numero && email) {
      agentes.set(Number(numero.trim()), email.trim());
    }
  }

  return agentes;
}

export class TelegramController {
  private agentes = lerAgentes();
  private assistente = new AssistenteService();
  private chamados = new ChamadosService();
  private comentarios = new ComentariosService();

  // Laco sem fim: pergunta ao Telegram se ha mensagem nova, trata uma de
  // cada vez, e guarda o updateId da ultima + 1. Sem isso o Telegram
  // reenvia as mesmas mensagens para sempre.
  escutar = async () => {
    let proximo = 0;
    console.log("[telegram] bot escutando");

    while (true) {
      const mensagens = await receberMensagens(proximo);

      for (const mensagem of mensagens) {
        proximo = mensagem.updateId + 1;
        await this.tratar(mensagem);
      }
    }
  };

  private tratar = async (mensagem: MensagemTelegram) => {
    const agenteId = this.agentes.get(mensagem.usuarioId);
    if (!agenteId) {
      return enviarMensagem(
        mensagem.chatId,
        `Nao te conheco. Seu numero no Telegram e ${mensagem.usuarioId}. ` +
          `Peca para cadastrarem.`,
      );
    }

    // Montamos o ator aqui porque a identidade veio do Telegram, e nao dos
    // cabecalhos HTTP. Dali para baixo, e igual a uma acao feita pelo site.
    const ator: Ator = { id: agenteId, papel: "agente" };

    const intencao = await this.assistente.interpretar(mensagem.texto);
    if (intencao.acao === "desconhecida") {
      return enviarMensagem(mensagem.chatId, AJUDA);
    }

    try {
      const chamado = await this.chamados.buscarPorProtocolo(
        intencao.protocolo,
        ator,
      );

      if (intencao.acao === "comentar") {
        await this.comentarios.adicionar(chamado.id, ator, intencao.texto);
        return enviarMensagem(
          mensagem.chatId,
          `Comentario adicionado no ${chamado.protocolo}.`,
        );
      }

      // Concluir: a observacao de fechamento, quando houver, vira comentario
      // antes de encerrar - senao ela se perderia.
      if (intencao.texto.length > 0) {
        await this.comentarios.adicionar(chamado.id, ator, intencao.texto);
      }
      await this.chamados.concluir(chamado.id, ator);

      return enviarMensagem(
        mensagem.chatId,
        `Pronto, ${chamado.protocolo} concluido.`,
      );
    } catch (erro) {
      return enviarMensagem(mensagem.chatId, this.traduzirErro(erro));
    }
  };

  // Mesma ideia do responderErro do utils/http.ts: la o erro de dominio
  // vira um status HTTP, aqui vira uma frase no chat. As mensagens dos
  // Services ja foram escritas para pessoas lerem.
  private traduzirErro(erro: unknown): string {
    if (
      erro instanceof ErroValidacao ||
      erro instanceof ErroAcessoNegado ||
      erro instanceof ErroNaoEncontrado
    ) {
      return erro.message;
    }

    console.error("[telegram] erro inesperado:", erro);
    return "Nao consegui fazer isso agora. Tente pelo site.";
  }
}

// Chamada pelo server.ts quando ha token configurado.
export function iniciarBotTelegram(): void {
  const bot = new TelegramController();
  void bot.escutar();
}
