import { NextRequest, NextResponse } from 'next/server'
import { PDFService } from '@/lib/pdfService'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Nueva estructura de types para coincidir con el schema actual
type Invoice = {
  id: string;
  invoice_number: number;
  created_at: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  status: string;
  prefix: string;
  suffix: string;
  client: {
    id: string;
    company_name: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    postal_code: string | null;
    nif_cif: string | null;
  } | null;
  order: {
    id: string;
    order_items: Array<{
      id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      product_variant: {
        id: string;
        name: string;
        product: {
          name: string;
          category: {
            name: string;
          };
        };
      };
    }>;
  } | null;
};

// Función para obtener datos de factura desde Supabase
async function getInvoiceData(invoiceId: string): Promise<Invoice | null> {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:clients (
        first_name,
        last_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        region,
        postal_code,
        company_name,
        nif_cif
      ),
      order:orders (
        id,
        created_at,
        shipping_address,
        billing_address,
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          product_variant:product_variants (
            id,
            name,
            product:products (
              name,
              category:categories (
                name
              )
            )
          )
        )
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (error || !invoice) {
    console.error('Error obteniendo factura:', error)
    return null
  }

  return invoice as Invoice
}

// Función optimizada para generar HTML imprimible (funciona en cualquier VPS)
function generateOptimizedPrintHTML(invoiceData: Invoice): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const totalAmount = invoiceData.total_amount || 0
  const taxAmount = invoiceData.tax_amount || 0
  const subtotal = invoiceData.subtotal || 0

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long', 
      year: 'numeric'
    })
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura #${invoiceData.invoice_number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 20mm;
            }
            
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            background: white;
            max-width: 794px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .print-instructions {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            color: #92400e;
        }
        
        .print-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
        }
        
        .invoice-container {
            background: white;
            padding: 40px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .company-info h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background-color: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #6b7280;
        }
        
        .text-right {
            text-align: right;
        }
        
        .summary-table {
            width: 300px;
            margin-left: auto;
        }
        
        .total-row {
            background-color: #f3f4f6;
            font-weight: bold;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="print-instructions no-print">
        <h3>📄 Generar PDF de la Factura</h3>
        <p>Para descargar esta factura como PDF, usa Ctrl+P → "Guardar como PDF"</p>
        <button class="print-button" onclick="window.print()">🖨️ Imprimir/Guardar PDF</button>
    </div>
    
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-info">
                <h1>La Casa del Suelo Radiante</h1>
                <p>Especialistas en calefacción por suelo radiante</p>
                <p>📧 info@lacasadelsueloradiante.com</p>
            </div>
            <div class="invoice-meta">
                <h2>FACTURA</h2>
                <p><strong>Número:</strong> #${invoiceData.invoice_number}</p>
                <p><strong>Fecha:</strong> ${formatDate(invoiceData.created_at)}</p>
                <p><strong>Estado:</strong> ${invoiceData.status}</p>
            </div>
        </div>
        
        <div class="invoice-details">
            <div class="billing-info">
                <h3>Facturar a:</h3>
                ${invoiceData.client ? `
                    ${invoiceData.client.company_name ? `<p><strong>${invoiceData.client.company_name}</strong></p>` : ''}
                    <p>${invoiceData.client.first_name} ${invoiceData.client.last_name}</p>
                    <p>📧 ${invoiceData.client.email}</p>
                    ${invoiceData.client.phone ? `<p>📞 ${invoiceData.client.phone}</p>` : ''}
                    ${invoiceData.client.address_line1 ? `<p>📍 ${invoiceData.client.address_line1}</p>` : ''}
                    ${invoiceData.client.city ? `<p>${invoiceData.client.city}, ${invoiceData.client.postal_code || ''}</p>` : ''}
                ` : '<p>Cliente no especificado</p>'}
            </div>
        </div>
        
        <div class="invoice-items">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="text-right">Cantidad</th>
                        <th class="text-right">Precio Unit.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.order?.order_items?.map(item => `
                        <tr>
                            <td>
                                <div style="font-weight: 500;">${item.product_variant?.product?.name || 'Producto'}</div>
                                <div style="color: #6b7280; font-size: 12px;">${item.product_variant?.name || ''}</div>
                            </td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${formatCurrency(item.unit_price)}</td>
                            <td class="text-right">${formatCurrency(item.total_price)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="text-align: center;">No hay productos</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <div class="invoice-summary">
            <table class="summary-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">${formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                    <td>IVA (21%):</td>
                    <td class="text-right">${formatCurrency(taxAmount)}</td>
                </tr>
                <tr class="total-row">
                    <td>TOTAL:</td>
                    <td class="text-right">${formatCurrency(totalAmount)}</td>
                </tr>
            </table>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                    e.preventDefault();
                    window.print();
                }
            });
        });
    </script>
</body>
</html>`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    // Verificar que la factura existe
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()
    
    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }
    
    const invoiceNumber = `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`
    console.log('📄 Generando PDF para factura:', invoiceNumber)
    
    const isProduction = process.env.NODE_ENV === 'production'
    
    // En producción, usar directamente HTML optimizado para evitar problemas de Puppeteer
    if (isProduction) {
      console.log('🏭 Modo producción: usando HTML optimizado para impresión')
      
      // Obtener datos completos de la factura
      const invoiceData = await getInvoiceData(invoiceId)
      if (!invoiceData) {
        return NextResponse.json(
          { error: 'Error obteniendo datos de la factura' },
          { status: 500 }
        )
      }
      
      const htmlContent = generateOptimizedPrintHTML(invoiceData)
      
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="factura-${invoiceNumber}.html"`,
          'X-Print-Optimized': 'true'
        }
      })
    }
    
    try {
      // En desarrollo, intentar generar el PDF con Puppeteer
      console.log('🚀 Iniciando generación de PDF para:', invoiceNumber)
      const pdfBuffer = await PDFService.generateInvoicePDF(invoiceId)
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF generado está vacío')
      }
      
      console.log('✅ PDF generado correctamente:', pdfBuffer.length, 'bytes')
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="factura-${invoiceNumber}.pdf"`
        }
      })
    } catch (pdfError: any) {
      console.error('❌ Error generando PDF con Puppeteer:', pdfError.message)
      
      // Fallback: retornar HTML optimizado incluso en desarrollo
      console.log('🔄 Fallback: usando HTML optimizado para impresión')
      
      const invoiceData = await getInvoiceData(invoiceId)
      if (!invoiceData) {
        return NextResponse.json(
          { error: 'Error obteniendo datos de la factura' },
          { status: 500 }
        )
      }
      
      const htmlContent = generateOptimizedPrintHTML(invoiceData)
      
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="factura-${invoiceNumber}.html"`,
          'X-Fallback-Mode': 'true'
        }
      })
    }
    
  } catch (error: any) {
    console.error('❌ Error en API de PDF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}