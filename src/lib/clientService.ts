import { supabase } from './supabase'
import type { 
  Client, 
  ClientOrder, 
  Invoice, 
  ClientStats, 
  UpdateClientData,
  OrderFilters,
  InvoiceFilters,
  ClientDashboardData
} from '../types/client'

export class ClientService {
  // Obtener datos completos del cliente
  static async getClientData(clientId: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          role:customer_roles (
            id,
            name,
            description
          )
        `)
        .eq('id', clientId)
        .single()

      if (error) {
        console.error('Error fetching client data:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getClientData:', error)
      return null
    }
  }

  // Actualizar datos del cliente
  static async updateClient(clientId: string, data: UpdateClientData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) {
        console.error('Error updating client:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateClient:', error)
      return false
    }
  }

  // Obtener estadísticas del cliente
  static async getClientStats(clientId: string): Promise<ClientStats> {
    try {
      // Obtener pedidos
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total_cents')
        .eq('client_id', clientId)

      // Obtener facturas
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, status, total_cents')
        .eq('client_id', clientId)

      const stats: ClientStats = {
        total_orders: orders?.length || 0,
        total_spent_cents: orders?.reduce((sum, order) => sum + (order.total_cents || 0), 0) || 0,
        pending_orders: orders?.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length || 0,
        completed_orders: orders?.filter(o => ['delivered'].includes(o.status)).length || 0,
        pending_invoices: invoices?.filter(i => i.status === 'pending').length || 0,
        paid_invoices: invoices?.filter(i => i.status === 'paid').length || 0
      }

      return stats
    } catch (error) {
      console.error('Error in getClientStats:', error)
      return {
        total_orders: 0,
        total_spent_cents: 0,
        pending_orders: 0,
        completed_orders: 0,
        pending_invoices: 0,
        paid_invoices: 0
      }
    }
  }

  // Obtener pedidos del cliente con filtros
  static async getClientOrders(
    clientId: string, 
    filters?: OrderFilters,
    limit: number = 10,
    offset: number = 0
  ): Promise<ClientOrder[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            variant:product_variants (
              *,
              product:products (
                *,
                images:product_images (
                  url,
                  alt,
                  position
                )
              ),
              images:variant_images (
                url,
                alt,
                position
              )
            )
          ),
          invoice:invoices (*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // Aplicar paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching client orders:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getClientOrders:', error)
      return []
    }
  }

  // Obtener pedido específico del cliente
  static async getClientOrder(clientId: string, orderId: string): Promise<ClientOrder | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            variant:product_variants (
              *,
              product:products (
                *,
                images:product_images (
                  url,
                  alt,
                  position
                )
              ),
              images:variant_images (
                url,
                alt,
                position
              )
            )
          ),
          invoice:invoices (*)
        `)
        .eq('client_id', clientId)
        .eq('id', orderId)
        .single()

      if (error) {
        console.error('Error fetching client order:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getClientOrder:', error)
      return null
    }
  }

  // Obtener facturas del cliente con filtros
  static async getClientInvoices(
    clientId: string,
    filters?: InvoiceFilters,
    limit: number = 10,
    offset: number = 0
  ): Promise<Invoice[]> {
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // Aplicar paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching client invoices:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getClientInvoices:', error)
      return []
    }
  }

  // Obtener datos completos del dashboard
  static async getClientDashboard(clientId: string): Promise<ClientDashboardData | null> {
    try {
      const [client, stats, recentOrders, recentInvoices] = await Promise.all([
        this.getClientData(clientId),
        this.getClientStats(clientId),
        this.getClientOrders(clientId, undefined, 5),
        this.getClientInvoices(clientId, undefined, 5)
      ])

      if (!client) {
        return null
      }

      return {
        client,
        stats,
        recent_orders: recentOrders,
        recent_invoices: recentInvoices
      }
    } catch (error) {
      console.error('Error in getClientDashboard:', error)
      return null
    }
  }

  // Obtener pedidos recientes (para dashboard)
  static async getRecentOrders(clientId: string, limit: number = 5): Promise<ClientOrder[]> {
    return this.getClientOrders(clientId, undefined, limit, 0)
  }

  // Obtener facturas recientes (para dashboard)
  static async getRecentInvoices(clientId: string, limit: number = 5): Promise<Invoice[]> {
    return this.getClientInvoices(clientId, undefined, limit, 0)
  }

  // Actualizar fecha de último login
  static async updateLastLogin(clientId: string): Promise<void> {
    try {
      await supabase
        .from('clients')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  // Formatear precio en euros
  static formatPrice(cents: number): string {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    })
  }

  // Formatear fecha
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Formatear fecha corta
  static formatDateShort(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Obtener estado legible del pedido
  static getOrderStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    }
    
    return statusLabels[status] || status
  }

  // Obtener color del estado del pedido
  static getOrderStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': 'text-yellow-600 bg-yellow-50',
      'confirmed': 'text-blue-600 bg-blue-50',
      'processing': 'text-purple-600 bg-purple-50',
      'shipped': 'text-indigo-600 bg-indigo-50',
      'delivered': 'text-green-600 bg-green-50',
      'cancelled': 'text-red-600 bg-red-50'
    }
    
    return statusColors[status] || 'text-gray-600 bg-gray-50'
  }

  // Obtener estado legible de la factura
  static getInvoiceStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Pendiente',
      'paid': 'Pagada',
      'overdue': 'Vencida',
      'cancelled': 'Cancelada'
    }
    
    return statusLabels[status] || status
  }

  // Obtener color del estado de la factura
  static getInvoiceStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': 'text-yellow-600 bg-yellow-50',
      'paid': 'text-green-600 bg-green-50',
      'overdue': 'text-red-600 bg-red-50',
      'cancelled': 'text-gray-600 bg-gray-50'
    }
    
    return statusColors[status] || 'text-gray-600 bg-gray-50'
  }
}