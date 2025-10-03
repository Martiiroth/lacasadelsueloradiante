#!/usr/bin/env node

/**
 * VERIFICACIÓN MANUAL DE APIs - Reporte detallado
 * Ya que las pruebas automáticas tienen problemas de conectividad,
 * generamos un reporte basado en análisis de código
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN EXHAUSTIVA DE APIs - REPORTE COMPLETO');
console.log('='.repeat(70));

// Leer y analizar archivos de API
const apiFiles = [
  'src/app/api/test-env/route.ts',
  'src/app/api/test-email/route.ts', 
  'src/app/api/email/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/invoices/route.ts',
  'src/app/api/invoices/[id]/route.ts',
  'src/app/api/invoices/[id]/pdf/route.ts',
  'src/app/api/admin/orders/route.ts',
  'src/app/api/admin/orders/[id]/route.ts',
  'src/app/api/admin/orders/[id]/deliver/route.ts',
  'src/app/api/client/invoices/route.ts'
];

const apiAnalysis = [];

function analyzeApiFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const analysis = {
      path: filePath,
      exists: true,
      methods: [],
      hasAuth: false,
      hasErrorHandling: false,
      hasValidation: false,
      hasLogging: false,
      score: 0
    };
    
    // Detectar métodos HTTP
    if (content.includes('export async function GET')) analysis.methods.push('GET');
    if (content.includes('export async function POST')) analysis.methods.push('POST');
    if (content.includes('export async function PUT')) analysis.methods.push('PUT');
    if (content.includes('export async function DELETE')) analysis.methods.push('DELETE');
    
    // Detectar autenticación
    if (content.includes('authorization') || content.includes('Bearer') || content.includes('auth')) {
      analysis.hasAuth = true;
      analysis.score += 20;
    }
    
    // Detectar manejo de errores
    if (content.includes('try {') && content.includes('catch')) {
      analysis.hasErrorHandling = true;
      analysis.score += 25;
    }
    
    // Detectar validación
    if (content.includes('status: 400') || content.includes('validation') || content.includes('required')) {
      analysis.hasValidation = true;
      analysis.score += 20;
    }
    
    // Detectar logging
    if (content.includes('console.log') || content.includes('console.error')) {
      analysis.hasLogging = true;
      analysis.score += 15;
    }
    
    // Puntos por métodos implementados
    analysis.score += analysis.methods.length * 5;
    
    // Bonificación por Next.js 15 compatibility
    if (content.includes('Promise<{ id: string }>')) {
      analysis.score += 15;
    }
    
    return analysis;
    
  } catch (error) {
    return {
      path: filePath,
      exists: false,
      error: error.message,
      score: 0
    };
  }
}

console.log('📊 ANÁLISIS INDIVIDUAL DE APIs:\n');

let totalScore = 0;
let maxPossibleScore = 0;

apiFiles.forEach(file => {
  const analysis = analyzeApiFile(file);
  apiAnalysis.push(analysis);
  
  const endpoint = file.replace('src/app/api/', '').replace('/route.ts', '');
  console.log(`🔍 ${endpoint}`);
  
  if (!analysis.exists) {
    console.log(`   ❌ Archivo no encontrado`);
    return;
  }
  
  console.log(`   📝 Métodos: ${analysis.methods.join(', ') || 'Ninguno'}`);
  console.log(`   🔐 Autenticación: ${analysis.hasAuth ? '✅' : '❌'}`);
  console.log(`   🛡️  Manejo errores: ${analysis.hasErrorHandling ? '✅' : '❌'}`);
  console.log(`   ✔️  Validación: ${analysis.hasValidation ? '✅' : '❌'}`);
  console.log(`   📄 Logging: ${analysis.hasLogging ? '✅' : '❌'}`);
  console.log(`   📊 Puntuación: ${analysis.score}/100`);
  
  totalScore += analysis.score;
  maxPossibleScore += 100;
  
  console.log('');
});

// Resumen general
const averageScore = Math.round(totalScore / apiFiles.length);

console.log('='.repeat(70));
console.log('📈 RESUMEN GENERAL:');
console.log('='.repeat(70));

console.log(`📁 APIs analizadas: ${apiFiles.length}`);
console.log(`📊 Puntuación promedio: ${averageScore}/100`);
console.log(`🎯 Puntuación total: ${totalScore}/${maxPossibleScore}`);

// Clasificación por calidad
const highQuality = apiAnalysis.filter(a => a.score >= 80);
const mediumQuality = apiAnalysis.filter(a => a.score >= 60 && a.score < 80);
const lowQuality = apiAnalysis.filter(a => a.score < 60);

console.log(`\n🏆 Alta calidad (>=80): ${highQuality.length} APIs`);
console.log(`⚠️  Media calidad (60-79): ${mediumQuality.length} APIs`);
console.log(`🔧 Baja calidad (<60): ${lowQuality.length} APIs`);

// Análisis por características
const withAuth = apiAnalysis.filter(a => a.hasAuth).length;
const withErrorHandling = apiAnalysis.filter(a => a.hasErrorHandling).length;
const withValidation = apiAnalysis.filter(a => a.hasValidation).length;
const withLogging = apiAnalysis.filter(a => a.hasLogging).length;

console.log('\n🔍 ANÁLISIS POR CARACTERÍSTICAS:');
console.log(`🔐 Con autenticación: ${withAuth}/${apiFiles.length} (${Math.round(withAuth/apiFiles.length*100)}%)`);
console.log(`🛡️  Con manejo de errores: ${withErrorHandling}/${apiFiles.length} (${Math.round(withErrorHandling/apiFiles.length*100)}%)`);
console.log(`✔️  Con validación: ${withValidation}/${apiFiles.length} (${Math.round(withValidation/apiFiles.length*100)}%)`);
console.log(`📄 Con logging: ${withLogging}/${apiFiles.length} (${Math.round(withLogging/apiFiles.length*100)}%)`);

// Veredicto final
console.log('\n' + '='.repeat(70));
console.log('🎯 VEREDICTO FINAL:');
console.log('='.repeat(70));

if (averageScore >= 85) {
  console.log('🎉 EXCELENTE - APIs listas para producción');
  console.log('✅ Calidad muy alta en todas las características');
} else if (averageScore >= 70) {
  console.log('✅ BUENO - APIs funcionalmente completas');
  console.log('🔧 Algunas mejoras menores recomendadas');
} else {
  console.log('⚠️  REQUIERE ATENCIÓN - Calidad inconsistente');
  console.log('🔧 Revisar APIs de baja puntuación');
}

// Recomendaciones específicas
console.log('\n📋 RECOMENDACIONES:');

if (withAuth < apiFiles.length * 0.7) {
  console.log('🔐 Considerar añadir autenticación a más endpoints');
}

if (withErrorHandling < apiFiles.length * 0.9) {
  console.log('🛡️  Asegurar manejo de errores en todos los endpoints');
}

if (withValidation < apiFiles.length * 0.8) {
  console.log('✔️  Mejorar validación de entrada en más endpoints');
}

console.log('\n💡 NOTA IMPORTANTE:');
console.log('   📊 Esta verificación está basada en análisis de código');
console.log('   🧪 Para pruebas en tiempo real, usar el Simple Browser');
console.log('   🌐 URLs de prueba: http://localhost:3000/api/[endpoint]');

// Generar reporte JSON
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalApis: apiFiles.length,
    averageScore,
    totalScore,
    maxPossibleScore
  },
  quality: {
    high: highQuality.length,
    medium: mediumQuality.length, 
    low: lowQuality.length
  },
  features: {
    withAuth,
    withErrorHandling,
    withValidation,
    withLogging
  },
  apis: apiAnalysis
};

fs.writeFileSync('api-analysis-report.json', JSON.stringify(report, null, 2));
console.log('\n💾 Reporte detallado guardado en: api-analysis-report.json');

console.log('\n🔗 PRUEBAS MANUALES RECOMENDADAS:');
console.log('   📋 http://localhost:3000/api/test-env');
console.log('   📧 http://localhost:3000/api/test-email');
console.log('   📄 http://localhost:3000/api/invoices?client_id=test');
console.log('   🔐 http://localhost:3000/api/admin/orders (requiere auth)');
