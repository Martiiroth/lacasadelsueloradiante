#!/usr/bin/env node

/**
 * Script para verificar APIs en producción
 * Ejecuta pruebas contra el servidor de producción
 */

const https = require('https');
const http = require('http');

// Configurar el dominio de producción
const PRODUCTION_DOMAIN = process.argv[2] || 'localhost:3000';
const USE_HTTPS = PRODUCTION_DOMAIN.includes('.') && !PRODUCTION_DOMAIN.includes('localhost');
const BASE_URL = `${USE_HTTPS ? 'https' : 'http'}://${PRODUCTION_DOMAIN}`;

console.log(`🌐 Verificando APIs en producción: ${BASE_URL}\n`);

// Lista de endpoints a verificar (APIs reales de la aplicación)
const endpoints = [
  {
    path: '/api/test-env',
    method: 'GET',
    name: 'Test Environment Variables',
    expected: 200
  },
  {
    path: '/api/test-email',
    method: 'GET', 
    name: 'Test Email Configuration',
    expected: 200
  },
  {
    path: '/api/invoices',
    method: 'GET',
    name: 'Invoices API', 
    expected: [200, 401] // Puede requerir auth
  },
  {
    path: '/api/admin/clients',
    method: 'GET',
    name: 'Admin Clients API',
    expected: [200, 401, 403] // Requiere autenticación admin
  },
  {
    path: '/api/admin/orders',
    method: 'GET',
    name: 'Admin Orders API',
    expected: [200, 401, 403] // Requiere autenticación admin
  },
  {
    path: '/api/notifications',
    method: 'GET',
    name: 'Notifications API',
    expected: [200, 401] // Puede requerir auth
  }
];

// Función para hacer peticiones HTTP/HTTPS
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const requestModule = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Production-API-Checker/1.0',
        ...headers
      },
      timeout: 10000 // 10 segundos timeout
    };

    const req = requestModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        url: url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url: url
      });
    });

    req.end();
  });
}

// Función para verificar un endpoint
async function checkEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  
  try {
    console.log(`🔍 Verificando: ${endpoint.name}`);
    console.log(`   URL: ${url}`);
    
    const response = await makeRequest(url, endpoint.method);
    
    const expectedCodes = Array.isArray(endpoint.expected) ? endpoint.expected : [endpoint.expected];
    const isSuccess = expectedCodes.includes(response.statusCode);
    
    if (isSuccess) {
      console.log(`   ✅ Status: ${response.statusCode} - OK`);
      
      // Intentar parsear JSON para mostrar info adicional
      try {
        const jsonData = JSON.parse(response.body);
        if (jsonData.message) {
          console.log(`   📄 Mensaje: ${jsonData.message}`);
        }
        if (jsonData.data && typeof jsonData.data === 'object') {
          console.log(`   📊 Datos: ${Object.keys(jsonData.data).length} campos`);
        }
      } catch (e) {
        // No es JSON, mostrar primeros caracteres
        const preview = response.body.substring(0, 100).replace(/\n/g, ' ');
        if (preview) {
          console.log(`   📄 Preview: ${preview}${response.body.length > 100 ? '...' : ''}`);
        }
      }
    } else {
      console.log(`   ❌ Status: ${response.statusCode} - Error inesperado`);
      console.log(`   📄 Response: ${response.body.substring(0, 200)}`);
    }
    
    return {
      endpoint: endpoint.name,
      url: url,
      status: response.statusCode,
      success: isSuccess,
      responseTime: Date.now()
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.error}`);
    return {
      endpoint: endpoint.name,
      url: url,
      error: error.error,
      success: false
    };
  }
}

// Función principal
async function main() {
  console.log(`Verificando ${endpoints.length} endpoints...\n`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
    console.log(''); // Línea en blanco
  }
  
  // Resumen final
  console.log('📊 RESUMEN DE VERIFICACIÓN:');
  console.log('=' * 50);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Exitosos: ${successful.length}/${results.length}`);
  console.log(`❌ Fallidos: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Endpoints con problemas:');
    failed.forEach(result => {
      console.log(`   - ${result.endpoint}: ${result.error || `Status ${result.status}`}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Endpoints funcionando:');
    successful.forEach(result => {
      console.log(`   - ${result.endpoint}: Status ${result.status}`);
    });
  }
  
  const successRate = (successful.length / results.length) * 100;
  console.log(`\n🎯 Tasa de éxito: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 80) {
    console.log('🎉 APIs en buen estado para producción!');
    process.exit(0);
  } else {
    console.log('⚠️  Algunas APIs necesitan atención antes de producción');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { makeRequest, checkEndpoint };