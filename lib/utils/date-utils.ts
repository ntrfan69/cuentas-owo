export function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expDate = new Date(expirationDate)
  expDate.setHours(0, 0, 0, 0)

  const diffTime = expDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-700 dark:text-green-400"
    case "expired":
      return "bg-red-500/10 text-red-700 dark:text-red-400"
    case "cancelled":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
  }
}

export function getExpirationBadgeColor(daysLeft: number): string {
  if (daysLeft < 0) return "bg-red-500/10 text-red-700 dark:text-red-400"
  if (daysLeft <= 1) return "bg-red-500/10 text-red-700 dark:text-red-400"
  if (daysLeft <= 3) return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
  if (daysLeft <= 5) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
  return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
