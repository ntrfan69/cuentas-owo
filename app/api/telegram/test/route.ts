import { NextResponse } from "next/server"
import { createTelegramService } from "@/lib/telegram/telegram-service"

export async function POST(request: Request) {
  try {
    const { chatId, message } = await request.json()

    if (!chatId || !message) {
      return NextResponse.json(
        { success: false, error: "chatId y message son requeridos" },
        { status: 400 }
      )
    }

    const telegramService = createTelegramService()
    const result = await telegramService.sendMessage(chatId, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: "Mensaje de prueba enviado exitosamente",
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("[Telegram] test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al enviar mensaje de prueba",
      },
      { status: 500 }
    )
  }
}
