/**
 * Tipos TypeScript para el sistema de facturas
 * Compatible con jsPDF + shadcn UI
 */

export interface Invoice {
  id: string
  client_id: string | null
  order_id: string
  invoice_number: number
  prefix: string
  suffix: string
  total_cents: number
  currency: string
  status: InvoiceStatus
  created_at: string
  due_date: string | null
  
  // Relaciones expandidas
  client?: InvoiceClient
  order?: InvoiceOrder
  items?: InvoiceItem[]
}

export interface InvoiceClient {
  id: string
  first_name: string
  last_name: string
  email: string
  nif_cif?: string
  company_name?: string
  phone?: string
  
  // Dirección de facturación
  address_line1?: string
  address_line2?: string
  city?: string
  postal_code?: string
  region?: string
}

export interface InvoiceOrder {
  id: string
  status: string
  created_at: string
  confirmation_number?: string
  shipping_address?: any
  billing_address?: any
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  variant_id: string
  qty: number
  price_cents: number
  
  // Datos del producto/variante
  product_title?: string
  variant_title?: string
  sku?: string
}

export interface InvoiceCounter {
  id: string
  prefix: string
  suffix: string
  next_number: number
}

export type InvoiceStatus = 
  | 'draft'      // Borrador, no enviada
  | 'sent'       // Enviada al cliente
  | 'paid'       // Pagada
  | 'overdue'    // Vencida
  | 'cancelled'  // Cancelada

export interface CreateInvoiceData {
  order_id: string
  client_id?: string | null
  due_date?: string
  notes?: string
  auto_send?: boolean  // Para generar y enviar automáticamente
}

export interface InvoiceFilters {
  status?: InvoiceStatus[]
  client_id?: string
  date_from?: string
  date_to?: string
  search?: string // Para buscar por número de factura o cliente
}

export interface InvoicePaginatedResponse {
  invoices: Invoice[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Para mostrar estadísticas
export interface InvoiceStats {
  total_invoices: number
  total_amount_cents: number
  paid_count: number
  paid_amount_cents: number
  overdue_count: number
  overdue_amount_cents: number
  pending_count: number
  pending_amount_cents: number
}

// Para el PDF
export interface InvoicePDFData {
  invoice: Invoice
  company: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    nif: string
  }
  items: InvoiceItem[]
}

// Configuración del PDF
export interface PDFConfig {
  format: 'A4' | 'Letter'
  language: 'es' | 'en'
  currency: string
  logo_url?: string
}