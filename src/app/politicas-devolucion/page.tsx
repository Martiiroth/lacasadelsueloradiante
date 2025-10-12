import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Políticas de Devolución | La Casa del Suelo Radiante',
  description: 'Condiciones de devolución, cambios y garantías de La Casa del Suelo Radiante',
}

export default function PoliticasDevolucion() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Políticas de Devolución
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              🛡️ Su satisfacción es nuestra prioridad
            </h2>
            <p className="text-green-700">
              En La Casa del Suelo Radiante ofrecemos una política de devolución flexible para 
              garantizar su completa satisfacción con nuestros productos y servicios.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              1. Derecho de desistimiento (14 días)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Conforme a la Ley de Defensa de los Consumidores y Usuarios, usted tiene derecho a 
              desistir del contrato en un plazo de <strong>14 días naturales</strong> sin necesidad 
              de justificar su decisión.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">📅 Plazo de desistimiento:</h3>
              <p className="text-blue-700 text-sm">
                El plazo comenzará a contar desde el día siguiente a la entrega del producto. 
                Para productos de instalación, desde la finalización del servicio.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">✅ Productos incluidos:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Suelos radiantes eléctricos</li>
                  <li>• Sistemas de calefacción por agua</li>
                  <li>• Termostatos y controladores</li>
                  <li>• Accesorios y componentes</li>
                  <li>• Materiales aislantes</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">❌ Excepciones:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Productos fabricados a medida</li>
                  <li>• Instalaciones ya realizadas</li>
                  <li>• Productos dañados por mal uso</li>
                  <li>• Servicios de consultoría</li>
                  <li>• Productos higiénico-sanitarios</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              2. Condiciones para devoluciones
            </h2>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-semibold text-yellow-800 mb-2">📦 Estado del producto</h3>
                <p className="text-yellow-700 text-sm mb-2">
                  Los productos deben devolverse en las mismas condiciones en que se entregaron:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Embalaje original intacto</li>
                  <li>• Sin signos de uso o instalación</li>
                  <li>• Con todos los accesorios incluidos</li>
                  <li>• Documentación y manuales completos</li>
                  <li>• Etiquetas y precinto original</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold text-purple-800 mb-2">📋 Proceso de devolución</h3>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                    <h4 className="font-semibold text-purple-800 text-sm">Solicitar</h4>
                    <p className="text-xs text-purple-700">Contacte con nosotros dentro del plazo</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                    <h4 className="font-semibold text-purple-800 text-sm">Autorización</h4>
                    <p className="text-xs text-purple-700">Recibirá número de autorización</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                    <h4 className="font-semibold text-purple-800 text-sm">Envío</h4>
                    <p className="text-xs text-purple-700">Envíe el producto con portes pagados</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              3. Gastos de devolución
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-semibold text-green-800 mb-2">✅ A cargo de la empresa:</h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• Producto defectuoso o dañado</li>
                  <li>• Error en el envío (producto incorrecto)</li>
                  <li>• Incumplimiento de especificaciones</li>
                  <li>• Problemas de fabricación</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="font-semibold text-red-800 mb-2">❌ A cargo del cliente:</h3>
                <ul className="text-sm text-red-700 space-y-2">
                  <li>• Desistimiento sin causa justificada</li>
                  <li>• Cambio de opinión</li>
                  <li>• Productos personalizados rechazados</li>
                  <li>• Devolución fuera de plazo</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              4. Reembolsos
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">💰 Procesamiento del reembolso</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Una vez recibido y verificado el producto, procesaremos su reembolso:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-800 text-sm mb-1">Plazo máximo:</h4>
                    <p className="text-blue-700 text-xs">14 días naturales desde la recepción</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 text-sm mb-1">Método:</h4>
                    <p className="text-blue-700 text-xs">Mismo método de pago utilizado</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-semibold text-orange-800 mb-2">⚠️ Reembolsos parciales</h3>
                <p className="text-orange-700 text-sm mb-2">
                  Se aplicará reembolso parcial en los siguientes casos:
                </p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Producto devuelto en condiciones no originales (-20%)</li>
                  <li>• Embalaje dañado o incompleto (-10%)</li>
                  <li>• Falta de accesorios o documentación (-15%)</li>
                  <li>• Productos con signos de uso (-30%)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              5. Cambios y intercambios
            </h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-4">🔄 Política de cambios</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Cambios gratuitos:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Producto defectuoso</li>
                    <li>• Error en el envío</li>
                    <li>• Talla/medida incorrecta (productos estándar)</li>
                    <li>• Diferencias de color significativas</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Cambios con coste:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Cambio por modelo diferente (+diferencia precio)</li>
                    <li>• Gastos de envío adicionales</li>
                    <li>• Manipulación especial (5€)</li>
                    <li>• Gestión administrativa (3€)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              6. Garantías
            </h2>
            
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3">🛡️ Garantía de productos</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="bg-green-600 text-white rounded-lg p-3 mb-2">
                      <h4 className="font-bold text-lg">2 AÑOS</h4>
                    </div>
                    <p className="text-sm text-green-700">Suelos radiantes eléctricos</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-600 text-white rounded-lg p-3 mb-2">
                      <h4 className="font-bold text-lg">5 AÑOS</h4>
                    </div>
                    <p className="text-sm text-green-700">Sistemas hidráulicos</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-600 text-white rounded-lg p-3 mb-2">
                      <h4 className="font-bold text-lg">1 AÑO</h4>
                    </div>
                    <p className="text-sm text-green-700">Termostatos y controladores</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Cobertura de la garantía:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">✅ Incluye:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Defectos de fabricación</li>
                      <li>• Fallos de funcionamiento</li>
                      <li>• Reparación o sustitución gratuita</li>
                      <li>• Mano de obra (instalación original)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">❌ Excluye:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Daños por mal uso</li>
                      <li>• Desgaste normal</li>
                      <li>• Instalación incorrecta</li>
                      <li>• Daños por terceros</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              7. Cómo contactar para devoluciones
            </h2>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-4">📞 Datos de contacto</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Atención al cliente:</h4>
                  <p className="text-blue-700 text-sm mb-1">
                    📧 <strong>Email:</strong> consultas@lacasadelsueloradiante.es
                  </p>
                  <p className="text-blue-700 text-sm mb-1">
                    📞 <strong>Teléfono:</strong> +34 689 571 381
                  </p>
                  <p className="text-blue-700 text-sm">
                    🕐 <strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Dirección para devoluciones:</h4>
                  <div className="text-blue-700 text-sm">
                    <p>T&V SERVICIOS Y COMPLEMENTOS, S.L.</p>
                    <p>Dpto. Devoluciones</p>
                    <p>APOSTOL SANTIAGO 59</p>
                    <p>[CP], [Ciudad]</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Importante:</strong> Antes de enviar cualquier producto, contacte con 
                  nuestro servicio de atención al cliente para obtener un número de autorización 
                  de devolución (RMA).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              8. Resolución de disputas
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              En caso de desacuerdo con nuestras políticas de devolución, puede:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1">1</span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Contactar con nuestro servicio al cliente</h4>
                  <p className="text-xs text-gray-600">Intentaremos resolver el problema de manera amistosa</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1">2</span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Mediación de consumo</h4>
                  <p className="text-xs text-gray-600">Presentar reclamación en las Juntas Arbitrales de Consumo</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-1">3</span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Plataforma ODR</h4>
                  <p className="text-xs text-gray-600">Resolución online de litigios en ec.europa.eu/consumers/odr</p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-gray-100 p-4 rounded-lg text-center mt-8">
            <p className="text-sm text-gray-600">
              <strong>Última actualización:</strong> Octubre 2025
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Esta política cumple con la normativa española e europea de protección al consumidor
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}