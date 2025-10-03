#!/usr/bin/env node

/**
 * Script completo de verificación de APIs para producción y desarrollo
 * Prueba todas las APIs principales del sistema
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const IS_PRODUCTION = BASE_URL.includes('https://');

console.log(`🔍 Verificando APIs en: ${BASE_URL}`);
console.log(`🌍 Entorno: ${IS_PRODUCTION ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
console.log('='.repeat(60));

// Función helper para hacer requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https://') ? https : http;
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const req = lib.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Tests de APIs
const API_TESTS = [
  {
    name: 'Variables de Entorno',
    url: '/api/test-env',
    method: 'GET',
    expectedStatus: 200,
    validate: (response) => {
      return response.data.supabaseUrl === 'Available' && 
             response.data.serviceRoleKey === 'Available';
    }
  },
  {
    name: 'Configuración de Email',
    url: '/api/test-email',
    method: 'GET',
    expectedStatus: 200,
    validate: (response) => {
      return response.data.success === true &&
             response.data.data.environmentVariables.EMAIL_USER === 'SET';
    }
  },
  {
    name: 'Factura específica (requiere ID válido)',
    url: '/api/invoices/test-invoice-id',
    method: 'GET',
    expectedStatus: [200, 404], // 404 es OK si no existe la factura de prueba
    validate: (response) => {
      return response.status === 404 || (response.status === 200 && response.data.invoice);
    }
  },
  {
    name: 'Facturas sin parámetros',
    url: '/api/invoices',
    method: 'GET',
    expectedStatus: 400,
    validate: (response) => {
      return response.data.error && response.data.error.includes('requeridos');
    }
  },
  {
    name: 'Admin Orders (sin autenticación)',
    url: '/api/admin/orders',
    method: 'GET',
    expectedStatus: 401,
    validate: (response) => {
      return response.data.error && response.data.error.includes('autorizado');
    }
  }
];

// Ejecutar tests
async function runTests() {
  console.log('🧪 Iniciando pruebas de APIs...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of API_TESTS) {
    try {
      console.log(`🔄 Probando: ${test.name}`);
      console.log(`   URL: ${BASE_URL}${test.url}`);
      
      const response = await makeRequest(`${BASE_URL}${test.url}`, {
        method: test.method,
        body: test.body
      });

      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
      
      const statusOk = expectedStatuses.includes(response.status);
      const validationOk = test.validate ? test.validate(response) : true;
      
      if (statusOk && validationOk) {
        console.log(`   ✅ PASS - Status: ${response.status}`);
        passed++;
        results.push({ test: test.name, status: 'PASS', details: `Status: ${response.status}` });
      } else {
        console.log(`   ❌ FAIL - Status: ${response.status} (esperado: ${test.expectedStatus})`);
        console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
        failed++;
        results.push({ 
          test: test.name, 
          status: 'FAIL', 
          details: `Status: ${response.status}, Expected: ${test.expectedStatus}`,
          response: response.data
        });
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
      failed++;
      results.push({ test: test.name, status: 'ERROR', details: error.message });
    }
    
    console.log(''); // Línea en blanco
  }

  // Resumen
  console.log('='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas exitosas: ${passed}`);
  console.log(`❌ Pruebas fallidas: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  } else {
    console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON');
    console.log('\n📋 Detalles de fallos:');
    results.filter(r => r.status !== 'PASS').forEach(result => {
      console.log(`   • ${result.test}: ${result.details}`);
    });
  }

  // Guardar resultados en archivo
  const resultsFile = path.join(__dirname, '..', 'api-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: IS_PRODUCTION ? 'production' : 'development',
    baseUrl: BASE_URL,
    summary: { passed, failed, total: passed + failed },
    results
  }, null, 2));
  
  console.log(`\n💾 Resultados guardados en: ${resultsFile}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    await makeRequest(`${BASE_URL}/api/test-env`);
    return true;
  } catch (error) {
    console.error(`❌ Servidor no disponible en ${BASE_URL}`);
    console.error(`   Error: ${error.message}`);
    console.log('\n💡 Sugerencias:');
    console.log('   • Asegúrate de que el servidor esté corriendo');
    console.log('   • Para desarrollo: pnpm run dev');
    console.log('   • Para producción: pnpm run build && pnpm run start');
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación completa de APIs...\n');
  
  if (!(await checkServer())) {
    process.exit(1);
  }
  
  await runTests();
}

main().catch(console.error);