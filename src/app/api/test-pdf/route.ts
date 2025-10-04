import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing PDF generation capabilities...')
    
    // Verificar si Puppeteer está disponible
    let puppeteer
    try {
      puppeteer = require('puppeteer')
      console.log('✅ Puppeteer module loaded successfully')
    } catch (error) {
      console.error('❌ Puppeteer module not found:', error)
      return NextResponse.json({
        success: false,
        error: 'Puppeteer module not available',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Intentar lanzar un navegador
    let browser = null
    try {
      console.log('🚀 Attempting to launch browser...')
      
      browser = await puppeteer.launch({ 
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })
      
      console.log('✅ Browser launched successfully')
      
      // Crear una página de prueba
      const page = await browser.newPage()
      console.log('✅ Page created successfully')
      
      // Probar generación de PDF básico
      const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test PDF</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>PDF Test</h1>
          <p>This is a test PDF generated at ${new Date().toISOString()}</p>
          <p>If you can see this, Puppeteer is working correctly!</p>
        </body>
        </html>
      `
      
      await page.setContent(testHTML, { waitUntil: 'networkidle0', timeout: 10000 })
      console.log('✅ HTML content loaded successfully')
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true
      })
      
      console.log('✅ PDF generated successfully, size:', pdf.length, 'bytes')
      
      return NextResponse.json({
        success: true,
        message: 'PDF generation is working correctly',
        puppeteerVersion: puppeteer._preferredRevision || 'unknown',
        pdfSize: pdf.length,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'default',
          platform: process.platform,
          arch: process.arch
        }
      })
      
    } catch (error) {
      console.error('❌ Error launching browser or generating PDF:', error)
      return NextResponse.json({
        success: false,
        error: 'Browser launch or PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'default',
          platform: process.platform,
          arch: process.arch
        }
      }, { status: 500 })
    } finally {
      if (browser) {
        await browser.close()
        console.log('✅ Browser closed successfully')
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in PDF test:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}