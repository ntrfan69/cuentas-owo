"use client"

import { useState } from "react"
// --- CORRECCIÓN AQUÍ: Se añade DialogDescription a la lista de importación ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Mail, Phone, Calendar, MonitorPlay } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/date-utils"

// Tipo actualizado para los resultados de búsqueda
interface UserSearchResult {
  id: string
  user_name: string
  user_email: string | null
  user_phone: string | null
  profile_name: string | null
  is_primary: boolean
  account: {
    id: string
    status: string
    expiration_date: string
    account_email: string | null
    service: {
      name: string
    }
  }
}

export function UserSearchDialog() {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from("account_users")
      .select(
        `
        *,
        accounts!inner(
          id,
          status,
          expiration_date,
          account_email, 
          streaming_services!inner(name)
        )
      `
      )
      .or(
        `user_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,user_phone.ilike.%${searchTerm}%,profile_name.ilike.%${searchTerm}%`,
      )
      .order("created_at", { ascending: false })

    if (!error && data) {
      const formattedResults = data.map((item: any) => ({
        id: item.id,
        user_name: item.user_name,
        user_email: item.user_email,
        user_phone: item.user_phone,
        profile_name: item.profile_name,
        is_primary: item.is_primary,
        account: {
          id: item.accounts.id,
          status: item.accounts.status,
          expiration_date: item.accounts.expiration_date,
          account_email: item.accounts.account_email,
          service: {
            name: item.accounts.streaming_services.name,
          },
        },
      }))
      setResults(formattedResults)
    } else {
      console.error("Error searching users:", error)
      setResults([])
    }
    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "expired":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Buscar Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buscar Usuario en Cuentas</DialogTitle>
          <DialogDescription>Encuentra a una persona y ve en qué cuentas de streaming está asignada.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre, email o teléfono del usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {results.length === 0 && searchTerm && !isLoading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No se encontraron usuarios</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {results.map((result) => (
              <Card key={result.id}>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{result.user_name}</span>
                          {result.is_primary && <Badge variant="default" className="text-xs">Principal</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {result.profile_name && <span className="text-xs">Perfil: {result.profile_name}</span>}
                          {result.user_email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{result.user_email}</div>}
                          {result.user_phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{result.user_phone}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Asignado a la cuenta:</span>
                        <Badge variant="secondary" className={getStatusColor(result.account.status)}>
                          {result.account.status === "active" ? "Activa" : "Vencida"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground"/>
                            <p className="font-medium">{result.account.account_email || 'Sin email'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <MonitorPlay className="h-4 w-4 text-muted-foreground"/>
                            <p className="font-medium">{result.account.service.name}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">Vence: {formatDate(result.account.expiration_date)}</p>
                        </div>
                      </div>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
