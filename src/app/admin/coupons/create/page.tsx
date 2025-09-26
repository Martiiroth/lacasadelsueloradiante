'use client'

import { useState, useEffect } from 'react'
import { AdminService } from '@/lib/adminService'
import type { CreateCouponData, AdminProduct, AdminCategory } from '@/types/admin'
import { ArrowLeftIcon, TicketIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CreateCouponPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loadingTargets, setLoadingTargets] = useState(false)
  const [formData, setFormData] = useState<CreateCouponData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    applies_to: 'order',
    target_id: undefined,
    usage_limit: undefined,
    valid_from: undefined,
    valid_to: undefined
  })

  useEffect(() => {
    loadTargets()
  }, [])

  const loadTargets = async () => {
    try {
      setLoadingTargets(true)
      const [productsData, categoriesData] = await Promise.all([
        AdminService.getAllProducts(undefined, 100),
        AdminService.getAllCategories(undefined, 100)
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading targets:', error)
    } finally {
      setLoadingTargets(false)
    }
  }

  const generateCode = () => {
    const generatedCode = AdminService.generateCouponCode()
    setFormData(prev => ({ ...prev, code: generatedCode }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code.trim()) {
      alert('El código del cupón es obligatorio')
      return
    }

    if (formData.discount_value <= 0) {
      alert('El valor del descuento debe ser mayor a 0')
      return
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      alert('El porcentaje de descuento no puede ser mayor a 100%')
      return
    }

    if (formData.applies_to !== 'order' && !formData.target_id) {
      alert('Debes seleccionar un producto o categoría cuando el cupón no aplica a todo el pedido')
      return
    }

    if (formData.valid_from && formData.valid_to && new Date(formData.valid_from) >= new Date(formData.valid_to)) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }

    try {
      setLoading(true)
      const couponId = await AdminService.createCoupon(formData)
      if (couponId) {
        router.push('/admin/coupons')
      }
    } catch (error: any) {
      alert(error.message || 'Error al crear el cupón')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof CreateCouponData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Reset target_id when applies_to changes to 'order'
      if (field === 'applies_to' && value === 'order') {
        newData.target_id = undefined
      }
      
      return newData
    })
  }

  const getTargetOptions = () => {
    if (formData.applies_to === 'product') {
      return products.map(p => ({ id: p.id, name: p.title }))
    } else if (formData.applies_to === 'category') {
      return categories.map(c => ({ id: c.id, name: c.name }))
    }
    return []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/coupons"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cupón</h1>
          <p className="text-gray-600">Crea un nuevo cupón de descuento para la tienda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-blue-600" />
              Información del cupón
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Código del cupón */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código del cupón *
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="Ej: SAVE20"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Código único que los clientes usarán para aplicar el descuento
                </p>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={generateCode}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Generar código
                </button>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Descripción del cupón para uso interno..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tipo y valor de descuento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">
                  Tipo de descuento *
                </label>
                <select
                  id="discount_type"
                  value={formData.discount_type}
                  onChange={(e) => handleChange('discount_type', e.target.value as 'percentage' | 'fixed')}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Cantidad fija (€)</option>
                </select>
              </div>
              <div>
                <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">
                  Valor del descuento *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    id="discount_value"
                    value={formData.discount_value}
                    onChange={(e) => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    step={formData.discount_type === 'percentage' ? 1 : 0.01}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">
                      {formData.discount_type === 'percentage' ? '%' : '€'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aplica a */}
            <div>
              <label htmlFor="applies_to" className="block text-sm font-medium text-gray-700">
                Aplica a *
              </label>
              <select
                id="applies_to"
                value={formData.applies_to}
                onChange={(e) => handleChange('applies_to', e.target.value as 'product' | 'category' | 'order')}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="order">Pedido completo</option>
                <option value="product">Producto específico</option>
                <option value="category">Categoría específica</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.applies_to === 'order' ? 'El descuento se aplicará al total del pedido' :
                 formData.applies_to === 'product' ? 'El descuento se aplicará solo a un producto específico' :
                 'El descuento se aplicará a todos los productos de una categoría'}
              </p>
            </div>

            {/* Target selection */}
            {formData.applies_to !== 'order' && (
              <div>
                <label htmlFor="target_id" className="block text-sm font-medium text-gray-700">
                  {formData.applies_to === 'product' ? 'Producto' : 'Categoría'} *
                </label>
                <select
                  id="target_id"
                  value={formData.target_id || ''}
                  onChange={(e) => handleChange('target_id', e.target.value || undefined)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loadingTargets}
                >
                  <option value="">
                    {loadingTargets ? 'Cargando...' : `Seleccionar ${formData.applies_to === 'product' ? 'producto' : 'categoría'}`}
                  </option>
                  {getTargetOptions().map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Límite de uso */}
            <div>
              <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700">
                Límite de uso
              </label>
              <input
                type="number"
                id="usage_limit"
                value={formData.usage_limit || ''}
                onChange={(e) => handleChange('usage_limit', e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                placeholder="Sin límite"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Número máximo de veces que se puede usar este cupón. Dejar vacío para uso ilimitado.
              </p>
            </div>

            {/* Fechas de validez */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700">
                  Válido desde
                </label>
                <input
                  type="datetime-local"
                  id="valid_from"
                  value={formData.valid_from || ''}
                  onChange={(e) => handleChange('valid_from', e.target.value || undefined)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="valid_to" className="block text-sm font-medium text-gray-700">
                  Válido hasta
                </label>
                <input
                  type="datetime-local"
                  id="valid_to"
                  value={formData.valid_to || ''}
                  onChange={(e) => handleChange('valid_to', e.target.value || undefined)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/coupons"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Crear cupón
          </button>
        </div>
      </form>
    </div>
  )
}