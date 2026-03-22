"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function TelegramConfigCard() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTesting(true)
    setTestResult(null)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: formData.get("chatId"),
          message: formData.get("message"),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `Mensaje enviado exitosamente. ID: ${data.messageId}`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || "Error al enviar mensaje",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                <div>
                  <CardTitle>Configuración de Telegram</CardTitle>
                  <CardDescription>
                    Prueba el bot de Telegram enviando un mensaje de prueba
                  </CardDescription>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                <h4 className="font-semibold">¿Cómo configurar el bot?</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Abre Telegram y busca <strong>@BotFather</strong></li>
                  <li>Escribe <code>/newbot</code> y sigue las instrucciones</li>
                  <li>Copia el token que te da (ej: <code>123456:ABC-DEF...</code>)</li>
                  <li>
                    Agrega la variable de entorno en Vercel:
                    <br />
                    <code className="bg-background px-1 rounded">TELEGRAM_BOT_TOKEN=tu_token</code>
                  </li>
                </ol>
                <h4 className="font-semibold mt-2">¿Cómo obtener el Chat ID del cliente?</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>El cliente debe escribirle al bot primero (cualquier mensaje)</li>
                  <li>
                    Visita:{" "}
                    <code className="bg-background px-1 rounded">
                      https://api.telegram.org/bot&#123;TOKEN&#125;/getUpdates
                    </code>
                  </li>
                  <li>Copia el <code>chat.id</code> del resultado</li>
                  <li>Guarda ese ID en el campo "Teléfono" del usuario en el panel</li>
                </ol>
              </div>

              <form onSubmit={handleTest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chatId">Chat ID del destinatario</Label>
                  <Input id="chatId" name="chatId" placeholder="Ej: 123456789" required />
                  <p className="text-xs text-muted-foreground">
                    El cliente debe haber iniciado conversación con el bot primero
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje de Prueba</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Hola, este es un mensaje de prueba del sistema de notificaciones."
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" disabled={testing} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {testing ? "Enviando..." : "Enviar Mensaje de Prueba"}
                </Button>
              </form>

              {testResult && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    testResult.success
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{testResult.success ? "Éxito" : "Error"}</p>
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
