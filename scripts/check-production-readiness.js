#!/usr/bin/env node

/**
 * VERIFICACIÓN DE COMPATIBILIDAD CON PRODUCCIÓN
 * Analiza el código y configuración para garantizar funcionamiento en producción
 */

const fs = require('fs');
const path = require('path');

console.log('🏭 VERIFICACIÓN DE COMPATIBILIDAD CON PRODUCCIÓN');
console.log('='.repeat(60));

// Función para verificar archivos
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    return { exists: true, content };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

// 1. VERIFICAR VARIABLES DE ENTORNO PARA PRODUCCIÓN
console.log('🔍 1. VARIABLES DE ENTORNO');
console.log('-'.repeat(40));

const envProd = checkFile('.env.production');
if (envProd.exists) {
  console.log('✅ .env.production encontrado');
  
  // Verificar variables críticas
  const criticalVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];
  
  criticalVars.forEach(varName => {
    if (envProd.content.includes(`${varName}=`)) {
      const line = envProd.content.split('\n').find(l => l.startsWith(varName));
      const hasValue = line && line.split('=')[1] && line.split('=')[1].trim().length > 0;
      console.log(`   ${hasValue ? '✅' : '❌'} ${varName}: ${hasValue ? 'Configurada' : 'Vacía'}`);
    } else {
      console.log(`   ❌ ${varName}: No encontrada`);
    }
  });
} else {
  console.log('❌ .env.production NO encontrado');
}

// 2. VERIFICAR CONFIGURACIÓN DE NEXT.JS
console.log('\n🔧 2. CONFIGURACIÓN DE NEXT.JS');
console.log('-'.repeat(40));

const nextConfig = checkFile('next.config.js');
if (nextConfig.exists) {
  console.log('✅ next.config.js encontrado');
  
  // Verificar configuraciones críticas para producción
  const prodChecks = [
    { key: 'output:', desc: 'Modo de salida' },
    { key: 'eslint:', desc: 'Configuración ESLint' },
    { key: 'images:', desc: 'Optimización de imágenes' },
    { key: 'webpack:', desc: 'Configuración webpack' }
  ];
  
  prodChecks.forEach(check => {
    const hasConfig = nextConfig.content.includes(check.key);
    console.log(`   ${hasConfig ? '✅' : '⚠️ '} ${check.desc}: ${hasConfig ? 'Configurado' : 'No configurado'}`);
  });
  
  // Verificar si está preparado para producción
  const hasStandalone = nextConfig.content.includes("output: 'standalone'");
  console.log(`   ${hasStandalone ? '✅' : '❌'} Standalone build: ${hasStandalone ? 'Habilitado' : 'No habilitado'}`);
  
} else {
  console.log('❌ next.config.js NO encontrado');
}

// 3. VERIFICAR APIS PARA PRODUCCIÓN
console.log('\n🌐 3. ANÁLISIS DE APIs PARA PRODUCCIÓN');
console.log('-'.repeat(40));

const apiFiles = [
  'src/app/api/test-env/route.ts',
  'src/app/api/admin/orders/route.ts',
  'src/app/api/email/route.ts'
];

let apiProductionScore = 0;
let maxApiScore = 0;

