"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Account, Customer, StreamingService } from "@/lib/types"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditAccountDialogProps {
  account: Account
  customers: Customer[] // Se mantiene por si se necesita en el futuro, pero no se usa en el form
  services: StreamingService[]
  children: React.ReactNode
}

export function EditAccountDialog({ account, customers, services, children }: EditAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()
    
    const { error } = await supabase
      .from("accounts")
      .update({
        // El campo customer_id ya no se actualiza desde aquí
        service_id: formData.get("service_id") as string,
        start_date: formData.get("start_date") as string,
        duration_days: Number.parseInt(formData.get("duration_days") as string),
        status: formData.get("status") as string,
        account_email: (formData.get("account_email") as string) || null,
        account_password: (formData.get("account_password") as string) || null,
        account_pin: (formData.get("account_pin") as string) || null,
        notes: (formData.get("notes") as string) || null,
      })
      .eq("id", account.id)

    setLoading(false)

    if (!error) {
      setOpen(false)
      router.refresh()
    } else {
      console.error("Error updating account:", error)
      alert("Hubo un error al actualizar la cuenta.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Cuenta</DialogTitle>
            <DialogDescription>Modifica los detalles de la cuenta de streaming.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            {/* --- CAMBIO: SE ELIMINÓ EL SELECTOR DE CLIENTE --- */}

            <div className="grid gap-2">
              <Label htmlFor="service_id">Servicio</Label>
              <Select name="service_id" defaultValue={account.service_id} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <Input id="start_date" name="start_date" type="date" defaultValue={account.start_date} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration_days">Duración (días)</Label>
                <Input id="duration_days" name="duration_days" type="number" min="1" defaultValue={account.duration_days} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select name="status" defaultValue={account.status} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="account_email">Email de la Cuenta</Label>
              <Input id="account_email" name="account_email" defaultValue={account.account_email || ""} placeholder="usuario@ejemplo.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="account_password">Contraseña</Label>
                    <Input id="account_password" name="account_password" defaultValue={account.account_password || ""} placeholder="••••••••" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="account_pin">PIN</Label>
                    <Input id="account_pin" name="account_pin" defaultValue={account.account_pin || ""} placeholder="1234" />
                </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" defaultValue={account.notes || ""} placeholder="Notas adicionales..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
