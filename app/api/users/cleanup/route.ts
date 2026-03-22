import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // First, mark users as pending deletion (7 days before deletion)
    const { data: markedData, error: markError } = await supabase.rpc("mark_users_pending_deletion")

    if (markError) {
      console.error("[v0] Error marking users as pending deletion:", markError)
    }

    // Then, delete users whose time has come
    const { data: deletedData, error: deleteError } = await supabase.rpc("delete_scheduled_users")

    if (deleteError) {
      console.error("[v0] Error deleting scheduled users:", deleteError)
      return NextResponse.json({ error: "Failed to delete scheduled users", details: deleteError }, { status: 500 })
    }

    const markedCount = markedData?.[0]?.marked_count || 0
    const deletedCount = deletedData?.[0]?.deleted_count || 0

    return NextResponse.json({
      success: true,
      markedForDeletion: markedCount,
      deleted: deletedCount,
      message: `Marked ${markedCount} users as pending deletion, deleted ${deletedCount} users`,
    })
  } catch (error) {
    console.error("[v0] User cleanup error:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get users lifecycle status
    const { data, error } = await supabase.from("user_lifecycle_status").select("*")

    if (error) {
      console.error("[v0] Error fetching user lifecycle status:", error)
      return NextResponse.json({ error: "Failed to fetch user lifecycle status", details: error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    console.error("[v0] User lifecycle status error:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
