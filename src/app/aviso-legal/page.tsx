import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso Legal | La Casa del Suelo Radiante',
  description: 'Aviso legal y términos de uso de La Casa del Suelo Radiante',
}

export default function AvisoLegal() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Aviso Legal
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              1. Datos identificativos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la 
              Sociedad de la Información y de Comercio Electrónico, ponemos a su disposición los 
              siguientes datos identificativos de la empresa:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-500">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Razón Social:</strong> La Casa del Suelo Radiante, S.L.</p>
                  <p><strong>CIF:</strong> B-[Número CIF]</p>
                  <p><strong>Registro Mercantil:</strong> [Datos registro]</p>
                  <p><strong>Actividad:</strong> Venta y instalación de sistemas de calefacción</p>
                </div>
                <div>
                  <p><strong>Dirección:</strong> [Dirección completa]</p>
                  <p><strong>Código Postal:</strong> [CP], [Ciudad]</p>
                  <p><strong>Teléfono:</strong> [Teléfono]</p>
                  <p><strong>Email:</strong> info@lacasadelsueloradiante.com</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              2. Objeto y aceptación
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Este aviso legal regula el uso del sitio web www.lacasadelsueloradiante.com, propiedad 
              de La Casa del Suelo Radiante, S.L. El acceso y uso de este sitio web implica la 
              aceptación plena de todos los términos y condiciones establecidos en este aviso legal.
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <p className="text-yellow-800">
                <strong>⚠️ Importante:</strong> Si no está de acuerdo con estos términos, 
                debe abandonar inmediatamente este sitio web.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              3. Condiciones de uso
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">3.1 Uso permitido</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                El usuario se compromete a utilizar este sitio web de conformidad con la ley y con 
                las presentes condiciones. Queda expresamente prohibido:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Realizar actividades ilícitas o que puedan dañar la imagen de la empresa</li>
                <li>Introducir virus, programas o elementos dañinos</li>
                <li>Intentar acceder a áreas restringidas del sistema</li>
                <li>Utilizar el sitio para fines comerciales no autorizados</li>
                <li>Reproducir, copiar o distribuir el contenido sin autorización</li>
                <li>Enviar comunicaciones no solicitadas (spam)</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6">3.2 Responsabilidad del usuario</h3>
              <p className="text-gray-600 leading-relaxed">
                El usuario es responsable de mantener la confidencialidad de sus datos de acceso 
                y de todas las actividades que se realicen bajo su cuenta.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              4. Propiedad intelectual e industrial
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Todos los contenidos del sitio web, incluyendo pero no limitándose a textos, fotografías, 
              gráficos, imágenes, iconos, tecnología, software, así como su diseño gráfico y códigos 
              fuente, son propiedad exclusiva de La Casa del Suelo Radiante, S.L. o de terceros que 
              han autorizado su uso.
            </p>
            
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="font-semibold text-red-800 mb-2">Derechos reservados</h3>
              <p className="text-red-700 text-sm">
                Queda prohibida la reproducción, distribución, comunicación pública, transformación 
                o cualquier otra actividad que se pueda realizar con los contenidos de este sitio 
                web sin la autorización expresa de los titulares de los derechos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              5. Limitación de responsabilidad
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                La Casa del Suelo Radiante, S.L. no se hace responsable de:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Contenido y disponibilidad:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Interrupciones del servicio</li>
                    <li>• Errores u omisiones en el contenido</li>
                    <li>• Falta de actualización de la información</li>
                    <li>• Fallos técnicos del sistema</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Terceros:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Contenidos de sitios web enlazados</li>
                    <li>• Servicios de terceros integrados</li>
                    <li>• Virus o programas maliciosos</li>
                    <li>• Uso indebido por parte de usuarios</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              6. Protección de datos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              El tratamiento de los datos personales se rige por nuestra Política de Privacidad, 
              que cumple con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 
              de Protección de Datos Personales y garantía de los derechos digitales.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                📋 Para más información, consulte nuestra 
                <a href="/politicas-privacidad" className="underline font-semibold ml-1">
                  Política de Privacidad
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              7. Enlaces a terceros
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Este sitio web puede contener enlaces a sitios web de terceros. La Casa del Suelo 
              Radiante, S.L. no controla ni se hace responsable del contenido de dichos sitios web 
              externos.
            </p>
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <p className="text-orange-800 text-sm">
                <strong>Aviso:</strong> El acceso a sitios web de terceros se realiza bajo su 
                propia responsabilidad. Le recomendamos revisar las políticas de privacidad y 
                términos de uso de cada sitio web que visite.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              8. Modificaciones
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              La Casa del Suelo Radiante, S.L. se reserva el derecho de modificar, en cualquier momento 
              y sin previo aviso, este aviso legal, así como las condiciones generales de uso del sitio web.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-sm">
                💡 <strong>Recomendación:</strong> Le aconsejamos revisar periódicamente este 
                aviso legal para estar al tanto de posibles cambios.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              9. Duración y terminación
            </h2>
            <p className="text-gray-600 leading-relaxed">
              La prestación del servicio del sitio web tiene duración indefinida. No obstante, 
              La Casa del Suelo Radiante, S.L. se reserva el derecho a suspender o terminar la 
              prestación del servicio en cualquier momento, con o sin causa justificada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              10. Legislación aplicable y jurisdicción
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Este aviso legal se rige por la legislación española. Para la resolución de cualquier 
                controversia que pudiera derivarse del acceso o uso de este sitio web, las partes se 
                someterán a la jurisdicción de los Juzgados y Tribunales de [Ciudad], renunciando 
                expresamente a cualquier otro fuero que pudiera corresponderles.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Normativa aplicable:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico</li>
                  <li>• Reglamento General de Protección de Datos (RGPD)</li>
                  <li>• Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales</li>
                  <li>• Código Civil y Código de Comercio españoles</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              11. Contacto
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Para cualquier consulta relacionada con este aviso legal, puede contactar con nosotros:
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-800"><strong>📧 Email:</strong> legal@lacasadelsueloradiante.com</p>
                  <p className="text-blue-800"><strong>📞 Teléfono:</strong> [Teléfono de contacto]</p>
                </div>
                <div>
                  <p className="text-blue-800"><strong>📍 Dirección:</strong> [Dirección completa]</p>
                  <p className="text-blue-800"><strong>🕐 Horario:</strong> Lunes a Viernes, 9:00 - 18:00</p>
                </div>
              </div>
            </div>
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