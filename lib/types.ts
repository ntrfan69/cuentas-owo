export interface StreamingService {
  id: string
  name: string
  default_user_capacity: number
  created_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  created_at: string
}

export interface Account {
  id: string
  customer_id: string | null
  service_id: string
  start_date: string
  duration_days: number
  expiration_date: string
  status: "active" | "expired" | "cancelled"
  account_email: string | null
  account_password: string | null
  account_pin: string | null
  total_cost?: number;
  notes: string | null
  user_capacity: number
  created_at: string
  updated_at: string
  customers?: Customer
  streaming_services?: StreamingService
  account_users?: AccountUser[]
  payments?: Payment[]
}

export interface AccountUser {
  id: string
  account_id: string
  customer_id: string | null; // ID del registro en la tabla 'customers'
  user_name: string
  user_email: string | null
  user_phone: string | null
  profile_name: string | null
  is_primary: boolean
  payment_status: "paid" | "pending";
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  account_id: string
  notification_type: "5_days" | "3_days" | "1_day" | "expired"
  sent_at: string
  status: "sent" | "failed"
  error_message: string | null
}

export interface Payment {
    id: string;
    account_id: string;
    user_id: string | null;
    amount: number;
    payment_date: string;
    payment_method: string | null;
    notes: string | null;
}

export interface AccountHistoryEvent {
    id: number;
    account_id: string;
    event_type: string;
    description: string;
    created_at: string;
}
