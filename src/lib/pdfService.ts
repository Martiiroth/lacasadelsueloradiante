import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export class PDFService {
  // Método para obtener el logo en base64
  private static getLogoBase64(): string {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
      const logoBuffer = fs.readFileSync(logoPath)
      return logoBuffer.toString('base64')
    } catch (error) {
      console.warn('⚠️ No se pudo cargar el logo, usando placeholder')
      // Retornar un placeholder pequeño en base64 si no se encuentra el logo
      return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  }

  static async generateInvoicePDF(invoiceId: string): Promise<Uint8Array> {
    let browser = null
    
    try {
      // Obtener los datos de la factura directamente desde Supabase
      console.log('📄 Obteniendo datos de la factura:', invoiceId)
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Obtener factura específica con información del cliente y pedido
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
              qty,
              price_cents,
              variant:product_variants (
                id,
                title,
                sku,
                product:products (
                  title
                )
              )
            )
          )
        `)
        .eq('id', invoiceId)
        .single()

      if (error || !invoice) {
        console.error('❌ Error obteniendo factura:', error)
        throw new Error(`Factura no encontrada: ${invoiceId}`)
      }
      
      console.log('📄 Datos de factura obtenidos:', `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
      
      // Generar HTML de la factura directamente
      const invoiceHTML = await this.generateInvoiceHTML(invoice)
      
      // Usar el método de generación desde HTML
      return await this.generateInvoicePDFFromHTML(invoiceHTML, `${invoice.prefix}${invoice.invoice_number}${invoice.suffix}`)
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      throw new Error(`Error generando PDF de la factura ${invoiceId}: ${errorMessage}`)
    }
  }

  // Método para generar el HTML de la factura
  private static async generateInvoiceHTML(invoice: any): Promise<string> {
    // Formatear datos
    const formatPrice = (cents: number) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(cents / 100)
    }

    const totalCents = invoice.total_cents
    const baseImponible = Math.round(totalCents / 1.21)
    const iva = totalCents - baseImponible

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
        .invoice-content { background: white; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .logo-section { display: flex; align-items: center; }
        .company-info { text-align: right; font-size: 14px; }
        .company-info .font-semibold { font-weight: 600; }
        .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 32px; }
        .invoice-left h3 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0; }
        .invoice-right h2 { font-size: 24px; font-weight: bold; color: #111827; margin: 0 0 16px 0; }
        .invoice-left p, .invoice-right p { color: #374151; margin: 4px 0; font-size: 14px; }
        .invoice-left p strong, .invoice-right p strong { color: #111827; }
        .client-details { font-size: 14px; line-height: 1.6; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        .items-table th { background: #F3F4F6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #E5E7EB; }
        .items-table td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
        .totals { margin-left: auto; width: 300px; }
        .totals div { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .totals .total-row { border-top: 1px solid #D1D5DB; font-weight: bold; }
        .legal-text { margin-top: 48px; padding-top: 24px; border-top: 1px solid #D1D5DB; font-size: 12px; color: #6B7280; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="invoice-content">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                <img src="data:image/png;base64,${this.getLogoBase64()}" alt="Logo" style="width: 120px; height: 120px; margin-right: 24px;" />
            </div>
            <div class="company-info">
                <div class="font-semibold">T&V Servicios y Complementos S.L.</div>
                <div>CIF B-86715893</div>
                <div>Registro RI-AZE con el número 17208</div>
            </div>
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
            <div class="invoice-left">
                <h3>Facturar a:</h3>
                <div class="client-details">
                    <strong>${invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Cliente no especificado'}</strong><br>
                    ${invoice.client?.company_name ? `${invoice.client.company_name}<br>` : ''}
                    CIF/NIF: ${invoice.client?.nif_cif || 'No especificado'}<br>
                    ${invoice.client?.address_line1 ? `${invoice.client.address_line1}${invoice.client.address_line2 ? `, ${invoice.client.address_line2}` : ''}<br>${invoice.client.city ? `${invoice.client.city}, ` : ''}${invoice.client.postal_code || ''}` : 'Dirección no especificada'}
                </div>
            </div>
            <div class="invoice-right">
                <h2>FACTURA ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}</h2>
                <p><strong>Número de factura:</strong> ${invoice.prefix}${invoice.invoice_number}${invoice.suffix}</p>
                <p><strong>Fecha de factura:</strong> ${new Date(invoice.created_at).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}</p>
                <p><strong>Número de pedido:</strong> #${invoice.order?.id?.slice(-8).toUpperCase() || 'N/A'}</p>
                <p><strong>Fecha de pedido:</strong> ${invoice.order?.created_at ? new Date(invoice.order.created_at).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                }) : 'N/A'}</p>
                <p><strong>Método de pago:</strong> Pagar con Tarjeta</p>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio (sin IVA)</th>
                    <th>IVA</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.order?.order_items?.map((item: any) => {
                  const itemBase = Math.round(item.price_cents / 1.21)
                  const itemIva = item.price_cents - itemBase
                  return `
                    <tr>
                        <td>${item.variant?.product?.title || item.variant?.title || 'Producto'}</td>
                        <td>${item.qty}</td>
                        <td>${formatPrice(itemBase)}</td>
                        <td>${formatPrice(itemIva)}</td>
                    </tr>
                  `
                }).join('') || '<tr><td colspan="4">No hay productos</td></tr>'}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div>
                <span>Base imponible</span>
                <span>${formatPrice(baseImponible)}</span>
            </div>
            <div>
                <span>IVA 21%</span>
                <span>${formatPrice(iva)}</span>
            </div>
            <div class="total-row">
                <span>Total</span>
                <span>${formatPrice(totalCents)}</span>
            </div>
        </div>

        <!-- Legal Text -->
        <div class="legal-text">
            <p>
                Sus datos serán tratados con la finalidad de gestionar la relación comercial con Vd. y prestarle los servicios solicitados. Los datos se conservarán mientras dure la relación comercial y, posteriormente, durante los plazos de prescripción legal. La base legal del tratamiento es la ejecución del contrato. Sus datos no se comunicarán a terceros, salvo obligación legal. Puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición dirigiéndose a TYV SERVICIOS Y COMPLEMENTOS SL – Avenida de Europa, 26. Edificio 3. Planta baja oficina B207. 28224 Pozuelo de Alarcón (Madrid) o enviando un correo electrónico a: administracion@lacasadelsuelo.com acreditando su identidad mediante copia del DNI. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos.
            </p>
        </div>
    </div>
</body>
</html>
    `
  }
  
  static async generateInvoicePDFFromHTML(invoiceHTML: string, invoiceNumber: string): Promise<Uint8Array> {
    let browser = null
    const maxRetries = 3
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 PDFService - Attempt ${attempt}/${maxRetries} - Launching Puppeteer browser...`)
        console.log('🔧 PDFService - Environment:', {
          NODE_ENV: process.env.NODE_ENV,
          PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
          platform: process.platform,
          arch: process.arch,
          attempt: attempt
        })
        
        browser = await puppeteer.launch({ 
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--no-default-browser-check',
            '--no-experiments',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
          ],
          timeout: 30000
        })
        
        console.log(`✅ PDFService - Browser launched successfully on attempt ${attempt}`)
      
        const page = await browser.newPage()
        console.log(`✅ PDFService - Page created successfully on attempt ${attempt}`)
        
        // Configurar el viewport para un tamaño A4
        await page.setViewport({
          width: 794,
          height: 1123,
          deviceScaleFactor: 1
        })
        console.log('✅ PDFService - Viewport configured')
        
        // Cargar el HTML directamente
        console.log('📄 PDFService - Loading HTML content...')
        await page.setContent(invoiceHTML, { 
          waitUntil: 'networkidle0',
          timeout: 20000
        })
        console.log('✅ PDFService - HTML content loaded successfully')
        
        // Generar el PDF
        console.log('📄 PDFService - Generating PDF...')
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm'
          }
        })
        console.log('✅ PDFService - PDF generated successfully, size:', pdf.length, 'bytes')
        
        console.log(`✅ PDF generado exitosamente para factura desde HTML en intento ${attempt}:`, invoiceNumber)
        
        return pdf
        
      } catch (error) {
        lastError = error
        console.error(`❌ Error en intento ${attempt}/${maxRetries} generando PDF:`, error)
        
        if (attempt === maxRetries) {
          console.error('❌ Todos los intentos fallaron, lanzando error final')
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          throw new Error(`Error generando PDF de la factura ${invoiceNumber} después de ${maxRetries} intentos: ${errorMessage}`)
        } else {
          console.log(`🔄 Reintentando en 2 segundos... (intento ${attempt + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } finally {
        if (browser) {
          try {
            await browser.close()
            console.log(`✅ Browser cerrado correctamente en intento ${attempt}`)
          } catch (closeError) {
            console.warn(`⚠️ Error cerrando browser en intento ${attempt}:`, closeError)
          }
          browser = null
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    throw new Error(`Error generando PDF después de ${maxRetries} intentos: ${lastError instanceof Error ? lastError.message : 'Error desconocido'}`)
  }
}