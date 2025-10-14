// Script de diagnóstico completo para problemas de email
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function diagnoseEmailIssues() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE EMAIL')
  console.log('================================\n')

  // 1. Verificar variables de entorno
  console.log('1️⃣ VARIABLES DE ENTORNO:')
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NO DEFINIDO')
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NO DEFINIDO') 
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || '❌ NO DEFINIDO')
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NO DEFINIDO')
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ DEFINIDO' : '❌ NO DEFINIDO')
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || '❌ NO DEFINIDO')
  console.log()

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ FALTAN VARIABLES DE ENTORNO CRÍTICAS')
    return
  }

  // 2. Probar diferentes configuraciones SMTP
  const configurations = [
    {
      name: 'Configuración actual (587 STARTTLS)',
      config: {
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'Puerto 465 SSL',
      config: {
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'Puerto 25 sin cifrado',
      config: {
        host: process.env.EMAIL_HOST,
        port: 25,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    }
  ]

  for (const { name, config } of configurations) {
    console.log(`2️⃣ PROBANDO: ${name}`)
    console.log(`   Host: ${config.host}:${config.port}`)
    
    try {
      const transporter = nodemailer.createTransport(config)
      
      // Verificar conexión
      console.log('   🔍 Verificando conexión...')
      await transporter.verify()
      console.log('   ✅ Conexión exitosa!')
      
      // Enviar email de prueba
      console.log('   📤 Enviando email de prueba...')
      const info = await transporter.sendMail({
        from: `"Test Email" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `Prueba ${name} - ${new Date().toLocaleString()}`,
        text: `Esta es una prueba de la configuración: ${name}\n\nSi recibes este email, esta configuración funciona.`,
        html: `
          <h2>Prueba de Email: ${name}</h2>
          <p>Esta es una prueba de la configuración: <strong>${name}</strong></p>
          <p>Enviado el: ${new Date().toLocaleString()}</p>
          <p>Si recibes este email, ¡esta configuración funciona! ✅</p>
        `
      })
      
      console.log('   ✅ Email enviado exitosamente!')
      console.log('   📬 Message ID:', info.messageId)
      console.log('   📧 Response:', info.response)
      console.log()
      
    } catch (error) {
      console.log('   ❌ Error:', error.message)
      console.log('   📋 Código:', error.code || 'N/A')
      console.log()
    }
  }

  // 3. Verificaciones adicionales
  console.log('3️⃣ VERIFICACIONES ADICIONALES:')
  
  // Verificar resolución DNS
  try {
    const dns = await import('dns')
    const { promisify } = await import('util')
    const lookup = promisify(dns.lookup)
    
    console.log('🌐 Verificando DNS...')
    const result = await lookup(process.env.EMAIL_HOST)
    console.log(`✅ DNS resuelto: ${process.env.EMAIL_HOST} → ${result.address}`)
  } catch (error) {
    console.log('❌ Error DNS:', error.message)
  }

  // Verificar si es un problema de firewall/conectividad
  console.log('\n🔧 POSIBLES SOLUCIONES:')
  console.log('1. Verificar que el servidor mail.lacasadelsueloradiante.es esté funcionando')
  console.log('2. Comprobar que los puertos 587/465/25 estén abiertos')
  console.log('3. Verificar las credenciales EMAIL_USER/EMAIL_PASSWORD')
  console.log('4. Revisar logs del servidor de correo')
  console.log('5. Probar desde el servidor VPS directamente')
  console.log('6. Verificar configuración SPF/DKIM en el dominio')
  
  console.log('\n📧 ALTERNATIVAS:')
  console.log('- Usar Gmail con App Password')
  console.log('- Configurar SendGrid')
  console.log('- Usar Mailgun')
  console.log('- Configurar Amazon SES')
}

diagnoseEmailIssues().catch(console.error)