"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Account, AccountUser } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Check, Loader2 } from "lucide-react";

interface RegisterPaymentDialogProps {
  account: Account;
  children: React.ReactNode;
}

export function RegisterPaymentDialog({ account, children }: RegisterPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AccountUser | null>(null);
  const [amount, setAmount] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const handleOpenPaymentModal = (user: AccountUser) => {
    setSelectedUser(user);
    const suggestedPrice = Math.round((account.total_cost || 0) / (account.user_capacity || 1));
    setAmount(suggestedPrice > 0 ? suggestedPrice : 0);
  };

  const handleRegisterPayment = async () => {
    if (!selectedUser) return;

    setLoadingUserId(selectedUser.id);
    const supabase = createClient();

    // --- CORRECCIÓN CLAVE ---
    // Usamos 'selectedUser.customer_id' que es el ID correcto de la tabla 'customers'
    const { error: paymentError } = await supabase.from("payments").insert({
      account_id: account.id,
      user_id: selectedUser.customer_id, 
      amount: amount,
      payment_date: new Date().toISOString().split("T")[0],
    });

    if (paymentError) {
      toast({ title: "Error", description: "No se pudo registrar el pago. Revisa la consola.", variant: "destructive" });
      console.error("Error creating payment:", paymentError);
      setLoadingUserId(null);
      return;
    }

    const { error: userError } = await supabase
      .from("account_users")
      .update({ payment_status: 'paid' })
      .eq('id', selectedUser.id);

    if (userError) {
        toast({ title: "Advertencia", description: "Pago registrado, pero no se pudo actualizar el estado del usuario." });
    } else {
        toast({ title: "¡Pago Registrado!", description: `Pago de ${selectedUser.user_name} registrado por $${amount.toLocaleString('es-CL')}.` });
    }

    setLoadingUserId(null);
    setSelectedUser(null);
    router.refresh(); 
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagos para {account.streaming_services?.name}</DialogTitle>
          <DialogDescription>
            Selecciona un usuario para registrar su pago para el ciclo actual.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
            {(account.account_users && account.account_users.length > 0) ? (
                account.account_users.map(user => (
                    <div key={user.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <p className="font-medium">{user.user_name}</p>
                            <p className="text-sm text-muted-foreground">{user.user_phone || user.user_email}</p>
                        </div>
                        {user.payment_status === 'paid' ? (
                            <Badge variant="secondary"><Check className="h-4 w-4 mr-1"/> Pagado</Badge>
                        ) : (
                            <Button size="sm" onClick={() => handleOpenPaymentModal(user)}>
                                <DollarSign className="h-4 w-4 mr-1"/> Registrar Pago
                            </Button>
                        )}
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground">No hay usuarios en esta cuenta.</p>
            )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar pago de {selectedUser?.user_name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Monto Pagado</Label>
                        <Input id="amount" type="number" step="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                        <p className="text-xs text-muted-foreground">
                            Costo total de la cuenta: **${(account.total_cost || 0).toLocaleString('es-CL')}**
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
                    <Button onClick={handleRegisterPayment} disabled={loadingUserId === selectedUser?.id}>
                        {loadingUserId === selectedUser?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Pago"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
