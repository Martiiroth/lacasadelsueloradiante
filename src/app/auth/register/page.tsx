'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import type { RegisterData } from '../../../types/auth'

export default function RegisterPage() {
  const { signUp, loading, error } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    nif_cif: '',
    region: '',
    city: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    activity: '',
    company_name: '',
    company_position: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Validaciones básicas
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setFormError('Por favor completa todos los campos obligatorios')
      return
    }

    if (formData.password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      const { error } = await signUp(formData)
      if (!error) {
        // ✅ Registro exitoso - mostrar mensaje y dejar que AuthProvider maneje el estado
        console.log('✅ Registro exitoso')
        alert('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
        // Redirigir a login para que el usuario inicie sesión
        router.push('/auth/login')
      } else {
        setFormError(error)
      }
    } catch (err) {
      setFormError('Error de conexión')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear una cuenta nueva
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <a
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              inicia sesión con tu cuenta
            </a>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Apellidos *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Información Adicional (Opcional) */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Información Adicional (Opcional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="nif_cif" className="block text-sm font-medium text-gray-700">
                  NIF/CIF
                </label>
                <input
                  id="nif_cif"
                  name="nif_cif"
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.nif_cif || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  Región
                </label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.region || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Ciudad
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.city || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                id="address_line1"
                name="address_line1"
                type="text"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Calle, número..."
                value={formData.address_line1 || ''}
                onChange={handleChange}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
                Dirección adicional
              </label>
              <input
                id="address_line2"
                name="address_line2"
                type="text"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Piso, puerta, etc."
                value={formData.address_line2 || ''}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                  Código Postal
                </label>
                <input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.postal_code || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Empresa
                </label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.company_name || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="company_position" className="block text-sm font-medium text-gray-700">
                  Cargo/Puesto
                </label>
                <input
                  id="company_position"
                  name="company_position"
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.company_position || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="activity" className="block text-sm font-medium text-gray-700">
                  Actividad/Sector
                </label>
                <input
                  id="activity"
                  name="activity"
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.activity || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {(formError || error) && (
            <div className="text-red-600 text-sm text-center">
              {formError || error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}