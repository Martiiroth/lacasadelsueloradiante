#!/usr/bin/env node

// Script para probar la notificación de nuevo registro
// node test-registration-notification.js

const { config } = require('dotenv');
config();

const testData = {
  clientName: "Juan Pérez García",
  clientEmail: "juan.perez@ejemplo.com",
  phone: "628 123 456",
  nif_cif: "12345678Z",
  region: "Madrid",
  city: "Madrid",
  address_line1: "Calle Ejemplo 123",
  postal_code: "28001",
  activity: "Instalación de suelo radiante",
  company_name: "Calefacciones Pérez S.L.",
  company_position: "Director Técnico",
  registrationDate: new Date().toISOString(),
  registrationSource: 'public'
};

async function testRegistrationEmail() {
  try {
    console.log('🔧 Probando notificación de nuevo registro...');
    console.log('📧 Datos del cliente:', testData.clientName, '-', testData.clientEmail);

    const response = await fetch('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_new_registration_notification',
        registrationData: testData
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email de nuevo registro enviado correctamente');
      console.log('📨 El admin debería haber recibido la notificación');
    } else {
      console.log('❌ Error enviando email:', result.message);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Verificar si estamos ejecutando como script principal
if (require.main === module) {
  console.log('🧪 Test de Notificación de Nuevo Registro');
  console.log('==========================================');
  
  testRegistrationEmail().then(() => {
    console.log('🏁 Prueba completada');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}