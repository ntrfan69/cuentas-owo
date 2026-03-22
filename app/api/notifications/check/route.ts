import { NextResponse } from "next/server"
import { getAccountsNeedingNotification } from "@/lib/notifications/notification-service"

export async function GET() {
  try {
    const notifications = await getAccountsNeedingNotification()

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications,
    })
  } catch (error) {
    console.error("[v0] Error checking notifications:", error)
    return NextResponse.json({ success: false, error: "Failed to check notifications" }, { status: 500 })
  }
}
