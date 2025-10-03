// Cliente del servicio de email para uso en el browser
// Este servicio hace llamadas a la API para evitar problemas de módulos del servidor

interface OrderEmailData {
  orderId: string
  orderNumber: string
  status: string
  clientName: string
  clientEmail: string
  items: Array<{
    title: string
    quantity: number
    price: number
  }>
  total: number
  createdAt: string
  shippingAddress?: string
  invoiceId?: string
  invoiceNumber?: string
}

class EmailService {
  // Enviar notificación de cambio de estado
  static async sendOrderStatusNotification(orderData: OrderEmailData): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_order_notification',
          orderData
        })
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error sending order status notification:', error)
      return false
    }
  }

  // Método específico para notificar cuando se crea un nuevo pedido
  static async sendNewOrderNotification(orderData: OrderEmailData): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_new_order_notification',
          orderData
        })
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error sending new order notification:', error)
      return false
    }
  }

  // Verificar configuración del email
  static async verifyEmailConfiguration(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_configuration',
          orderData: {} // No se necesita para verificación
        })
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error verifying email configuration:', error)
      return false
    }
  }
}

export default EmailService