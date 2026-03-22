import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const message = body?.message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat?.id
    const firstName = message.chat?.first_name || "usuario"

    if (!chatId) {
      return NextResponse.json({ ok: true })
    }

    const replyText =
      `👋 ¡Hola ${firstName}!\n\n` +
      `Tu <b>Chat ID</b> es:\n\n` +
      `<code>${chatId}</code>\n\n` +
      `📋 Cópialo y compártelo con el administrador para activar tus notificaciones de vencimiento.`

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ ok: false, error: "Bot token not configured" })
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: "HTML",
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Webhook] Error:", error)
    return NextResponse.json({ ok: false })
  }
}
