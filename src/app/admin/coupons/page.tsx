'use client'

import { useState, useEffect } from 'react'
import { AdminService } from '@/lib/adminService'
import type { AdminCoupon } from '@/types/admin'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { TicketIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const filters = searchTerm ? { product_search: searchTerm } : undefined
      const couponsData = await AdminService.getAllCoupons(filters)
      setCoupons(couponsData)
    } catch (error) {
      console.error('Error loading coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadCoupons()
  }

  const handleDelete = async (couponId: string, couponCode: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el cupón "${couponCode}"?`)) {
      return
    }

    try {
      setDeleting(couponId)
      await AdminService.deleteCoupon(couponId)
      setCoupons(coupons.filter(c => c.id !== couponId))
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el cupón')
    } finally {
      setDeleting(null)
    }
  }

  const getUsagePercentage = (coupon: AdminCoupon) => {
    if (!coupon.usage_limit) return 0
    return Math.min((coupon.used_count / coupon.usage_limit) * 100, 100)
  }

  const formatValidityPeriod = (coupon: AdminCoupon) => {
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString('es-ES') : null
    const validTo = coupon.valid_to ? new Date(coupon.valid_to).toLocaleDateString('es-ES') : null
    
    if (validFrom && validTo) {
      return `${validFrom} - ${validTo}`
    } else if (validFrom) {
      return `Desde ${validFrom}`
    } else if (validTo) {
      return `Hasta ${validTo}`
    } else {
      return 'Sin límite de tiempo'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupones</h1>
          <p className="text-gray-600">Gestiona los cupones de descuento de la tienda</p>
        </div>
        <Link
          href="/admin/coupons/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo cupón
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-md relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por código o descripción..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Buscar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TicketIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total cupones</p>
              <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TicketIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cupones activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.filter(c => AdminService.getCouponStatusLabel(c) === 'Activo').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TicketIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total usos</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.reduce((sum, c) => sum + c.used_count, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TicketIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Programados</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.filter(c => AdminService.getCouponStatusLabel(c) === 'Programado').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {coupons.length === 0 ? (
          <div className="text-center py-12">
            <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cupones</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron cupones con esos criterios' : 'Comienza creando tu primer cupón de descuento.'}
            </p>
            <div className="mt-6">
              <Link
                href="/admin/coupons/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Nuevo cupón
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cupón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aplica a
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validez
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {coupon.code}
                        </div>
                        {coupon.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {AdminService.formatDiscountValue(coupon.discount_type, coupon.discount_value)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {coupon.discount_type === 'percentage' ? 'Porcentaje' : 'Cantidad fija'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.applies_to === 'order' ? 'Pedido completo' : 
                         coupon.applies_to === 'product' ? 'Producto específico' : 'Categoría específica'}
                      </div>
                      {coupon.target && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {coupon.target.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                      </div>
                      {coupon.usage_limit && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${getUsagePercentage(coupon)}%` }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatValidityPeriod(coupon)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${AdminService.getCouponStatusColor(coupon)}`}>
                        {AdminService.getCouponStatusLabel(coupon)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/coupons/${coupon.id}`}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/coupons/${coupon.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          disabled={deleting === coupon.id}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deleting === coupon.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}