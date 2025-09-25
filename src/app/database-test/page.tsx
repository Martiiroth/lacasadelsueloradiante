'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function DatabaseTest() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setLoading(true)
    setError(null)
    const testResults = []

    try {
      // Test 1: Conexión básica
      console.log('Testing basic connection...')
      const { data: connectionTest, error: connectionError } = await supabase
        .from('customer_roles')
        .select('count')
        .limit(1)

      testResults.push({
        test: 'Conexión a Supabase',
        success: !connectionError,
        data: connectionError ? connectionError.message : 'Conectado correctamente',
        error: connectionError
      })

      // Test 2: Verificar tabla customer_roles
      console.log('Testing customer_roles table...')
      const { data: roles, error: rolesError } = await supabase
        .from('customer_roles')
        .select('*')

      testResults.push({
        test: 'Tabla customer_roles',
        success: !rolesError,
        data: rolesError ? rolesError.message : `${roles?.length || 0} roles encontrados`,
        details: roles,
        error: rolesError
      })

      // Test 3: Verificar tabla clients
      console.log('Testing clients table...')
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*, customer_role:customer_roles(*)')
        .limit(5)

      testResults.push({
        test: 'Tabla clients',
        success: !clientsError,
        data: clientsError ? clientsError.message : `${clients?.length || 0} clientes encontrados`,
        details: clients,
        error: clientsError
      })

      // Test 4: Verificar usuario actual
      console.log('Testing current user...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      testResults.push({
        test: 'Usuario actual',
        success: !userError,
        data: userError ? userError.message : user ? `Usuario: ${user.email}` : 'No hay usuario conectado',
        details: user,
        error: userError
      })

      // Test 5: Verificar RLS policies
      console.log('Testing RLS policies...')
      const { data: rlsTest, error: rlsError } = await supabase
        .rpc('check_rls_policies')
        .single()

      testResults.push({
        test: 'RLS Policies',
        success: !rlsError,
        data: rlsError ? rlsError.message : 'RLS funcionando',
        error: rlsError
      })

    } catch (error: any) {
      setError(error.message)
      console.error('Test error:', error)
    }

    setResults(testResults)
    setLoading(false)
  }

  const insertTestRole = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customer_roles')
        .insert([
          { name: 'guest', description: 'Usuario invitado con acceso básico' },
          { name: 'instalador', description: 'Profesional instalador con precios especiales' },
          { name: 'sat', description: 'Servicio técnico con acceso completo' },
          { name: 'admin', description: 'Administrador del sistema' }
        ])
        .select()

      console.log('Insert result:', data, error)
      alert(error ? `Error: ${error.message}` : 'Roles insertados correctamente')
    } catch (error: any) {
      console.error('Insert error:', error)
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test de Base de Datos</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Ejecutando...' : 'Ejecutar Tests'}
        </button>
        
        <button
          onClick={insertTestRole}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Insertar Roles de Prueba
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              result.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{result.test}</h3>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  result.success
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                }`}
              >
                {result.success ? 'OK' : 'ERROR'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{result.data}</p>
            
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  Ver detalles
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
            
            {result.error && (
              <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                <strong>Error:</strong> {JSON.stringify(result.error, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}