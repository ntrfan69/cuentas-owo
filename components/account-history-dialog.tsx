"use client"

import { useState } from "react";
import type { Account, AccountHistoryEvent } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription, // <-- Se añade la importación que faltaba
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AccountHistoryDialogProps {
  account: Account;
  children: React.ReactNode;
}

export function AccountHistoryDialog({ account, children }: AccountHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AccountHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("account_history")
      .select("*")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setHistory(data);
    }
    setLoading(false);
  };

  const getEventTypeVariant = (type: string) => {
    if (type.includes("CREADA")) return "default";
    if (type.includes("RENOVADA")) return "secondary";
    if (type.includes("ELIMINADO")) return "destructive";
    return "outline";
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        fetchHistory();
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historial de la Cuenta</DialogTitle>
          <DialogDescription>
            Registro de eventos para la cuenta de {account.streaming_services?.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-4 p-1">
            {loading && <p className="text-center text-muted-foreground">Cargando historial...</p>}
            {!loading && history.length === 0 && <p className="text-center text-muted-foreground">No hay historial para esta cuenta.</p>}
            {history.map(event => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center self-stretch">
                  <span className="relative flex h-3 w-3 mt-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <div className="w-px flex-1 bg-border my-1"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={getEventTypeVariant(event.event_type)}>{event.event_type.replace(/_/g, ' ')}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <p className="text-sm mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
