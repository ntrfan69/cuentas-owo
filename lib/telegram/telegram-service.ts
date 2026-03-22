// Telegram Service - 100% gratis y sin límites de mensajes
// Solo necesitas un TELEGRAM_BOT_TOKEN en tus variables de entorno

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export class TelegramService {
  private botToken: string

  constructor(botToken: string) {
    this.botToken = botToken
  }

  async sendMessage(chatId: string, message: string): Promise<SendMessageResult> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.description || "Telegram API error")
      }

      return { success: true, messageId: data.result?.message_id?.toString() }
    } catch (error) {
      console.error("[Telegram] sendMessage error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export function createTelegramService(): TelegramService {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    throw new Error(
      "No se encontró TELEGRAM_BOT_TOKEN en las variables de entorno.\n" +
        "Crea tu bot con @BotFather en Telegram y agrega el token."
    )
  }

  return new TelegramService(botToken)
}
