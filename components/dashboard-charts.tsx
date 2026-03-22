"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Account } from "@/lib/types"
import { getDaysUntilExpiration } from "@/lib/utils/date-utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { useMemo } from "react"
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react"

interface DashboardChartsProps {
  accounts: Account[]
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DashboardCharts({ accounts }: DashboardChartsProps) {
  const expiringData = useMemo(() => {
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i)
      return {
        date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        Vencen: 0
      }
    })

    accounts.forEach(account => {
      if (account.status === 'active') {
        const daysLeft = getDaysUntilExpiration(account.expiration_date)
        if (daysLeft >= 0 && daysLeft < 7) {
          if (next7Days[daysLeft]) {
            next7Days[daysLeft].Vencen++;
          }
        }
      }
    })
    return next7Days
  }, [accounts])

  const serviceDistributionData = useMemo(() => {
    const serviceCount: { [key: string]: number } = {}
    accounts.forEach(account => {
      const serviceName = account.streaming_services?.name || 'Desconocido'
      serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
    })
    return Object.entries(serviceCount).map(([name, value]) => ({ name, value }))
  }, [accounts])

  // CAMBIO: Se usan clases de Tailwind para asegurar la compatibilidad con el tema
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
              <span className="font-bold text-foreground">{payload[0].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Vencimientos Próximos</CardTitle>
          <CardDescription>Cuentas que vencen en los próximos 7 días.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expiringData}>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<CustomTooltip />} />
              {/* CAMBIO: Se usa un color del tema de gráficos para la barra */}
              <Bar dataKey="Vencen" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> Distribución de Cuentas</CardTitle>
          <CardDescription>Distribución de cuentas por servicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={serviceDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (percent > 0.05) ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">{(percent * 100).toFixed(0)}%</text> : null;
              }}>
                {serviceDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
