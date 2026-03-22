"use client"

import { useState } from "react"
import type { Account, Customer, StreamingService } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditAccountDialog } from "@/components/edit-account-dialog"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { SendNotificationDialog } from "@/components/send-notification-dialog"
import { EmptyState } from "@/components/empty-state"
import { AccountUsersDialog } from "@/components/account-users-dialog"
import { RenewAccountDialog } from "@/components/renew-account-dialog"
import { RegisterPaymentDialog } from "@/components/register-payment-dialog"
import { AccountHistoryDialog } from "@/components/account-history-dialog"
import { getDaysUntilExpiration, getStatusBadgeColor, getExpirationBadgeColor, formatDate } from "@/lib/utils/date-utils"
import { Search, Pencil, Trash2, Send, FileText, RefreshCw, DollarSign, History } from "lucide-react"

interface AccountsTableProps {
  accounts: Account[]
  customers: Customer[]
  services: StreamingService[]
}

export function AccountsTable({ accounts, customers, services }: AccountsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")

  const getAccountPaymentStatus = (account: Account) => {
    if (!account.account_users || account.account_users.length === 0) {
      return { text: 'N/A', variant: 'outline' as const };
    }
    
    const paidCount = account.account_users.filter(u => u.payment_status === 'paid').length;
    
    if (paidCount === account.account_users.length) {
      return { text: 'Pagado', variant: 'default' as const };
    }
    if (paidCount > 0) {
      return { text: `Parcial (${paidCount}/${account.account_users.length})`, variant: 'secondary' as const };
    }
    return { text: 'Pendiente', variant: 'destructive' as const };
  };

  const filteredAccounts = accounts.filter((account) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const customerName = account.customers?.name?.toLowerCase() || '';
    const serviceName = account.streaming_services?.name?.toLowerCase() || '';
    const accountEmail = account.account_email?.toLowerCase() || '';

    const matchesSearch =
      customerName.includes(lowerCaseSearchTerm) ||
      serviceName.includes(lowerCaseSearchTerm) ||
      accountEmail.includes(lowerCaseSearchTerm);

    const matchesStatus = statusFilter === "all" || account.status === statusFilter
    const matchesService = serviceFilter === "all" || account.service_id === serviceFilter

    return matchesSearch && matchesStatus && matchesService
  })

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No hay cuentas registradas"
        description="Comienza agregando tu primera cuenta de streaming."
        action={{
          label: "Agregar Primera Cuenta",
          onClick: () => {
            const trigger = document.querySelector("[data-add-account-trigger]") as HTMLElement | null;
            if (trigger) trigger.click();
          },
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas de Streaming</CardTitle>
        <div className="flex flex-col gap-4 md:flex-row md:items-center mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, servicio o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="expired">Vencidas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Servicio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              {services.map((service) => (<SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuenta / Email</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => {
                  const daysLeft = getDaysUntilExpiration(account.expiration_date)
                  const userCount = account.account_users?.length || 0
                  const paymentStatus = getAccountPaymentStatus(account);

                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_email || <span className="text-xs text-muted-foreground italic">Sin email</span>}</TableCell>
                      <TableCell>{account.streaming_services?.name}</TableCell>
                      <TableCell>
                        <AccountUsersDialog account={account}>
                          <Button variant="ghost" size="sm" className="h-8">{userCount}/{account.user_capacity}</Button>
                        </AccountUsersDialog>
                      </TableCell>
                      <TableCell>{formatDate(account.expiration_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getExpirationBadgeColor(daysLeft)}>
                          {daysLeft < 0 ? "Vencida" : `${daysLeft} días`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusBadgeColor(account.status)}>
                          {account.status === "active" ? "Activa" : account.status === "expired" ? "Vencida" : "Cancelada"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatus.variant} className="capitalize">
                          {paymentStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <RegisterPaymentDialog account={account} customers={customers}>
                            <Button variant="ghost" size="icon" title="Registrar Pago"><DollarSign className="h-4 w-4" /></Button>
                          </RegisterPaymentDialog>
                          <RenewAccountDialog account={account}>
                            <Button variant="ghost" size="icon" title="Renovar cuenta"><RefreshCw className="h-4 w-4" /></Button>
                          </RenewAccountDialog>
                          <SendNotificationDialog account={account}>
                            <Button variant="ghost" size="icon" title="Enviar notificación"><Send className="h-4 w-4" /></Button>
                          </SendNotificationDialog>
                           <AccountHistoryDialog account={account}>
                            <Button variant="ghost" size="icon" title="Ver historial"><History className="h-4 w-4" /></Button>
                          </AccountHistoryDialog>
                          <EditAccountDialog account={account} customers={customers} services={services}>
                            <Button variant="ghost" size="icon" title="Editar cuenta"><Pencil className="h-4 w-4" /></Button>
                          </EditAccountDialog>
                          <DeleteAccountDialog accountId={account.id}>
                            <Button variant="ghost" size="icon" title="Eliminar cuenta"><Trash2 className="h-4 w-4" /></Button>
                          </DeleteAccountDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow><TableCell colSpan={8} className="text-center h-24">No se encontraron cuentas.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
