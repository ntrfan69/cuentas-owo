"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail } from "lucide-react"

export default function ConfirmEmailPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleConfirm = async () => {
    if (!code) {
      setError("Por favor ingresa el código de confirmación")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Redirigir a la ruta de callback con el código
      window.location.href = `/auth/callback?code=${code.trim()}`
    } catch (err) {
      setError("Error al procesar el código. Por favor intenta nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl font-bold">Verifica tu Email</CardTitle>
          </div>
          <CardDescription>
            Te hemos enviado un email con un código de confirmación. Copia el código y pégalo aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Cómo obtener el código:</strong>
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Revisa tu bandeja de entrada (y spam)</li>
                <li>Busca el email de confirmación de Supabase</li>
                <li>Copia el código del enlace (la parte después de ?code=)</li>
                <li>Pégalo en el campo de abajo</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Código de confirmación
            </label>
            <Input
              id="code"
              type="text"
              placeholder="Ejemplo: 9437f0d2-a286-426c-8976-509f2bcd8962"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleConfirm} disabled={loading || !code} className="w-full">
            {loading ? "Verificando..." : "Confirmar Email"}
          </Button>

          <div className="text-center">
            <a href="/auth/login" className="text-sm text-muted-foreground hover:text-primary">
              ¿Ya confirmaste tu email? Inicia sesión
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
