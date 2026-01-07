import jsPDF from 'jspdf'
import { AdminOrder } from '@/types/admin'

export const generateDeliveryNote = (order: AdminOrder) => {
  const doc = new jsPDF()
  
  // Debug: Log shipping_address structure
  console.log('🔍 PDF Generator - Order shipping_address:', JSON.stringify(order.shipping_address, null, 2))
  console.log('🔍 PDF Generator - Order billing_address:', JSON.stringify((order as any).billing_address, null, 2))
  console.log('🔍 PDF Generator - Order client:', JSON.stringify(order.client, null, 2))
  
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
  
  // Items table header
  const tableStartY = yPos + 15
  
  // Draw table header
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(66, 139, 202)
  doc.setTextColor(255, 255, 255)
  doc.rect(20, tableStartY, 170, 10, 'F')
  
  // Table headers
  doc.text('Producto/Variante', 22, tableStartY + 6)
  doc.text('SKU', 90, tableStartY + 6)
  doc.text('Cant.', 115, tableStartY + 6)
  doc.text('P. Unit.', 135, tableStartY + 6)
  doc.text('Total', 165, tableStartY + 6)
  
  // Reset text color for content
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  // Draw table content
  let currentY = tableStartY + 15
  const rowHeight = 15
  
  order.order_items?.forEach((item: any, index) => {
    // Si es producto personalizado, usar nombres guardados
    const productName = item.product_title 
      ? `${item.product_title}${item.variant_title ? ` - ${item.variant_title}` : ''}`
      : item.variant 
        ? (item.variant.title ||
      [item.variant.option1, item.variant.option2, item.variant.option3]
        .filter(Boolean)
        .join(' / ') ||
           `${item.variant.product?.title} - Variante`)
        : 'Producto sin variante'
    
    const sku = item.variant?.sku || (item.product_title ? 'PERSONALIZADO' : 'N/A')
    const quantity = item.qty.toString()
    const unitPrice = `€${(item.price_cents / 100).toFixed(2)}`
    const total = `€${((item.price_cents * item.qty) / 100).toFixed(2)}`
    
    // Draw row background (alternating colors)
    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(20, currentY - 5, 170, rowHeight, 'F')
    }
    
    // Draw borders
    doc.setDrawColor(200, 200, 200)
    doc.rect(20, currentY - 5, 170, rowHeight, 'S')
    
    // Add text content - truncate long product names
    const maxProductNameLength = 30
    const truncatedProductName = productName.length > maxProductNameLength 
      ? productName.substring(0, maxProductNameLength) + '...'
      : productName
    
    doc.text(truncatedProductName, 22, currentY + 2)
    doc.text(sku, 90, currentY + 2)
    doc.text(quantity, 115, currentY + 2)
    doc.text(unitPrice, 135, currentY + 2)
    doc.text(total, 165, currentY + 2)
    
    currentY += rowHeight
  })
  
  // Total summary
  const finalY = currentY + 15
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
  // Extract shipping address data directly from order.shipping_address
  if (!order.shipping_address) {
    // If no shipping_address, use client info as fallback
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

  const shippingAddr = order.shipping_address as any
  
  // Extract fields directly from shipping_address, trying different possible locations
  const extractField = (fieldName: string) => {
    // Try direct field
    if (shippingAddr[fieldName]) return shippingAddr[fieldName]
    
    // Try in billing sub-object
    if (shippingAddr.billing && shippingAddr.billing[fieldName]) return shippingAddr.billing[fieldName]
    
    // Try in shipping sub-object
    if (shippingAddr.shipping && shippingAddr.shipping[fieldName]) return shippingAddr.shipping[fieldName]
    
    return undefined
  }
  
  // Extract name
  const firstName = extractField('first_name')
  const lastName = extractField('last_name')
  const name = firstName && lastName ? `${firstName} ${lastName}` : 
               (order.client ? `${order.client.first_name} ${order.client.last_name}` : undefined)
  
  // Extract address fields
  const address_line1 = extractField('address_line1')
  const address_line2 = extractField('address_line2')
  const postal_code = extractField('postal_code')
  const city = extractField('city')
  const region = extractField('region')
  const country = extractField('country')
  const phone = extractField('phone')
  
  return {
    name,
    address_line1,
    address_line2,
    postal_code,
    city,
    region,
    country,
    phone
  }
}