"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { StreamingService } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"

interface ManageServicesDialogProps {
  services: StreamingService[]
  children: React.ReactNode
}

export function ManageServicesDialog({ services, children }: ManageServicesDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newService, setNewService] = useState("")
  const [userCapacity, setUserCapacity] = useState("1")
  const [price, setPrice] = useState("0.00")
  const router = useRouter()

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newService.trim()) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("streaming_services").insert({
      name: newService.trim(),
      default_user_capacity: Number.parseInt(userCapacity),
      price_per_user: Number.parseFloat(price)
    })

    setLoading(false)

    if (!error) {
      setNewService("")
      setUserCapacity("1")
      setPrice("0.00")
      router.refresh()
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    const supabase = createClient()
    await supabase.from("streaming_services").delete().eq("id", serviceId)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestionar Servicios</DialogTitle>
          <DialogDescription>Agrega o elimina servicios y define sus precios por usuario.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <form onSubmit={handleAddService} className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="service-name">Nombre del servicio</Label>
              <Input
                id="service-name"
                placeholder="Netflix Premium, Spotify Family, etc."
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="user-capacity">Capacidad</Label>
                <Input id="user-capacity" type="number" min="1" value={userCapacity} onChange={(e) => setUserCapacity(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Precio por Usuario</Label>
                <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Servicio
            </Button>
          </form>
          <div className="space-y-2">
            <Label>Servicios Actuales</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Capacidad: {service.default_user_capacity} usuarios | Precio: ${service.price_per_user?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
