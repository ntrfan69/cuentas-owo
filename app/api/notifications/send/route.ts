import { NextResponse } from "next/server";
import { getAccountsNeedingNotification, markNotificationAsSent } from "@/lib/notifications/notification-service";
import { createTelegramService } from "@/lib/telegram/telegram-service";

export async function POST() {
  try {
    const notificationsToSend = await getAccountsNeedingNotification();

    if (notificationsToSend.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay notificaciones nuevas para enviar.",
      });
    }

    const telegramService = createTelegramService();
    const results = [];

    for (const notification of notificationsToSend) {
      let allUsersNotified = true;

      for (const user of notification.users) {
        try {
          // El campo "phone" del usuario debe contener el Telegram Chat ID
          const chatId = user.phone;

          let message = "";
          if (notification.notificationType === "1_day") {
            message =
              `⚠️ <b>Recordatorio de vencimiento</b>\n\n` +
              `Hola <b>${user.name}</b>, tu cuenta de <b>${notification.serviceName}</b> vence <b>mañana</b>.\n\n` +
              `Renueva a tiempo para no perder el acceso. 🎬`;
          } else if (notification.notificationType === "expired") {
            message =
              `🔴 <b>Cuenta vencida</b>\n\n` +
              `Hola <b>${user.name}</b>, tu cuenta de <b>${notification.serviceName}</b> ha vencido hoy.\n\n` +
              `Contáctanos para renovar. 📲`;
          }

          const result = await telegramService.sendMessage(chatId, message);

          if (!result.success) {
            allUsersNotified = false;
            console.error(`[Telegram] Error enviando a ${user.name} (chatId: ${chatId}): ${result.error}`);
          }

          results.push({
            userName: user.name,
            chatId,
            status: result.success ? "sent" : "failed",
            error: result.error,
          });
        } catch (error) {
          allUsersNotified = false;
          results.push({
            userName: user.name,
            chatId: user.phone,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      if (allUsersNotified) {
        await markNotificationAsSent(notification.accountId, notification.notificationType, "sent");
      } else {
        await markNotificationAsSent(notification.accountId, notification.notificationType, "failed", "Uno o más usuarios no recibieron la notificación.");
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[Telegram] CRITICAL ERROR in /api/notifications/send:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
