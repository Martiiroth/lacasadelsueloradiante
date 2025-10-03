#!/usr/bin/env node

/**
 * Script de verificación pre-deploy para producción
 * Verifica que todas las variables de entorno estén configuradas
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para producción...\n');

// Variables requeridas para producción
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'EMAIL_USER',
  'EMAIL_PASSWORD'
];

// Leer archivo .env.production
const envPath = path.join(__dirname, '..', '.env.production');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Archivo .env.production encontrado');
} catch (error) {
  console.error('❌ No se pudo leer .env.production:', error.message);
  process.exit(1);
}

// Verificar cada variable
let allPresent = true;
const envVars = {};

// Parsear variables del archivo
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key] = valueParts.join('=');
    }
  }
});

console.log('\n📋 Verificando variables de entorno:');
requiredEnvVars.forEach(varName => {
  if (envVars[varName] && envVars[varName].length > 0) {
    console.log(`✅ ${varName}: Configurada`);
  } else {
    console.log(`❌ ${varName}: FALTA O VACÍA`);
    allPresent = false;
  }
});

// Verificar estructura de archivos críticos
console.log('\n📁 Verificando archivos críticos:');
const criticalFiles = [
  'src/lib/supabase.ts',
  'src/lib/adminService.ts', 
  'src/lib/invoiceService.ts',
  'src/lib/pdfService.ts',
  'next.config.js',
  'tailwind.config.js',
  'postcss.config.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Presente`);
  } else {
    console.log(`❌ ${file}: FALTA`);
    allPresent = false;
  }
});

// Verificar dependencias críticas en package.json
console.log('\n📦 Verificando dependencias críticas:');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const criticalDeps = [
  '@supabase/supabase-js',
  'next',
  'react', 
  'react-dom',
  'nodemailer',
  'puppeteer'
];

criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep}: FALTA`);
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPresent) {
  console.log('🎉 ¡LISTO PARA PRODUCCIÓN!');
  console.log('✅ Todas las verificaciones pasaron correctamente');
  process.exit(0);
} else {
  console.log('⚠️  REQUIERE ATENCIÓN ANTES DEL DEPLOY');
  console.log('❌ Hay elementos faltantes o mal configurados');
  process.exit(1);
}