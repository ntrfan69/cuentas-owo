import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AccountsTable } from "@/components/accounts-table"
import { StatsCards } from "@/components/stats-cards"
import { NotificationsPanel } from "@/components/notifications-panel"
import { NotificationHistory } from "@/components/notification-history"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { AddCustomerDialog } from "@/components/add-customer-dialog"
import { ManageServicesDialog } from "@/components/manage-services-dialog"
import { UserSearchDialog } from "@/components/user-search-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Users, Settings, LogOut, Landmark } from "lucide-react"
import { InactiveUsersPanel } from "@/components/inactive-users-panel"
import { DashboardCharts } from "@/components/dashboard-charts"
import { TelegramConfigCard } from "@/components/telegram-config-card"

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Se añade el filtro .is('deleted_at', null) para obtener solo las cuentas activas (no archivadas)
  const { data: accounts } = await supabase
    .from("accounts")
    .select(`
      *,
      customers ( id, name, phone, email ),
      streaming_services ( * ),
      account_users ( * ),
      payments ( * )
    `)
    .is('deleted_at', null) // <-- Solo trae cuentas que no han sido "eliminadas"
    .order("expiration_date", { ascending: true })

  const { data: customers } = await supabase.from("customers").select("*").order("name")
  const { data: services } = await supabase.from("streaming_services").select("*").order("name")

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Cuentas</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus cuentas de streaming y notificaciones</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/reports">
                <Landmark className="h-4 w-4 mr-2" />
                Reporte Financiero
              </Link>
            </Button>
            <UserSearchDialog />
            <ManageServicesDialog services={services || []}>
              <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Servicios</Button>
            </ManageServicesDialog>
            <AddCustomerDialog>
              <Button variant="outline"><Users className="h-4 w-4 mr-2" />Nuevo Usuario</Button>
            </AddCustomerDialog>
            <AddAccountDialog services={services || []}>
              <Button data-add-account-trigger><Plus className="h-4 w-4 mr-2" />Nueva Cuenta</Button>
            </AddAccountDialog>
            <form action="/auth/logout" method="post">
              <Button variant="outline" type="submit"><LogOut className="h-4 w-4 mr-2" />Cerrar sesión</Button>
            </form>
          </div>
        </div>

        <StatsCards accounts={accounts || []} />
        
        <DashboardCharts accounts={accounts || []} />

        <InactiveUsersPanel />
        <NotificationsPanel />
        <TelegramConfigCard />
        <AccountsTable accounts={accounts || []} customers={customers || []} services={services || []} />
        <NotificationHistory />
      </div>
    </div>
  )
}
