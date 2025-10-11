// Tipos para el sistema de checkout y pedidos

export interface Order {
  id: string
  client_id: string
  status: OrderStatus
  total_cents: number
  shipping_address: ShippingAddress
  created_at: string
  updated_at: string
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string
  qty: number
  price_cents: number
  // Datos enriquecidos del producto/variante
  variant?: {
    id: string
    title: string
    sku: string
    variant_images?: Array<{
      id: string
      url: string
      alt: string
      position: number
    }>
    product: {
      id: string
      title: string
      slug: string
      image?: {
        url: string
        alt: string
        position?: number
      }
    }
  }
}

export interface OrderLog {
  id: string
  order_id: string
  action: string
  details: any
  performed_by: string
  created_at: string
}

export interface BillingAddress {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company_name?: string
  nif_cif?: string
  activity?: string
  company_position?: string
  address_line1: string
  address_line2?: string
  city: string
  region: string
  postal_code: string
  country?: string
}

export interface ShippingAddress {
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  company_name?: string
  address_line1: string
  address_line2?: string
  city: string
  region: string
  postal_code: string
  country?: string
}

export interface ShippingMethod {
  id: string
  name: string
  price_cents: number
  estimated_days: number
  created_at: string
}

export interface PaymentMethod {
  id: string
  name: string
  provider: string
  active: boolean
  created_at: string
}

export interface Invoice {
  id: string
  client_id: string
  order_id: string
  invoice_number: number
  prefix: string
  suffix: string
  total_cents: number
  currency: string
  created_at: string
  due_date: string
  status: InvoiceStatus
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceCounter {
  id: string
  prefix: string
  suffix: string
  next_number: number
}

export interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  applies_to: 'product' | 'category' | 'order'
  target_id?: string
  usage_limit: number
  used_count: number
  valid_from: string
  valid_to: string
  created_at: string
}

export interface CouponRedemption {
  id: string
  coupon_id: string
  client_id: string
  order_id: string
  redeemed_at: string
}

// Tipos para el flujo de checkout
export interface CheckoutData {
  shipping_address: ShippingAddress
  shipping_method_id: string
  payment_method_id: string
  coupon_code?: string
  notes?: string
}

export interface CheckoutSummary {
  subtotal_cents: number
  shipping_cents: number
  discount_cents: number
  tax_cents: number
  total_cents: number
  currency: string
  items: OrderItem[]
  shipping_method: ShippingMethod
  applied_coupon?: Coupon
}

export interface CreateOrderData {
  client_id?: string | null // Opcional para pedidos de invitados
  guest_email?: string // Email del invitado si no hay client_id
  items: Array<{
    variant_id: string
    qty: number
    price_cents: number
  }>
  shipping_address: ShippingAddress
  billing_address: BillingAddress
  shipping_method_id: string
  payment_method_id: string
  coupon_code?: string
  notes?: string
}

export interface OrderConfirmation {
  order: Order
  order_items: OrderItem[]
  invoice: Invoice
  confirmation_number: string
}

// Tipos para formularios de checkout
export interface CheckoutFormData {
  // Dirección de facturación (datos del cliente)
  billing_address: BillingAddress
  
  // Dirección de envío (solo dirección física)
  shipping_address: ShippingAddress
  use_billing_as_shipping: boolean
  
  // Opciones de entrega y pago
  shipping_method_id: string
  payment_method_id: string
  
  // Opciones adicionales
  coupon_code?: string
  notes?: string
  
  // Términos y condiciones
  accept_terms: boolean
  accept_marketing?: boolean
}

export type CheckoutStep = 
  | 'billing'
  | 'shipping'
  | 'payment'
  | 'review'
  | 'confirmation'

export interface CheckoutState {
  current_step: CheckoutStep
  form_data: Partial<CheckoutFormData>
  summary: CheckoutSummary | null
  is_loading: boolean
  error: string | null
}