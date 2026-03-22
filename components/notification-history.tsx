"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client" // Importa el cliente de Supabase

interface NotificationHistoryItem {
  id: string
  notification_type: string
  sent_at: string
  status: string
  error_message: string | null
  accounts: {
    customers: {
      name: string
      phone: string
    } | null // El cliente ahora puede ser null
    streaming_services: {
      name: string
    }
  } | null // La cuenta también podría ser null si se borró
}

export function NotificationHistory() {
  const [history, setHistory] = useState<NotificationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = createClient()
      // La llamada a la API no es necesaria, podemos hacerlo directo
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          notification_type,
          sent_at,
          status,
          error_message,
          accounts (
            streaming_services (name),
            customers (name, phone)
          )
        `)
        .order("sent_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("[v0] Error fetching history:", error)
      } else {
        setHistory(data as NotificationHistoryItem[])
      }
      setLoading(false)
    }

    fetchHistory()
  }, [])

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "5_days": return "5 días antes"
      case "3_days": return "3 días antes"
      case "1_day": return "1 día antes"
      case "expired": return "Cuenta vencida"
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Cargando historial...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Notificaciones
        </CardTitle>
        <CardDescription>Registro de las últimas notificaciones enviadas</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay notificaciones en el historial</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-start justify-between border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  {item.status === "sent" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {/* CORRECCIÓN AQUÍ: Usamos optional chaining y un fallback */}
                      {item.accounts?.customers?.name || <span className="italic text-muted-foreground">Usuario de cuenta</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.accounts?.streaming_services?.name || 'Servicio eliminado'} • {item.accounts?.customers?.phone || 'Sin teléfono'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.sent_at)}</p>
                    {item.error_message && <p className="text-xs text-red-600">Error: {item.error_message}</p>}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {getNotificationTypeLabel(item.notification_type)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
