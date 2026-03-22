"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Scale, FileDown } from "lucide-react"
import { generateFinancialReportPDF } from "@/lib/utils/generatePDF" // Asumiendo que este archivo existe

type Payment = {
  amount: number;
  payment_date: string;
  customers: { name: string } | null;
  accounts: { streaming_services: { name: string } | null } | null;
};
type AccountCost = {
  total_cost: number | null;
  start_date: string;
  streaming_services: { name: string } | null;
};

interface FinancialSummaryProps {
  payments: Payment[];
  accounts: AccountCost[];
}

export function FinancialSummary({ payments, accounts }: FinancialSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const monthlyData = useMemo(() => {
    const data: { [key: string]: { collected: number; spent: number } } = {};
    
    // --- CORRECCIÓN AQUÍ: Se verifica que los arrays existan antes de procesarlos ---
    if (!payments || !accounts) {
        return {};
    }

    payments.forEach(p => {
      const month = new Date(p.payment_date).toISOString().slice(0, 7); // "YYYY-MM"
      if (!data[month]) data[month] = { collected: 0, spent: 0 };
      data[month].collected += p.amount;
    });

    accounts.forEach(a => {
        const month = new Date(a.start_date).toISOString().slice(0, 7);
        if (!data[month]) data[month] = { collected: 0, spent: 0 };
        data[month].spent += a.total_cost || 0;
    });
    
    return data;
  }, [payments, accounts]);

  const availableMonths = Object.keys(monthlyData).sort().reverse();
  
  const filteredPayments = useMemo(() => {
    if (selectedMonth === 'all' || !payments) return payments || [];
    return payments.filter(p => new Date(p.payment_date).toISOString().slice(0, 7) === selectedMonth);
  }, [payments, selectedMonth]);

  const filteredAccounts = useMemo(() => {
    if (selectedMonth === 'all' || !accounts) return accounts || [];
    return accounts.filter(a => new Date(a.start_date).toISOString().slice(0, 7) === selectedMonth);
  }, [accounts, selectedMonth]);


  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalSpent = filteredAccounts.reduce((sum, a) => sum + (a.total_cost || 0), 0);
  const netProfit = totalCollected - totalSpent;
  
  const formatCurrency = (value: number) => `$${Math.round(value).toLocaleString('es-CL')}`;

  const handleDownloadPDF = () => {
    const monthLabel = selectedMonth === 'all' 
      ? 'Histórico' 
      : new Date(selectedMonth + '-02').toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    
    generateFinancialReportPDF(monthLabel, totalCollected, totalSpent, netProfit, filteredPayments, filteredAccounts);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
        <CardTitle>Resumen Financiero</CardTitle>
        <div className="flex gap-2 w-full md:w-auto">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + '-02').toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadPDF} variant="outline" disabled={!payments || !accounts}>
                <FileDown className="h-4 w-4 mr-2" />
                Descargar PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCollected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <Scale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
