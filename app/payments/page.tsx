import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PaymentsTable } from "@/components/payments-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function PaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // --- CAMBIO AQUÍ: La consulta ahora también trae el nombre del usuario (customer) ---
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      accounts (
        account_email,
        streaming_services (name)
      ),
      customers ( name ) 
    `)
    .order("payment_date", { ascending: false });

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-4 sm:p-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Pagos</h1>
            <p className="text-muted-foreground mt-1">
              Consulta, filtra y busca todos los pagos registrados en el sistema.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel Principal
            </Link>
          </Button>
        </div>

        <PaymentsTable payments={payments || []} />
      </div>
    </div>
  )
}
