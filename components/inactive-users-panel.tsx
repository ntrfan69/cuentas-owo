"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw, AlertTriangle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface InactiveUser {
  id: string
  user_name: string
  user_email: string | null
  user_phone: string | null
  status: "inactive" | "pending_deletion"
  deactivated_at: string
  scheduled_deletion_at: string
  days_until_deletion: number
  customer_name: string
  service_name: string
  account_status: string
  expiration_date: string
}

export function InactiveUsersPanel() {
  const [users, setUsers] = useState<InactiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const loadInactiveUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("user_lifecycle_status")
        .select("*")
        .order("scheduled_deletion_at", { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("[v0] Error loading inactive users:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios inactivos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const runCleanup = async () => {
    setCleaning(true)
    try {
      const response = await fetch("/api/users/cleanup", {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Limpieza completada",
        description: `${result.deleted} usuarios eliminados, ${result.markedForDeletion} marcados para eliminación`,
      })

      await loadInactiveUsers()
    } catch (error) {
      console.error("[v0] Cleanup error:", error)
      toast({
        title: "Error",
        description: "No se pudo ejecutar la limpieza automática",
        variant: "destructive",
      })
    } finally {
      setCleaning(false)
    }
  }

  useEffect(() => {
    loadInactiveUsers()
  }, [])

  const getStatusBadge = (status: string) => {
    if (status === "pending_deletion") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Pendiente de eliminación
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Inactivo
      </Badge>
    )
  }

  const getDaysColor = (days: number) => {
    if (days <= 7) return "text-red-600 font-semibold"
    if (days <= 30) return "text-orange-600 font-semibold"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Inactivos</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Inactivos</CardTitle>
          <CardDescription>No hay usuarios inactivos o pendientes de eliminación</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usuarios Inactivos</CardTitle>
            <CardDescription>
              Usuarios desactivados por vencimiento de cuenta (se eliminan automáticamente después de 2 meses)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadInactiveUsers} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={runCleanup} disabled={cleaning}>
              <Trash2 className="h-4 w-4 mr-2" />
              {cleaning ? "Limpiando..." : "Ejecutar Limpieza"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{user.user_name}</p>
                  {getStatusBadge(user.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.service_name} - {user.customer_name}
                </p>
                {user.user_email && <p className="text-sm text-muted-foreground">{user.user_email}</p>}
              </div>
              <div className="text-right">
                <p className={`text-sm ${getDaysColor(user.days_until_deletion)}`}>
                  {user.days_until_deletion > 0
                    ? `${user.days_until_deletion} días para eliminación`
                    : "Listo para eliminar"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Desactivado: {new Date(user.deactivated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
