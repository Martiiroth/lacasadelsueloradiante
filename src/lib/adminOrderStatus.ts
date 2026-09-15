export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 ring-amber-600/20',
  confirmed: 'bg-sky-100 text-sky-900 ring-sky-600/20',
  processing: 'bg-violet-100 text-violet-900 ring-violet-600/20',
  shipped: 'bg-indigo-100 text-indigo-900 ring-indigo-600/20',
  delivered: 'bg-emerald-100 text-emerald-900 ring-emerald-600/20',
  cancelled: 'bg-red-100 text-red-900 ring-red-600/20',
}

/** Flujo operativo (sin cancelled) para timeline */
export const ORDER_STATUS_FLOW = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
] as const

export function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] || status
}

export function getOrderStatusColor(status: string) {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 ring-gray-500/20'
}

export function getStatusFlowIndex(status: string): number {
  if (status === 'cancelled') return -1
  return ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number])
}
