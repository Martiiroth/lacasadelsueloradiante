import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { AdminOrder } from '@/types/admin'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export const generateDeliveryNote = (order: AdminOrder) => {
  const doc = new jsPDF()
  
  // Company header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('La Casa del Suelo Radiante', 20, 25)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Albarán de Entrega', 20, 35)
  
  // Order information
  doc.setFontSize(10)
  doc.text(`Número de Pedido: #${order.id.slice(-8)}`, 20, 50)
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString('es-ES')}`, 20, 57)
  doc.text(`Estado: ${getStatusLabel(order.status)}`, 20, 64)
  
  // Get shipping address
  const shippingAddress = getShippingAddress(order)
  
  // Client and shipping information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Información del Cliente', 20, 80)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let yPos = 90
  
  if (order.client) {
    doc.text(`Cliente: ${order.client.first_name} ${order.client.last_name}`, 20, yPos)
    yPos += 7
    doc.text(`Email: ${order.client.email}`, 20, yPos)
    yPos += 7
  } else {
    doc.text('Cliente: Invitado', 20, yPos)
    yPos += 7
  }
  
  // Shipping address
  if (shippingAddress) {
    doc.setFont('helvetica', 'bold')
    doc.text('Dirección de Envío:', 20, yPos + 5)
    yPos += 12
    
    doc.setFont('helvetica', 'normal')
    if (shippingAddress.name) {
      doc.text(`${shippingAddress.name}`, 20, yPos)
      yPos += 7
    }
    if (shippingAddress.address_line1) {
      doc.text(`${shippingAddress.address_line1}`, 20, yPos)
      yPos += 7
    }
    if (shippingAddress.address_line2) {
      doc.text(`${shippingAddress.address_line2}`, 20, yPos)
      yPos += 7
    }
    if (shippingAddress.postal_code && shippingAddress.city) {
      doc.text(`${shippingAddress.postal_code} ${shippingAddress.city}`, 20, yPos)
      yPos += 7
    }
    if (shippingAddress.region) {
      doc.text(`${shippingAddress.region}`, 20, yPos)
      yPos += 7
    }
    if (shippingAddress.country) {
      doc.text(`${shippingAddress.country}`, 20, yPos)
      yPos += 7
    }
    if (shippingAddress.phone) {
      doc.text(`Teléfono: ${shippingAddress.phone}`, 20, yPos)
      yPos += 7
    }
  }
  
  // Items table
  const tableStartY = yPos + 15
  
  // Prepare table data
  const tableColumns = [
    'Producto/Variante',
    'SKU',
    'Cantidad',
    'Precio Unit.',
    'Total'
  ]
  
  const tableRows = order.order_items?.map(item => {
    const productName = item.variant ? (
      item.variant.title ||
      [item.variant.option1, item.variant.option2, item.variant.option3]
        .filter(Boolean)
        .join(' / ') ||
      `${item.variant.product?.title} - Variante`
    ) : 'Producto sin variante'
    
    const sku = item.variant?.sku || 'N/A'
    const quantity = item.qty.toString()
    const unitPrice = `€${(item.price_cents / 100).toFixed(2)}`
    const total = `€${((item.price_cents * item.qty) / 100).toFixed(2)}`
    
    return [productName, sku, quantity, unitPrice, total]
  }) || []
  
  // Add table
  doc.autoTable({
    startY: tableStartY,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 70 }, // Producto/Variante
      1: { cellWidth: 30 }, // SKU
      2: { cellWidth: 25, halign: 'center' }, // Cantidad
      3: { cellWidth: 30, halign: 'right' }, // Precio Unit.
      4: { cellWidth: 30, halign: 'right' }  // Total
    }
  })
  
  // Total summary
  const finalY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total del Pedido: €${(order.total_cents / 100).toFixed(2)}`, 120, finalY)
  
  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Este albarán confirma la entrega de los productos listados.', 20, pageHeight - 30)
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, pageHeight - 20)
  
  // Save the PDF
  const fileName = `albaran-${order.id.slice(-8)}-${new Date().getTime()}.pdf`
  doc.save(fileName)
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmado',
    'processing': 'Procesando',
    'shipped': 'Enviado',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado'
  }
  return labels[status] || status
}

