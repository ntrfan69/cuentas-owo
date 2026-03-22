import { NextResponse } from "next/server"
import { getNotificationHistory } from "@/lib/notifications/notification-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")

    const history = await getNotificationHistory(accountId || undefined)

    return NextResponse.json({
      success: true,
      count: history.length,
      history,
    })
  } catch (error) {
    console.error("[v0] Error fetching notification history:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch notification history" }, { status: 500 })
  }
}
