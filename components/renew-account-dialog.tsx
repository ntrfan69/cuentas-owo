"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Account } from "@/lib/types"
import { formatDate } from "@/lib/utils/date-utils"

interface RenewAccountDialogProps {
  account: Account
  children: React.ReactNode
}

export function RenewAccountDialog({ account, children }: RenewAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newCost, setNewCost] = useState(account.total_cost || 0)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setNewCost(account.total_cost || 0);
    }
  }, [open, account.total_cost]);

  const handleRenew = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Al actualizar la 'expiration_date', el trigger de la BD se encarga
    // de reiniciar el 'payment_status' de los usuarios.
    const { error } = await supabase
      .from("accounts")
      .update({
        start_date: account.expiration_date,
        duration_days: account.duration_days,
        status: 'active',
        total_cost: newCost
      })
      .eq("id", account.id)

    setLoading(false)

    if (!error) {
      toast({ title: "¡Cuenta Renovada!", description: `La cuenta de ${account.streaming_services?.name} ha sido extendida.` })
      setOpen(false)
      router.refresh()
    } else {
      toast({ title: "Error", description: "No se pudo renovar la cuenta.", variant: "destructive" })
      console.error("Error renewing account:", error);
    }
  }

  const currentExpirationDate = new Date(account.expiration_date);
  const newStartDate = new Date(currentExpirationDate.getTime()); 
  const newExpirationDate = new Date(newStartDate.setDate(newStartDate.getDate() + account.duration_days));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar {account.streaming_services?.name}</DialogTitle>
          <DialogDescription>
            Extiende la suscripción y define el costo para el nuevo ciclo. Todos los usuarios pasarán a "pago pendiente".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="text-sm space-y-1">
                <p>Vencimiento actual: <span className="font-semibold">{formatDate(account.expiration_date)}</span></p>
                <p>Nuevo vencimiento: <span className="font-semibold">{formatDate(newExpirationDate.toISOString())}</span></p>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="new_cost">Nuevo Costo Total de la Cuenta</Label>
                <Input id="new_cost" type="number" step="1" value={newCost} onChange={(e) => setNewCost(Number(e.target.value))} />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleRenew} disabled={loading}>
            {loading ? "Renovando..." : "Confirmar Renovación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