const getShippingAddress = (order: AdminOrder) => {
  // Try different address structures
  
  // 1. Registered client with billing_address and shipping_address objects
  if (order.client && (order as any).billing_address && (order as any).shipping_address) {
    const billing = (order as any).billing_address
    const shipping = (order as any).shipping_address
    
    if (shipping.use_billing_as_shipping) {
      return {
        name: `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || undefined,
        address_line1: billing.address_line1,
        address_line2: billing.address_line2,
        postal_code: billing.postal_code,
        city: billing.city,
        region: billing.region,
        country: billing.country,
        phone: billing.phone
      }
    } else {
      return {
        name: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() || undefined,
        address_line1: shipping.address_line1,
        address_line2: shipping.address_line2,
        postal_code: shipping.postal_code,
        city: shipping.city,
        region: shipping.region,
        country: shipping.country,
        phone: shipping.phone
      }
    }
  }
  
  // 2. Guest client with billing_address and shipping_address objects
  if (!order.client && (order as any).billing_address && (order as any).shipping_address) {
    const billing = (order as any).billing_address
    const shipping = (order as any).shipping_address
    
    // Compare if they're the same
    if (JSON.stringify(shipping) === JSON.stringify(billing)) {
      return {
        name: `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || undefined,
        address_line1: billing.address_line1,
        address_line2: billing.address_line2,
        postal_code: billing.postal_code,
        city: billing.city,
        region: billing.region,
        country: billing.country,
        phone: billing.phone
      }
    } else {
      return {
        name: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim() || undefined,
        address_line1: shipping.address_line1,
        address_line2: shipping.address_line2,
        postal_code: shipping.postal_code,
        city: shipping.city,
        region: shipping.region,
        country: shipping.country,
        phone: shipping.phone
      }
    }
  }
  
  // 3. Legacy structure in shipping_address (guest clients)
  if (!order.client && order.shipping_address) {
    const shippingAddr = order.shipping_address as any
    
    // Direct fields in shipping_address
    if (shippingAddr.first_name || shippingAddr.email || shippingAddr.city) {
      return {
        name: `${shippingAddr.first_name || ''} ${shippingAddr.last_name || ''}`.trim() || undefined,
        address_line1: shippingAddr.address_line1,
        address_line2: shippingAddr.address_line2,
        postal_code: shippingAddr.postal_code,
        city: shippingAddr.city,
        region: shippingAddr.region,
        country: shippingAddr.country,
        phone: shippingAddr.phone
      }
    }
    
    // Nested structure with shipping object
    if (shippingAddr.shipping) {
      return {
        name: `${shippingAddr.shipping.first_name || ''} ${shippingAddr.shipping.last_name || ''}`.trim() || undefined,
        address_line1: shippingAddr.shipping.address_line1,
        address_line2: shippingAddr.shipping.address_line2,
        postal_code: shippingAddr.shipping.postal_code,
        city: shippingAddr.shipping.city,
        region: shippingAddr.shipping.region,
        country: shippingAddr.shipping.country,
        phone: shippingAddr.shipping.phone
      }
    }
    
    // Use billing address if no specific shipping
    if (shippingAddr.billing) {
      return {
        name: `${shippingAddr.billing.first_name || ''} ${shippingAddr.billing.last_name || ''}`.trim() || undefined,
        address_line1: shippingAddr.billing.address_line1,
        address_line2: shippingAddr.billing.address_line2,
        postal_code: shippingAddr.billing.postal_code,
        city: shippingAddr.billing.city,
        region: shippingAddr.billing.region,
        country: shippingAddr.billing.country,
        phone: shippingAddr.billing.phone
      }
    }
  }
  
  // 4. Fallback for registered clients
  if (order.client) {
    return {
      name: `${order.client.first_name} ${order.client.last_name}`,
      address_line1: undefined,
      address_line2: undefined,
      postal_code: undefined,
      city: undefined,
      region: undefined,
      country: undefined,
      phone: undefined
    }
  }
  
  return null
}