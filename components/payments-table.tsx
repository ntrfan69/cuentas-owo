"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils/date-utils"
import { Search, DollarSign } from "lucide-react"

// --- CAMBIO AQUÍ: Actualizamos el tipo para incluir el nombre del cliente ---
type PaymentWithAccount = {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  accounts: {
    account_email: string | null;
    streaming_services: { name: string; } | null;
  } | null;
  customers: { name: string; } | null; // El usuario que pagó
};

interface PaymentsTableProps {
  payments: PaymentWithAccount[]
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const serviceName = payment.accounts?.streaming_services?.name?.toLowerCase() || '';
      const accountEmail = payment.accounts?.account_email?.toLowerCase() || '';
      const paymentMethod = payment.payment_method?.toLowerCase() || '';
      // Añadimos el nombre del cliente a la búsqueda
      const customerName = payment.customers?.name?.toLowerCase() || '';

      return (
        serviceName.includes(lowerCaseSearchTerm) ||
        accountEmail.includes(lowerCaseSearchTerm) ||
        paymentMethod.includes(lowerCaseSearchTerm) ||
        customerName.includes(lowerCaseSearchTerm)
      );
    });
  }, [payments, searchTerm]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [filteredPayments]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Todos los Pagos</CardTitle>
            <div className="relative flex-1 md:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                placeholder="Buscar por usuario, servicio, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                {/* --- CAMBIO AQUÍ: Añadimos la columna "Pagado por" --- */}
                <TableHead>Pagado por</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Email de Cuenta</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    {/* --- CAMBIO AQUÍ: Mostramos el nombre del usuario --- */}
                    <TableCell>{payment.customers?.name || <span className="text-muted-foreground italic">Anónimo</span>}</TableCell>
                    <TableCell className="font-medium">{payment.accounts?.streaming_services?.name || 'N/A'}</TableCell>
                    <TableCell>{payment.accounts?.account_email || 'N/A'}</TableCell>
                    <TableCell>{payment.payment_method || 'No especificado'}</TableCell>
                    <TableCell className="text-right font-mono">${payment.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron pagos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end items-center mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-bold">Total:</span>
                <span className="text-xl font-mono font-bold">${totalAmount.toFixed(2)}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
