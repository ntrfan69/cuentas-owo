import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FinancialSummary } from "@/components/financial-summary"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // --- CORRECCIÓN AQUÍ: Se ajusta la consulta para obtener datos relacionados ---
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      amount,
      payment_date,
      customers ( name ),
      accounts ( streaming_services ( name ) )
    `)
    .order("payment_date", { ascending: false });

  const { data: accounts } = await supabase
    .from("accounts")
    .select(`
      total_cost,
      start_date,
      streaming_services ( name )
    `)
    .order("start_date", { ascending: false });

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-4 sm:p-6 space-y-8">
        <div>
          <Button asChild variant="outline" className="mb-4">
            <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Volver al Panel</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Reporte Financiero</h1>
          <p className="text-muted-foreground mt-1">Analiza tus gastos, ingresos y ganancias por mes.</p>
        </div>
        <FinancialSummary payments={payments || []} accounts={accounts || []} />
      </div>
    </div>
  )
}
