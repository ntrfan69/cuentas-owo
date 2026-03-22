"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Plus, Trash2, UserCheck, Mail, Phone, User, Search } from "lucide-react"
import type { Account, AccountUser, Customer } from "@/lib/types"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AccountUsersDialogProps {
  account: Account
  children?: React.ReactNode
}

export function AccountUsersDialog({ account, children }: AccountUsersDialogProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<AccountUser[]>(account.account_users || [])
  const [newUser, setNewUser] = useState({ user_name: "", user_email: "", user_phone: "", profile_name: "" })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])

  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearchTerm.trim().length < 2) {
        setCustomerResults([])
        return
      }
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .or(`name.ilike.%${customerSearchTerm}%,phone.ilike.%${customerSearchTerm}%`)
        .limit(5)
      
      if (error) console.error("Error searching customers:", error)
      else setCustomerResults(data || [])
    }
    const debounce = setTimeout(() => searchCustomers(), 300)
    return () => clearTimeout(debounce)
  }, [customerSearchTerm, supabase])

  const selectCustomer = (customer: Customer) => {
    setNewUser({
      user_name: customer.name,
      user_phone: customer.phone,
      user_email: customer.email || "",
      profile_name: "",
    })
    setCustomerSearchTerm("")
    setCustomerResults([])
  }

  const loadUsers = async () => {
    const { data } = await supabase.from("account_users").select("*").eq("account_id", account.id).order("created_at")
    setUsers(data || [])
  }

  const handleAddUser = async () => {
    if (!newUser.user_name.trim() || users.length >= account.user_capacity) return;

    setIsLoading(true);
    let customerId = null;

    let existingCustomerQuery = supabase.from('customers').select('id');
    if (newUser.user_phone) {
        existingCustomerQuery = existingCustomerQuery.eq('phone', newUser.user_phone);
    } else if (newUser.user_email) {
        existingCustomerQuery = existingCustomerQuery.eq('email', newUser.user_email);
    } else {
        existingCustomerQuery = existingCustomerQuery.eq('name', newUser.user_name);
    }
    const { data: existingCustomer } = await existingCustomerQuery.maybeSingle();

    if (existingCustomer) {
        customerId = existingCustomer.id;
    } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
            .from('customers')
            .insert({
                name: newUser.user_name,
                phone: newUser.user_phone || '',
                email: newUser.user_email || null,
            })
            .select('id')
            .single();

        if (newCustomerError) {
            alert("Error al crear el nuevo usuario en la lista de contactos.");
            setIsLoading(false);
            return;
        }
        customerId = newCustomer.id;
    }

    const { error: assignError } = await supabase.from("account_users").insert({
      account_id: account.id,
      customer_id: customerId,
      user_name: newUser.user_name,
      user_email: newUser.user_email || null,
      user_phone: newUser.user_phone || null,
      profile_name: newUser.profile_name || null,
      is_primary: users.length === 0,
    });

    if (!assignError) {
      setNewUser({ user_name: "", user_email: "", user_phone: "", profile_name: "" });
      await loadUsers();
      router.refresh();
    } else {
        alert("Error al asignar el usuario a la cuenta.");
        console.error("Error assigning user:", assignError);
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    setIsLoading(true)
    await supabase.from("account_users").delete().eq("id", userId)
    await loadUsers()
    router.refresh()
    setIsLoading(false)
  }

  const handleSetPrimary = async (userId: string) => {
    setIsLoading(true)
    const { error } = await supabase.rpc('set_primary_user', { p_account_id: account.id, p_user_id: userId })
    if (error) {
        alert("Error al establecer como primario.")
        console.error("Error setting primary:", error)
    }
    await loadUsers()
    router.refresh()
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usuarios de la Cuenta - {account.streaming_services?.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">Capacidad: {users.length} de {account.user_capacity} usuarios</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Usuarios Actuales</h3>
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <Card key={user.id}><CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.user_name}</p>
                          {user.is_primary && <Badge variant="default" className="text-xs">Principal</Badge>}
                          <Badge variant={user.payment_status === 'paid' ? 'secondary' : 'destructive'} className="text-xs">{user.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {user.profile_name && <div className="flex items-center gap-1"><User className="h-3 w-3" /> Perfil: {user.profile_name}</div>}
                          {user.user_email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.user_email}</div>}
                          {user.user_phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {user.user_phone}</div>}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {!user.is_primary && <Button variant="ghost" size="icon" onClick={() => handleSetPrimary(user.id)} disabled={isLoading} title="Establecer como principal"><UserCheck className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} disabled={isLoading} title="Eliminar usuario"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No hay usuarios agregados en esta cuenta.</p>}
          </div>

          {users.length < account.user_capacity && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Agregar Nuevo Usuario</h3>
              
              <div className="space-y-2 relative">
                <Label htmlFor="customer-search">Buscar y asignar contacto existente</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="customer-search" placeholder="Buscar por nombre o teléfono..." value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} className="pl-9" />
                </div>
                {customerResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-card border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {customerResults.map(customer => (
                            <div key={customer.id} onClick={() => selectCustomer(customer)} className="p-2 hover:bg-muted cursor-pointer text-sm">
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            </div>
                        ))}
                    </div>
                )}
              </div>

              <div className="relative text-center my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div><span className="relative bg-card px-2 text-xs uppercase text-muted-foreground">O crear nuevo</span></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label htmlFor="user_name">Nombre *</Label><Input id="user_name" value={newUser.user_name} onChange={(e) => setNewUser({ ...newUser, user_name: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="user_phone">Teléfono</Label><Input id="user_phone" value={newUser.user_phone} onChange={(e) => setNewUser({ ...newUser, user_phone: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="user_email">Email</Label><Input id="user_email" type="email" value={newUser.user_email} onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="profile_name">Nombre del Perfil</Label><Input id="profile_name" value={newUser.profile_name} onChange={(e) => setNewUser({ ...newUser, profile_name: e.target.value })} /></div>
              </div>
              <Button onClick={handleAddUser} disabled={isLoading || !newUser.user_name.trim()} className="w-full"><Plus className="h-4 w-4 mr-2" /> Agregar Usuario a la Cuenta</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
