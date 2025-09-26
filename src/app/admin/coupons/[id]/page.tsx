'use client'

import { useState, useEffect } from 'react'
import { AdminService } from '@/lib/adminService'
import type { AdminCoupon } from '@/types/admin'
import { ArrowLeftIcon, PencilIcon, TrashIcon, TicketIcon, ChartBarIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function CouponDetailPage() {
  const params = useParams()
  const router = useRouter()
  const couponId = params.id as string
  const [coupon, setCoupon] = useState<AdminCoupon | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (couponId) {
      loadCoupon()
    }
  }, [couponId])

  const loadCoupon = async () => {
    try {
      setLoading(true)
      const couponData = await AdminService.getCoupon(couponId)
      setCoupon(couponData)
    } catch (error) {
      console.error('Error loading coupon:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!coupon || !confirm(`¿Estás seguro de que quieres eliminar el cupón "${coupon.code}"?`)) {
      return
    }

    try {
      setDeleting(true)
      await AdminService.deleteCoupon(coupon.id)
      router.push('/admin/coupons')
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el cupón')
    } finally {
      setDeleting(false)
    }
  }

  const getUsagePercentage = () => {
    if (!coupon?.usage_limit) return 0
    return Math.min((coupon.used_count / coupon.usage_limit) * 100, 100)
  }

  const formatValidityPeriod = () => {
    if (!coupon) return ''
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

  const getAppliesTo = () => {
    if (!coupon) return ''
    if (coupon.applies_to === 'order') return 'Pedido completo'
    if (coupon.applies_to === 'product') return 'Producto específico'
    return 'Categoría específica'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!coupon) {
    return (
      <div className="text-center py-12">
        <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Cupón no encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          El cupón que buscas no existe o ha sido eliminado.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/coupons"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver a cupones
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/coupons"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TicketIcon className="h-6 w-6 text-blue-600" />
              {coupon.code}
            </h1>
            <p className="text-gray-600">{coupon.description || 'Sin descripción'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${AdminService.getCouponStatusColor(coupon)}`}>
            {AdminService.getCouponStatusLabel(coupon)}
          </span>
          <Link
            href={`/admin/coupons/${coupon.id}/edit`}
            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar cupón"
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Eliminar cupón"
          >
            {deleting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
            ) : (
              <TrashIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-blue-600" />
                Información del cupón
              </h3>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código</dt>
                  <dd className="mt-1 text-lg font-mono font-bold text-gray-900 bg-gray-100 px-3 py-2 rounded">
                    {coupon.code}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Descuento</dt>
                  <dd className="mt-1 text-lg font-semibold text-green-600">
                    {AdminService.formatDiscountValue(coupon.discount_type, coupon.discount_value)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo de descuento</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {coupon.discount_type === 'percentage' ? 'Porcentaje' : 'Cantidad fija'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Aplica a</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getAppliesTo()}
                  </dd>
                </div>
                {coupon.target && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      {coupon.target.type === 'product' ? 'Producto' : 'Categoría'} objetivo
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">
                      {coupon.target.name}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Creado</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {AdminService.formatDate(coupon.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Período de validez</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatValidityPeriod()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Usage Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
                Uso del cupón
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Usos: {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                    </span>
                    {coupon.usage_limit && (
                      <span className="text-sm text-gray-500">
                        {getUsagePercentage().toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {coupon.usage_limit && (
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          getUsagePercentage() >= 100 ? 'bg-red-500' : 
                          getUsagePercentage() >= 80 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${getUsagePercentage()}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                {coupon.usage_limit && (
                  <div className="text-sm text-gray-600">
                    {coupon.usage_limit - coupon.used_count > 0 ? (
                      <span>Quedan {coupon.usage_limit - coupon.used_count} usos disponibles</span>
                    ) : (
                      <span className="text-red-600 font-medium">Cupón agotado</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TicketIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total usos</p>
                  <p className="text-2xl font-bold text-gray-900">{coupon.used_count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total ahorrado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {AdminService.formatPrice(coupon.stats?.total_savings_cents || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pedidos activos</p>
                  <p className="text-2xl font-bold text-gray-900">{coupon.stats?.active_orders || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Acciones rápidas</h3>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href={`/admin/coupons/${coupon.id}/edit`}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar cupón
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                Eliminar cupón
              </button>
            </div>
          </div>

          {/* Validity Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Validez</h3>
            </div>
            <div className="p-6 space-y-3">
              {coupon.valid_from && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Válido desde:</span>
                  <p className="text-sm text-gray-900">
                    {new Date(coupon.valid_from).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
              {coupon.valid_to && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Válido hasta:</span>
                  <p className="text-sm text-gray-900">
                    {new Date(coupon.valid_to).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
              {!coupon.valid_from && !coupon.valid_to && (
                <p className="text-sm text-gray-600">Sin límite de tiempo</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}