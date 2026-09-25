// Conexao com a API de bots do Telegram, so com fetch (sem biblioteca).
// Fica ao lado do db.ts e do ia.ts: se trocarmos de app de mensagem,
// mexe so aqui.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Sem token o bot nao liga, mas o backend sobe normal (nao lancamos erro).
export const TELEGRAM_ATIVO: boolean = Boolean(TOKEN);

const BASE = `https://api.telegram.org/bot${TOKEN}`;

export type MensagemTelegram = {
  updateId: number;
  chatId: number;
  usuarioId: number;
  texto: string;
};

// Busca mensagens novas (long polling: o Telegram segura a resposta ate
// chegar uma, por ate 30 segundos).
//
// OFFSET: o Telegram continua reenviando uma mensagem ate receber um offset
// MAIOR que o updateId dela. E assim que ele sabe que ja tratamos.
export async function receberMensagens(
  aPartirDe: number,
): Promise<MensagemTelegram[]> {
  try {
    const resposta = await fetch(
      `${BASE}/getUpdates?offset=${aPartirDe}&timeout=30`,
    );
    const corpo: any = await resposta.json();
    if (!corpo.ok) {
      throw new Error(corpo.description ?? "Resposta invalida do Telegram.");
    }

    // Fica so com mensagens de texto, ja no nosso formato.
    return corpo.result
      .filter((u: any) => typeof u.message?.text === "string")
      .map((u: any) => ({
        updateId: u.update_id,
        chatId: u.message.chat.id,
        usuarioId: u.message.from.id,
        texto: u.message.text,
      }));
  } catch (erro) {
    // Uma queda de internet nao pode derrubar o bot.
    console.error("Telegram: falha ao buscar mensagens:", erro);
    return [];
  }
}

export async function enviarMensagem(
  chatId: number,
  texto: string,
): Promise<void> {
  await fetch(`${BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto }),
  });
}