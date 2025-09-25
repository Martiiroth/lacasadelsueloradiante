'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DatabaseDebug() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [productCount, setProductCount] = useState<number>(0)
  const [categoryCount, setCategoryCount] = useState<number>(0)
  const [variantCount, setVariantCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Verificar conexión básica
        const { data: healthCheck, error: healthError } = await supabase
          .from('customer_roles')
          .select('id')
          .limit(1)

        if (healthError) {
          setConnectionStatus('error')
          setError(`Conexión fallida: ${healthError.message}`)
          return
        }

        setConnectionStatus('connected')

        // Contar productos
        const { count: products } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        // Contar categorías
        const { count: categories } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })

        // Contar variantes
        const { count: variants } = await supabase
          .from('product_variants')
          .select('*', { count: 'exact', head: true })

        setProductCount(products || 0)
        setCategoryCount(categories || 0)
        setVariantCount(variants || 0)

      } catch (err) {
        console.error('Database check error:', err)
        setConnectionStatus('error')
        setError(`Error: ${err}`)
      }
    }

    checkDatabase()
  }, [])

  return (
    <div className="bg-gray-100 p-4 rounded-md mb-6">
      <h3 className="text-lg font-semibold mb-4">🔍 Estado de la Base de Datos</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Conexión:</span>
          {connectionStatus === 'checking' && <span className="text-yellow-600">Verificando...</span>}
          {connectionStatus === 'connected' && <span className="text-green-600">✅ Conectado</span>}
          {connectionStatus === 'error' && <span className="text-red-600">❌ Error</span>}
        </div>

        {connectionStatus === 'connected' && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium">Productos:</span>
              <span className={productCount > 0 ? 'text-green-600' : 'text-red-600'}>
                {productCount} encontrados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Categorías:</span>
              <span className={categoryCount > 0 ? 'text-green-600' : 'text-red-600'}>
                {categoryCount} encontradas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Variantes:</span>
              <span className={variantCount > 0 ? 'text-green-600' : 'text-red-600'}>
                {variantCount} encontradas
              </span>
            </div>
          </>
        )}

        {error && (
          <div className="text-red-600 text-sm mt-2">
            <strong>Error:</strong> {error}
          </div>
        )}

        {connectionStatus === 'connected' && productCount === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ No hay productos en la base de datos</strong><br />
              Necesitas ejecutar los scripts:
            </p>
            <ol className="text-yellow-700 text-sm mt-2 ml-4 list-decimal">
              <li>Ejecuta <code>clean-database.sql</code> en Supabase SQL Editor</li>
              <li>Ejecuta <code>test-data.sql</code> en Supabase SQL Editor</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}