// Test del StorageService - Ejecutar en consola del navegador
// Copiar y pegar este código para probar la funcionalidad

console.log('🧪 Iniciando pruebas del StorageService...');

// 1. Crear un archivo de prueba (simular)
const createTestFile = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  // Dibujar algo simple
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 50, 50);
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(50, 0, 50, 50);
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 50, 50, 50);
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(50, 50, 50, 50);
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
};

// 2. Función de prueba principal
const testStorageService = async () => {
  try {
    // Importar StorageService (asumiendo que está disponible globalmente o mediante import)
    const { StorageService } = await import('/src/lib/storageService.ts');
    
    console.log('✅ StorageService importado correctamente');
    
    // Crear archivo de prueba
    const testFile = await createTestFile();
    const file = new File([testFile], 'test-image.png', { type: 'image/png' });
    
    console.log('✅ Archivo de prueba creado:', file.name, file.size, 'bytes');
    
    // Probar subida
    console.log('📤 Subiendo archivo...');
    const uploadResult = await StorageService.uploadFile(file, 'test');
    
    if (uploadResult.error) {
      console.error('❌ Error subiendo archivo:', uploadResult.error);
      return;
    }
    
    console.log('✅ Archivo subido exitosamente:');
    console.log('   📁 Path:', uploadResult.path);
    console.log('   🔗 URL:', uploadResult.url);
    
    // Probar obtener URL pública
    const publicUrl = StorageService.getPublicUrl(uploadResult.path);
    console.log('✅ URL pública obtenida:', publicUrl);
    
    // Probar extracción de path desde URL
    const extractedPath = StorageService.extractPathFromUrl(uploadResult.url);
    console.log('✅ Path extraído de URL:', extractedPath);
    
    // Probar eliminación
    console.log('🗑️ Eliminando archivo...');
    const deleteResult = await StorageService.deleteFile(uploadResult.path);
    
    if (deleteResult.error) {
      console.error('❌ Error eliminando archivo:', deleteResult.error);
      return;
    }
    
    console.log('✅ Archivo eliminado exitosamente');
    
    // Verificar que se eliminó (intentar obtener URL de nuevo)
    try {
      const deletedUrl = StorageService.getPublicUrl(uploadResult.path);
      console.log('⚠️ URL después de eliminar:', deletedUrl);
      console.log('   (Debería devolver error 404 al acceder)');
    } catch (error) {
      console.log('✅ Confirmado: archivo eliminado del storage');
    }
    
    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
};

// Ejecutar las pruebas
console.log('Para ejecutar las pruebas, ejecuta: testStorageService()');

// También exportar para uso manual
window.testStorageService = testStorageService;