apiFiles.forEach(apiFile => {
  const api = checkFile(apiFile);
  const apiName = apiFile.split('/').slice(-2, -1)[0];
  
  if (api.exists) {
    console.log(`\n   📡 ${apiName}:`);
    let score = 0;
    
    // Verificar manejo de errores
    const hasErrorHandling = api.content.includes('try {') && api.content.includes('catch');
    console.log(`      🛡️  Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
    if (hasErrorHandling) score += 25;
    
    // Verificar logging
    const hasLogging = api.content.includes('console.log') || api.content.includes('console.error');
    console.log(`      📝 Logging: ${hasLogging ? '✅' : '❌'}`);
    if (hasLogging) score += 20;
    
    // Verificar variables de entorno
    const usesEnvVars = api.content.includes('process.env');
    console.log(`      🔑 Variables entorno: ${usesEnvVars ? '✅' : '❌'}`);
    if (usesEnvVars) score += 25;
    
    // Verificar respuestas HTTP apropiadas
    const hasHttpResponses = api.content.includes('NextResponse.json');
    console.log(`      📤 HTTP responses: ${hasHttpResponses ? '✅' : '❌'}`);
    if (hasHttpResponses) score += 20;
    
    // Verificar autenticación (para APIs admin)
    const hasAuth = api.content.includes('authorization') || api.content.includes('auth');
    const needsAuth = apiFile.includes('admin');
    if (needsAuth) {
      console.log(`      🔐 Authentication: ${hasAuth ? '✅' : '❌'}`);
      if (hasAuth) score += 10;
    } else {
      score += 10; // No necesita auth
    }
    
    console.log(`      📊 Score: ${score}/100`);
    apiProductionScore += score;
    maxApiScore += 100;
  }
});

// 4. VERIFICAR DEPENDENCIAS PARA PRODUCCIÓN
console.log('\n📦 4. DEPENDENCIAS PARA PRODUCCIÓN');
console.log('-'.repeat(40));

const packageJson = checkFile('package.json');
if (packageJson.exists) {
  const pkg = JSON.parse(packageJson.content);
  console.log('✅ package.json encontrado');
  
  // Verificar scripts de producción
  const scripts = pkg.scripts || {};
  console.log(`   🏗️  build script: ${scripts.build ? '✅' : '❌'}`);
  console.log(`   🚀 start script: ${scripts.start ? '✅' : '❌'}`);
  
  // Verificar dependencias críticas
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const criticalDeps = [
    '@supabase/supabase-js',
    'next',
    'react',
    'nodemailer',
    'puppeteer'
  ];
  
  criticalDeps.forEach(dep => {
    console.log(`   📚 ${dep}: ${deps[dep] ? '✅ ' + deps[dep] : '❌ No encontrada'}`);
  });
  
} else {
  console.log('❌ package.json NO encontrado');
}

// 5. VERIFICAR CONFIGURACIÓN DE DOCKER (si existe)
console.log('\n🐳 5. CONFIGURACIÓN DE DOCKER');
console.log('-'.repeat(40));

const dockerfile = checkFile('Dockerfile');
if (dockerfile.exists) {
  console.log('✅ Dockerfile encontrado');
  
  // Verificar elementos críticos del Dockerfile
  const dockerChecks = [
    { key: 'FROM node:', desc: 'Base image Node.js' },
    { key: 'COPY package', desc: 'Copia de dependencias' },
    { key: 'RUN npm install', desc: 'Instalación dependencias' },
    { key: 'EXPOSE', desc: 'Puerto expuesto' },
    { key: 'CMD', desc: 'Comando de inicio' }
  ];
  
  dockerChecks.forEach(check => {
    const hasConfig = dockerfile.content.includes(check.key);
    console.log(`   ${hasConfig ? '✅' : '❌'} ${check.desc}: ${hasConfig ? 'Configurado' : 'Faltante'}`);
  });
} else {
  console.log('⚠️  Dockerfile no encontrado (opcional)');
}

const dockerCompose = checkFile('docker-compose.yml');
if (dockerCompose.exists) {
  console.log('✅ docker-compose.yml encontrado');
  
  const hasNextService = dockerCompose.content.includes('nextjs') || dockerCompose.content.includes('app');
  const hasPortMapping = dockerCompose.content.includes('3000:3000');
  const hasEnvFile = dockerCompose.content.includes('env_file') || dockerCompose.content.includes('.env');
  
  console.log(`   🚀 Servicio Next.js: ${hasNextService ? '✅' : '❌'}`);
  console.log(`   🔌 Port mapping: ${hasPortMapping ? '✅' : '❌'}`);
  console.log(`   🔑 Variables entorno: ${hasEnvFile ? '✅' : '❌'}`);
} else {
  console.log('⚠️  docker-compose.yml no encontrado (opcional)');
}

// RESUMEN FINAL
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE COMPATIBILIDAD CON PRODUCCIÓN');
console.log('='.repeat(60));

// Calcular puntuación general
const avgApiScore = maxApiScore > 0 ? Math.round(apiProductionScore / maxApiScore * 100) : 0;

console.log(`📡 APIs promedio: ${avgApiScore}% preparadas para producción`);
console.log(`🔑 Variables de entorno: ${envProd.exists ? '✅ Configuradas' : '❌ Faltantes'}`);
console.log(`⚙️  Next.js config: ${nextConfig.exists ? '✅ Presente' : '❌ Faltante'}`);
console.log(`📦 Package.json: ${packageJson.exists ? '✅ Completo' : '❌ Faltante'}`);

// Veredicto final
let productionReadiness = 'UNKNOWN';
if (envProd.exists && nextConfig.exists && packageJson.exists && avgApiScore >= 80) {
  productionReadiness = 'READY';
  console.log('\n🎉 VEREDICTO: ✅ LISTO PARA PRODUCCIÓN');
  console.log('✅ Todas las verificaciones críticas pasaron');
} else if (avgApiScore >= 60) {
  productionReadiness = 'MOSTLY_READY';
  console.log('\n⚠️  VEREDICTO: 🔧 CASI LISTO - REQUIERE AJUSTES MENORES');
  console.log('🔧 Algunas configuraciones necesitan atención');
} else {
  productionReadiness = 'NOT_READY';
  console.log('\n❌ VEREDICTO: 🚨 REQUIERE TRABAJO ANTES DE PRODUCCIÓN');
  console.log('🔧 Varias configuraciones críticas faltantes');
}

// Recomendaciones específicas
console.log('\n📋 RECOMENDACIONES PARA PRODUCCIÓN:');

if (!envProd.exists) {
  console.log('🔑 Crear/verificar archivo .env.production con todas las variables');
}

if (avgApiScore < 80) {
  console.log('🌐 Mejorar manejo de errores y logging en APIs');
}

if (!dockerfile.exists) {
  console.log('🐳 Considerar añadir Dockerfile para despliegue containerizado');
}

console.log('🔒 Verificar que todas las APIs admin tengan autenticación');
console.log('🧪 Realizar pruebas de carga en ambiente similar a producción');
console.log('📊 Configurar monitoring y logging para producción');

// Generar reporte
const report = {
  timestamp: new Date().toISOString(),
  productionReadiness,
  scores: {
    apis: avgApiScore,
    configuration: nextConfig.exists ? 100 : 0,
    environment: envProd.exists ? 100 : 0,
    dependencies: packageJson.exists ? 100 : 0
  },
  files: {
    envProduction: envProd.exists,
    nextConfig: nextConfig.exists,
    packageJson: packageJson.exists,
    dockerfile: dockerfile.exists,
    dockerCompose: dockerCompose.exists
  }
};

fs.writeFileSync('production-readiness-report.json', JSON.stringify(report, null, 2));
console.log('\n💾 Reporte completo guardado en: production-readiness-report.json');

process.exit(productionReadiness === 'READY' ? 0 : 1);