import { createClient } from "@/lib/supabase/server";
import { getDaysUntilExpiration } from "@/lib/utils/date-utils";

export type NotificationType = "1_day" | "expired";

export interface AccountUserForNotification {
  name: string;
  phone: string;
}

export interface NotificationCheck {
  accountId: string;
  users: AccountUserForNotification[];
  serviceName: string;
  expirationDate: string;
  daysLeft: number;
  notificationType: NotificationType;
  messageTemplate: string;
}

export async function getAccountsNeedingNotification(): Promise<NotificationCheck[]> {
  const supabase = await createClient();

  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select(`
      id,
      expiration_date,
      status,
      streaming_services (name),
      account_users (user_name, user_phone, status)
    `)
    .in("status", ["active", "expired"])
    .not("account_users", "is", null);

  if (accountsError) {
    console.error("Error fetching accounts:", accountsError);
    return [];
  }
  if (!accounts) return [];

  const potentialNotifications: NotificationCheck[] = [];

  for (const account of accounts) {
    const daysLeft = getDaysUntilExpiration(account.expiration_date);
    let notificationType: NotificationType | null = null;

    if (daysLeft === 1) {
      notificationType = "1_day";
    } else if (daysLeft <= 0) {
      notificationType = "expired";
    }

    if (notificationType) {
      const activeUsersWithPhone = (account.account_users || []).filter(
        (user: any) => user.status === "active" && user.user_phone
      );

      if (activeUsersWithPhone.length > 0) {
        const serviceName = (account.streaming_services as any)?.name || "Servicio";
        const messageTemplate = daysLeft <= 0
          ? `Tu cuenta de ${serviceName} ha vencido hoy. Contactanos para renovar.`
          : `Tu cuenta de ${serviceName} vence manana. Renueva a tiempo para no perder el acceso.`;

        potentialNotifications.push({
          accountId: account.id,
          users: activeUsersWithPhone.map((u: any) => ({ name: u.user_name, phone: u.user_phone })),
          serviceName,
          expirationDate: account.expiration_date,
          daysLeft,
          notificationType,
          messageTemplate,
        });
      }
    }
  }

  if (potentialNotifications.length === 0) return [];

  const accountIds = potentialNotifications.map((n) => n.accountId);
  const { data: sentNotifications } = await supabase
    .from("notifications")
    .select("account_id, notification_type")
    .in("account_id", accountIds);

  const sentSet = new Set(sentNotifications?.map((n) => `${n.account_id}-${n.notification_type}`) || []);

  return potentialNotifications.filter(
    (p) => !sentSet.has(`${p.accountId}-${p.notificationType}`)
  );
}

export async function markNotificationAsSent(
  accountId: string,
  notificationType: NotificationType,
  status: "sent" | "failed" = "sent",
  errorMessage?: string
) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    account_id: accountId,
    notification_type: notificationType,
    status,
    error_message: errorMessage || null,
  });
}

export async function getNotificationHistory(accountId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select(`
      *,
      accounts (
        streaming_services ( name )
      )
    `)
    .order("sent_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data } = await query;
  return data || [];
}
