import { NextRequest, NextResponse } from 'next/server'
import { PDFService } from '@/lib/pdfService'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id
    
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
    
    console.log('📄 Generando PDF para factura:', invoice.number)
    
    // Generar el PDF
    const pdfBuffer = await PDFService.generateInvoicePDF(invoiceId)
    
    // Retornar el PDF como response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${invoice.number}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json(
      { error: `Error generando PDF: ${errorMessage}` },
      { status: 500 }
    )
  }
}