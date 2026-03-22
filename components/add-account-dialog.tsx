"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { StreamingService, Account } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface AddAccountDialogProps {
  services: StreamingService[]
  children: React.ReactNode
}

export function AddAccountDialog({ services, children }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<StreamingService | null>(null)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [existingAccount, setExistingAccount] = useState<Partial<Account> | null>(null)
  const [formData, setFormData] = useState<FormData | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const currentFormData = new FormData(e.currentTarget)
    const email = currentFormData.get("account_email") as string
    const serviceId = currentFormData.get("service_id") as string

    const { data: account } = await supabase
      .from("accounts")
      .select("id, deleted_at")
      .eq("account_email", email)
      .eq("service_id", serviceId)
      .maybeSingle()

    if (account) {
      if (account.deleted_at) {
        setExistingAccount(account)
        setFormData(currentFormData)
        setShowReactivateDialog(true)
      } else {
        toast({ title: "Cuenta Duplicada", description: "Ya existe una cuenta activa para este servicio con el mismo email.", variant: "destructive" })
      }
    } else {
      await createNewAccount(currentFormData)
    }

    setLoading(false)
  }

  const createNewAccount = async (data: FormData) => {
    const { error } = await supabase.from("accounts").insert({
      service_id: data.get("service_id") as string,
      account_email: data.get("account_email") as string,
      total_cost: Number(data.get("total_cost")),
      user_capacity: Number(data.get("user_capacity")),
      duration_days: Number(data.get("duration_days")),
      start_date: data.get("start_date") as string,
      notes: data.get("notes") as string,
    })

    if (!error) {
      toast({ title: "Éxito", description: "Nueva cuenta creada." })
      setOpen(false)
      router.refresh()
    } else {
      if (error.code === '23505') { 
          toast({ title: "Error", description: "Ya existe una cuenta activa para este servicio con el mismo email.", variant: "destructive" })
      } else {
          toast({ title: "Error", description: "No se pudo crear la cuenta.", variant: "destructive" })
      }
      console.error("Error creating account:", error)
    }
  }

  const handleReactivate = async () => {
    if (!existingAccount || !formData) return;
    setLoading(true);

    const { error: deleteError } = await supabase
        .from("account_users")
        .delete()
        .eq("account_id", existingAccount.id!);

    if (deleteError) {
        toast({ title: "Error", description: "No se pudieron eliminar los usuarios antiguos de la cuenta.", variant: "destructive" });
        setLoading(false);
        setShowReactivateDialog(false);
        return;
    }

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        deleted_at: null,
        service_id: formData.get("service_id") as string,
        total_cost: Number(formData.get("total_cost")),
        user_capacity: Number(formData.get("user_capacity")),
        duration_days: Number(formData.get("duration_days")),
        start_date: formData.get("start_date") as string,
        notes: formData.get("notes") as string,
        status: 'active',
      })
      .eq("id", existingAccount.id!);

    setLoading(false);
    setShowReactivateDialog(false);

    if (!updateError) {
      toast({ title: "Cuenta Reactivada", description: "La cuenta archivada ha sido restaurada y actualizada." });
      setOpen(false);
      router.refresh();
    } else {
      console.error("Error reactivating account:", updateError);
      toast({ title: "Error", description: "No se pudo reactivar la cuenta.", variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>Nueva Cuenta de Streaming</DialogTitle>
              <DialogDescription>Crea o reactiva una cuenta de streaming.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="service_id">Servicio</Label>
                <Select name="service_id" required onValueChange={(value) => {
                    const service = services.find((s) => s.id === value);
                    setSelectedService(service || null);
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_email">Email de la Cuenta</Label>
                <Input id="account_email" name="account_email" type="email" placeholder="ejemplo@servicio.com" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="user_capacity">Capacidad</Label>
                      <Input id="user_capacity" name="user_capacity" type="number" min="1" defaultValue={selectedService?.default_user_capacity || 1} key={selectedService?.id || "default"} required />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="total_cost">Costo Total</Label>
                      <Input id="total_cost" name="total_cost" type="number" step="1" min="0" placeholder="10000" required />
                  </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label htmlFor="duration_days">Duración (días)</Label>
                      <Input id="duration_days" name="duration_days" type="number" min="1" defaultValue="30" required />
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="start_date">Fecha de Inicio</Label>
                      <Input id="start_date" name="start_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                  </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea id="notes" name="notes" placeholder="Contraseña, PIN, etc." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Verificando..." : "Crear Cuenta"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cuenta Archivada Encontrada</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existe una cuenta archivada para este servicio con el mismo email. ¿Deseas reactivarla y **eliminar sus usuarios anteriores** para empezar de cero?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivate}>Sí, Reactivar y Limpiar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
