'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminOrder } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ShoppingBagIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface EditableAddress {
  address_line1: string
  address_line2?: string
  city: string
  region: string
  postal_code: string
}

export default function AdminOrderEdit() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [status, setStatus] = useState<string>('')
  const [clientInfo, setClientInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nif_cif: '',
    company_name: '',
    company_position: '',
    activity: ''
  })
  const [billingAddress, setBillingAddress] = useState<EditableAddress>({
    address_line1: '',
    address_line2: '',
    city: '',
    region: '',
    postal_code: ''
  })
  const [shippingAddress, setShippingAddress] = useState<EditableAddress>({
    address_line1: '',
    address_line2: '',
    city: '',
    region: '',
    postal_code: ''
  })

  const orderId = params.id as string

  useEffect(() => {
    if (orderId) {
      loadOrderDetail()
    }
  }, [orderId])

  const loadOrderDetail = async () => {
    try {
      setLoading(true)
      const orders = await AdminService.getAllOrders({})
      const foundOrder = orders.find(o => o.id === orderId)
      
      if (foundOrder) {
        setOrder(foundOrder)
        setStatus(foundOrder.status)
        
        // Set client info
        if (foundOrder.client) {
          setClientInfo({
            first_name: foundOrder.client.first_name || '',
            last_name: foundOrder.client.last_name || '',
            email: foundOrder.client.email || '',
            phone: (foundOrder.client as any).phone || '',
            nif_cif: (foundOrder.client as any).nif_cif || '',
            company_name: (foundOrder.client as any).company_name || '',
            company_position: (foundOrder.client as any).company_position || '',
            activity: (foundOrder.client as any).activity || ''
          })
        }
        
        // Set addresses
        if (foundOrder.billing_address) {
          setBillingAddress({
            address_line1: foundOrder.billing_address.address_line1 || '',
            address_line2: foundOrder.billing_address.address_line2 || '',
            city: foundOrder.billing_address.city || '',
            region: foundOrder.billing_address.region || '',
            postal_code: foundOrder.billing_address.postal_code || ''
          })
        }
        
        if (foundOrder.shipping_address) {
          setShippingAddress({
            address_line1: foundOrder.shipping_address.address_line1 || '',
            address_line2: foundOrder.shipping_address.address_line2 || '',
            city: foundOrder.shipping_address.city || '',
            region: foundOrder.shipping_address.region || '',
            postal_code: foundOrder.shipping_address.postal_code || ''
          })
        }
      } else {
        setError('Pedido no encontrado')
      }
    } catch (err) {
      console.error('Error loading order detail:', err)
      setError('Error al cargar el detalle del pedido')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!order) return
    
    try {
      setSaving(true)
      
      // Update client info if changed
      if (order.client) {
        const clientChanged = 
          clientInfo.first_name !== (order.client.first_name || '') ||
          clientInfo.last_name !== (order.client.last_name || '') ||
          clientInfo.email !== (order.client.email || '') ||
          clientInfo.phone !== ((order.client as any).phone || '') ||
          clientInfo.nif_cif !== ((order.client as any).nif_cif || '') ||
          clientInfo.company_name !== ((order.client as any).company_name || '') ||
          clientInfo.company_position !== ((order.client as any).company_position || '') ||
          clientInfo.activity !== ((order.client as any).activity || '')
        
        if (clientChanged) {
          const clientUpdateSuccess = await AdminService.updateClient(order.client.id, {
            first_name: clientInfo.first_name,
            last_name: clientInfo.last_name,
            email: clientInfo.email,
            phone: clientInfo.phone,
            nif_cif: clientInfo.nif_cif,
            company_name: clientInfo.company_name,
            company_position: clientInfo.company_position,
            activity: clientInfo.activity,
            is_active: true // Keep existing status
          })
          
          if (!clientUpdateSuccess) {
            alert('Error al actualizar la información del cliente')
            return
          }
        }
      }
      
      // Update status
      if (status !== order.status) {
        const success = await AdminService.updateOrderStatus(order.id, {
          status: status as any
        })
        
        if (!success) {
          alert('Error al actualizar el estado del pedido')
          return
        }
      }
      
      // TODO: Update addresses - would need new admin service methods
      console.log('Billing address:', billingAddress)
      console.log('Shipping address:', shippingAddress)
      
      alert('Pedido y cliente actualizados correctamente')
      router.push(`/admin/orders/${order.id}`)
      
    } catch (err) {
      console.error('Error saving order:', err)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ShoppingBagIcon className="h-8 w-8 mr-3 text-indigo-600" />
                  Editar Pedido #{order.id.slice(-8)}
                </h1>
                <p className="mt-2 text-gray-600">
                  Modifica la información del pedido
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Estado del Pedido</h3>
              </div>
              <div className="px-6 py-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={clientInfo.first_name}
                      onChange={(e) => setClientInfo({ ...clientInfo, first_name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellidos *</label>
                    <input
                      type="text"
                      required
                      value={clientInfo.last_name}
                      onChange={(e) => setClientInfo({ ...clientInfo, last_name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">NIF/CIF</label>
                    <input
                      type="text"
                      value={clientInfo.nif_cif}
                      onChange={(e) => setClientInfo({ ...clientInfo, nif_cif: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Empresa</label>
                    <input
                      type="text"
                      value={clientInfo.company_name}
                      onChange={(e) => setClientInfo({ ...clientInfo, company_name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <input
                      type="text"
                      value={clientInfo.company_position}
                      onChange={(e) => setClientInfo({ ...clientInfo, company_position: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actividad</label>
                  <input
                    type="text"
                    value={clientInfo.activity}
                    onChange={(e) => setClientInfo({ ...clientInfo, activity: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Dirección de Facturación</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input
                    type="text"
                    value={billingAddress.address_line1}
                    onChange={(e) => setBillingAddress({ ...billingAddress, address_line1: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección 2 (opcional)</label>
                  <input
                    type="text"
                    value={billingAddress.address_line2}
                    onChange={(e) => setBillingAddress({ ...billingAddress, address_line2: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                    <input
                      type="text"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                    <input
                      type="text"
                      value={billingAddress.postal_code}
                      onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Región</label>
                  <input
                    type="text"
                    value={billingAddress.region}
                    onChange={(e) => setBillingAddress({ ...billingAddress, region: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Dirección de Envío</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input
                    type="text"
                    value={shippingAddress.address_line1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección 2 (opcional)</label>
                  <input
                    type="text"
                    value={shippingAddress.address_line2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                    <input
                      type="text"
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Región</label>
                  <input
                    type="text"
                    value={shippingAddress.region}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, region: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Order Items (Read Only for now) */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Artículos del Pedido</h3>
                <p className="mt-1 text-sm text-gray-500">
                  La edición de artículos se implementará en una futura versión
                </p>
              </div>
              <div className="px-6 py-4">
                {order.order_items && order.order_items.length > 0 ? (
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.variant?.product?.title || 'Producto sin nombre'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.qty} × €{(item.price_cents / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            €{((item.price_cents * item.qty) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-medium text-gray-900">Total:</span>
                        <span className="text-base font-medium text-gray-900">
                          €{(order.total_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay artículos en este pedido</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}