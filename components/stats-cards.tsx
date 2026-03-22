import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Account } from "@/lib/types"
import { getDaysUntilExpiration } from "@/lib/utils/date-utils"
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  accounts: Account[]
}

export function StatsCards({ accounts }: StatsCardsProps) {
  const activeAccounts = accounts.filter((a) => a.status === "active").length
  const expiredAccounts = accounts.filter((a) => a.status === "expired").length
  const expiringIn5Days = accounts.filter((a) => {
    const days = getDaysUntilExpiration(a.expiration_date)
    return days >= 0 && days <= 5 && a.status === "active"
  }).length
  const totalRevenue = accounts.length * 10 // Placeholder calculation

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cuentas Activas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAccounts}</div>
          <p className="text-xs text-muted-foreground">Total de cuentas activas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringIn5Days}</div>
          <p className="text-xs text-muted-foreground">Vencen en los próximos 5 días</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiredAccounts}</div>
          <p className="text-xs text-muted-foreground">Cuentas expiradas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cuentas</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{accounts.length}</div>
          <p className="text-xs text-muted-foreground">Todas las cuentas</p>
        </CardContent>
      </Card>
    </div>
  )
}
