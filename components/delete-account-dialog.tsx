"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface DeleteAccountDialogProps {
  accountId: string
  children: React.ReactNode
}

export function DeleteAccountDialog({ accountId, children }: DeleteAccountDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSoftDelete = async () => {
    setLoading(true)
    const supabase = createClient()

    // En lugar de .delete(), usamos .update() para marcar la cuenta como eliminada.
    const { error } = await supabase
      .from("accounts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", accountId)

    setLoading(false)

    if (!error) {
      toast({
        title: "Cuenta Archivada",
        description: "La cuenta ha sido movida al archivo y ya no será visible en el panel principal.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: "No se pudo archivar la cuenta.",
        variant: "destructive",
      })
      console.error("Error soft-deleting account:", error)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Archivar esta cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción ocultará la cuenta del panel principal, pero **no eliminará** su historial financiero (pagos y gastos). Podrás seguir viendo sus datos en los reportes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSoftDelete} disabled={loading}>
            {loading ? "Archivando..." : "Sí, Archivar Cuenta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
