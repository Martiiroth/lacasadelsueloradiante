/**
 * TestDataService - Servicio de datos de prueba
 * 
 * ✅ COMPATIBLE CON ARQUITECTURA SUPABASE SSR
 * Cliente browser a través de lib/supabase.ts (wrapper compatible)
 */

import { supabase } from './supabase'

export class TestDataService {
  // Obtener un variant ID real para pruebas
  static async getTestVariantId(): Promise<{ variant_id: string; price_cents: number } | null> {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, price_public_cents')
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching test variant:', error)
        return null
      }

      return {
        variant_id: data.id,
        price_cents: data.price_public_cents
      }
    } catch (error) {
      console.error('Error in getTestVariantId:', error)
      return null
    }
  }

  // Crear producto específico con slug
  static async createProductWithSlug(slug: string): Promise<boolean> {
    try {
      console.log(`🆕 Creating product with slug: ${slug}`)

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        console.log('✅ Product already exists')
        return true
      }

      // Crear producto específico según el slug
      let productData: any
      let variants: any[] = []
      
      if (slug === 'termostato-digital-wifi') {
        productData = {
          slug: 'termostato-digital-wifi',
          title: 'Termostato Digital WiFi Inteligente',
          short_description: 'Control inteligente de temperatura con conectividad WiFi y programación avanzada',
          description: `
            <h3>Termostato Digital WiFi de Nueva Generación</h3>
            <p>Controla la temperatura de tu hogar desde cualquier lugar con nuestro termostato inteligente con conectividad WiFi.</p>
            
            <h4>Características principales:</h4>
            <ul>
              <li>Pantalla táctil LCD a color de 3.5 pulgadas</li>
              <li>Conectividad WiFi 2.4GHz integrada</li>
              <li>Compatible con Alexa, Google Assistant y Apple HomeKit</li>
              <li>Programación semanal con hasta 6 períodos por día</li>
              <li>Sensor de temperatura y humedad de alta precisión</li>
              <li>Control remoto mediante app móvil</li>
              <li>Función de aprendizaje automático</li>
              <li>Modo vacaciones y modo ECO</li>
            </ul>
            
            <h4>Instalación:</h4>
            <p>Compatible con sistemas de calefacción de 2 hilos y 4 hilos. Incluye manual de instalación detallado y soporte técnico gratuito.</p>
            
            <h4>Ahorro energético:</h4>
            <p>Reduce el consumo energético hasta un 23% gracias a su algoritmo inteligente de control de temperatura.</p>
          `,
          is_new: true,
          is_on_sale: false,
          meta_title: 'Termostato Digital WiFi - Control inteligente de temperatura',
          meta_description: 'Termostato digital WiFi con app móvil, compatible con Alexa y Google. Programación avanzada y ahorro energético.'
        }

        variants = [
          {
            sku: 'TERM-WIFI-WHITE',
            title: 'Blanco - Estándar',
            price_public_cents: 12900, // 129.00 EUR
            stock: 25,
            weight_grams: 180,
            dimensions: { ancho: '86mm', alto: '86mm', profundo: '15mm' }
          },
          {
            sku: 'TERM-WIFI-BLACK',
            title: 'Negro - Estándar',
            price_public_cents: 12900, // 129.00 EUR
            stock: 18,
            weight_grams: 180,
            dimensions: { ancho: '86mm', alto: '86mm', profundo: '15mm' }
          },
          {
            sku: 'TERM-WIFI-PRO',
            title: 'Pro - Sensor Externo',
            price_public_cents: 16900, // 169.00 EUR
            stock: 12,
            weight_grams: 220,
            dimensions: { ancho: '86mm', alto: '86mm', profundo: '18mm' }
          }
        ]
      } else {
        // Producto genérico para otros slugs
        productData = {
          slug: slug,
          title: `Producto ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          short_description: 'Producto de calidad para sistemas de calefacción',
          description: '<p>Descripción completa del producto con todas sus características técnicas.</p>',
          is_new: false,
          is_on_sale: false
        }

        variants = [{
          sku: `${slug.toUpperCase()}-001`,
          title: 'Modelo Estándar',
          price_public_cents: 9900,
          stock: 10,
          weight_grams: 1000,
          dimensions: { ancho: '30cm', alto: '20cm', profundo: '10cm' }
        }]
      }

      // Crear producto
      const { data: newProduct, error: createProductError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (createProductError) {
        console.error('Error creating product:', createProductError)
        return false
      }

      // Crear variantes
      for (const variant of variants) {
        const { error: createVariantError } = await supabase
          .from('product_variants')
          .insert({
            ...variant,
            product_id: newProduct.id
          })

        if (createVariantError) {
          console.error('Error creating variant:', createVariantError)
          return false
        }
      }

      // Crear recursos para termostato
      if (slug === 'termostato-digital-wifi') {
        const resources = [
          {
            product_id: newProduct.id,
            type: 'manual',
            url: '#manual-termostato',
            label: 'Manual de Usuario e Instalación'
          },
          {
            product_id: newProduct.id,
            type: 'pdf',
            url: '#ficha-tecnica-termostato',
            label: 'Especificaciones Técnicas Completas'
          },
          {
            product_id: newProduct.id,
            type: 'video',
            url: '#video-instalacion-termostato',
            label: 'Video: Instalación Paso a Paso'
          },
          {
            product_id: newProduct.id,
            type: 'file',
            url: '#app-movil',
            label: 'Descarga App Móvil'
          }
        ]

        for (const resource of resources) {
          await supabase
            .from('product_resources')
            .insert(resource)
        }
      }

      console.log(`✅ Product ${slug} created successfully`)
      return true

    } catch (error) {
      console.error('Error creating product:', error)
      return false
    }
  }

  // Asegurar que existen datos de prueba
  static async ensureTestData(): Promise<boolean> {
    try {
      // Verificar si existen productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .limit(1)

      if (productsError) {
        console.error('Error checking products:', productsError)
        return false
      }

      if (!products || products.length === 0) {
        console.log('🆕 Creating comprehensive test data...')
        
        // Crear producto de prueba completo
        const { data: newProduct, error: createProductError } = await supabase
          .from('products')
          .insert({
            slug: 'sistema-calefaccion-suelo-radiante-test',
            title: 'Sistema de Calefacción por Suelo Radiante - Kit Completo',
            short_description: 'Kit completo para instalación de calefacción por suelo radiante en viviendas de hasta 100m²',
            description: `
              <h3>Sistema Completo de Calefacción por Suelo Radiante</h3>
              <p>Nuestro kit completo incluye todos los elementos necesarios para la instalación de un sistema de calefacción por suelo radiante eficiente y duradero.</p>
              
              <h4>Características principales:</h4>
              <ul>
                <li>Tubería de PEX de alta calidad con barrera anti-oxígeno</li>
                <li>Colector con válvulas de regulación individuales</li>
                <li>Aislamiento térmico de alta densidad</li>
                <li>Sistema de control termostático programable</li>
                <li>Mortero autonivelante de secado rápido</li>
              </ul>
              
              <h4>Ventajas:</h4>
              <ul>
                <li>Ahorro energético de hasta 30%</li>
                <li>Distribución uniforme del calor</li>
                <li>Compatible con cualquier tipo de pavimento</li>
                <li>Funcionamiento silencioso</li>
                <li>Larga vida útil (+ de 50 años)</li>
              </ul>
              
              <h4>Aplicaciones:</h4>
              <p>Ideal para viviendas unifamiliares, apartamentos, oficinas y locales comerciales. Compatible con sistemas de calderas de gas, gasoil, biomasa y bombas de calor.</p>
            `,
            is_new: true,
            is_on_sale: true,
            meta_title: 'Kit Calefacción Suelo Radiante - La Casa del Suelo Radiante',
            meta_description: 'Kit completo para instalación de calefacción por suelo radiante. Ahorro energético, confort y durabilidad garantizada.'
          })
          .select()
          .single()

        if (createProductError) {
          console.error('Error creating test product:', createProductError)
          return false
        }

        // Crear múltiples variantes
        const variants = [
          {
            product_id: newProduct.id,
            sku: 'KIT-SR-50',
            title: 'Kit 50m² - Vivienda Pequeña',
            price_public_cents: 89900, // 899.00 EUR
            stock: 15,
            weight_grams: 45000,
            dimensions: { ancho: '120cm', alto: '80cm', profundo: '40cm', superficie: '50m²' }
          },
          {
            product_id: newProduct.id,
            sku: 'KIT-SR-100',
            title: 'Kit 100m² - Vivienda Estándar',
            price_public_cents: 149900, // 1499.00 EUR
            stock: 8,
            weight_grams: 75000,
            dimensions: { ancho: '150cm', alto: '100cm', profundo: '50cm', superficie: '100m²' }
          },
          {
            product_id: newProduct.id,
            sku: 'KIT-SR-150',
            title: 'Kit 150m² - Vivienda Grande',
            price_public_cents: 199900, // 1999.00 EUR
            stock: 5,
            weight_grams: 110000,
            dimensions: { ancho: '180cm', alto: '120cm', profundo: '60cm', superficie: '150m²' }
          }
        ]

        for (const variant of variants) {
          const { error: createVariantError } = await supabase
            .from('product_variants')
            .insert(variant)

          if (createVariantError) {
            console.error('Error creating test variant:', createVariantError)
            return false
          }
        }

        // Crear recursos de ejemplo
        const resources = [
          {
            product_id: newProduct.id,
            type: 'manual',
            url: '#manual-instalacion',
            label: 'Manual de Instalación Completo'
          },
          {
            product_id: newProduct.id,
            type: 'pdf',
            url: '#ficha-tecnica',
            label: 'Ficha Técnica del Producto'
          },
          {
            product_id: newProduct.id,
            type: 'video',
            url: '#video-instalacion',
            label: 'Video Tutorial de Instalación'
          }
        ]

        for (const resource of resources) {
          await supabase
            .from('product_resources')
            .insert(resource)
        }

        console.log('✅ Comprehensive test data created successfully')
      }

      return true
    } catch (error) {
      console.error('Error in ensureTestData:', error)
      return false
    }
  }
}