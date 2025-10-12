import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Políticas de Privacidad | La Casa del Suelo Radiante',
  description: 'Políticas de privacidad y protección de datos de La Casa del Suelo Radiante conforme al RGPD',
}

export default function PoliticasPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Políticas de Privacidad
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              1. Responsable del tratamiento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              T&V SERVICIOS Y COMPLEMENTOS, S.L. es la responsable del tratamiento de los datos personales 
              que nos facilite a través de este sitio web.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Datos de contacto:</strong></p>
              <p>Razón Social: T&V SERVICIOS Y COMPLEMENTOS, S.L.</p>
              <p>Domicilio Fiscal: APOSTOL SANTIAGO 59</p>
              <p>CIF: B86715893</p>
              <p>Email: consultas@lacasadelsueloradiante.es</p>
              <p>Teléfono: +34 689 571 381</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              2. Finalidades del tratamiento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Los datos personales que recopilamos tienen las siguientes finalidades:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Gestionar su registro como usuario y mantener su cuenta</li>
              <li>Procesar sus pedidos y gestionar las compras realizadas</li>
              <li>Enviar comunicaciones sobre el estado de sus pedidos</li>
              <li>Proporcionar atención al cliente y soporte técnico</li>
              <li>Enviar comunicaciones comerciales (solo con su consentimiento)</li>
              <li>Cumplir con obligaciones legales y fiscales</li>
              <li>Mejorar nuestros servicios mediante análisis estadísticos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              3. Legitimación
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              La base legal para el tratamiento de sus datos personales es:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Ejecución del contrato:</strong> Para gestionar sus pedidos y prestación de servicios</li>
              <li><strong>Interés legítimo:</strong> Para análisis estadísticos y mejora de servicios</li>
              <li><strong>Consentimiento:</strong> Para el envío de comunicaciones comerciales</li>
              <li><strong>Cumplimiento legal:</strong> Para obligaciones fiscales y contables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              4. Datos que recopilamos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Según el servicio utilizado, podemos recopilar los siguientes datos:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Datos de registro:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Nombre y apellidos</li>
                  <li>• Email</li>
                  <li>• Teléfono</li>
                  <li>• Dirección</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Datos de navegación:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dirección IP</li>
                  <li>• Cookies técnicas</li>
                  <li>• Información del navegador</li>
                  <li>• Páginas visitadas</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              5. Conservación de los datos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Los datos personales se conservarán durante los siguientes períodos:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Datos de clientes:</strong> Durante la relación comercial y 6 años adicionales por obligaciones legales</li>
              <li><strong>Datos de navegación:</strong> Máximo 2 años desde la recopilación</li>
              <li><strong>Comunicaciones comerciales:</strong> Hasta que retire su consentimiento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              6. Destinatarios
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Sus datos pueden ser comunicados a:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Entidades bancarias para el procesamiento de pagos</li>
              <li>Empresas de transporte y mensajería</li>
              <li>Administraciones públicas cuando sea legalmente requerido</li>
              <li>Proveedores de servicios tecnológicos (hosting, email, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              7. Sus derechos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tiene derecho a:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Acceso:</strong> Conocer qué datos tenemos</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación</li>
                <li><strong>Limitación:</strong> Restringir el tratamiento</li>
              </ul>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato estándar</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento</li>
                <li><strong>Retirar consentimiento:</strong> En cualquier momento</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-800">
                <strong>Para ejercer sus derechos:</strong> Envíe un email a 
                <a href="mailto:consultas@lacasadelsueloradiante.es" className="underline ml-1">
                  consultas@lacasadelsueloradiante.es
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              8. Medidas de seguridad
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Implementamos medidas técnicas y organizativas apropiadas para garantizar la seguridad 
              de sus datos personales, incluyendo:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Cifrado SSL en todas las comunicaciones</li>
              <li>Acceso restringido a los datos personales</li>
              <li>Copias de seguridad regulares</li>
              <li>Formación del personal en protección de datos</li>
              <li>Auditorías periódicas de seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              9. Transferencias internacionales
            </h2>
            <p className="text-gray-600 leading-relaxed">
              En caso de realizar transferencias de datos fuera del Espacio Económico Europeo, 
              garantizamos que se realizan con las debidas garantías y solo a países u organizaciones 
              que ofrezcan un nivel de protección adecuado según la Comisión Europea.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              10. Reclamaciones
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Si considera que no hemos tratado sus datos correctamente, puede presentar una reclamación 
              ante la Agencia Española de Protección de Datos (AEPD) en 
              <a href="https://www.aepd.es" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                www.aepd.es
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              11. Modificaciones
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nos reservamos el derecho a modificar esta política de privacidad. Las modificaciones 
              serán comunicadas con la debida antelación y publicadas en esta página.
            </p>
          </section>

          <div className="bg-gray-100 p-4 rounded-lg text-center mt-8">
            <p className="text-sm text-gray-600">
              <strong>Última actualización:</strong> Octubre 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}