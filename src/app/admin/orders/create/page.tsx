'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminClient } from '@/types/admin'
import { AdminService } from '@/lib/adminService'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ShoppingBagIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface NewOrderItem {
  product_id?: string
  variant_id?: string
  product_title: string
  variant_title?: string
  qty: number
  price_cents: number
}

interface ProductOption {
  id: string
  title: string
  variants: Array<{
    id: string
    title: string
    price_public_cents: number
    stock: number
  }>
}

interface NewOrderData {
  client_id: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  billing_address: {
    first_name: string
    last_name: string
    email: string
    phone: string
    nif_cif?: string
    address_line1: string
    address_line2?: string
    city: string
    region: string
    postal_code: string
    activity?: string
    company_name?: string
    company_position?: string
  }
  shipping_address: {
    first_name: string
    last_name: string
    phone: string
    address_line1: string
    address_line2?: string
    city: string
    region: string
    postal_code: string
  }
  shipping_method: string
  payment_method: string
  notes?: string
  items: NewOrderItem[]
}

export default function AdminOrderCreate() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<AdminClient[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [searchingClients, setSearchingClients] = useState(false)
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<Array<{id: string, name: string, price_cents: number}>>([])
  const [shippingCostCents, setShippingCostCents] = useState(0)
  
  const [orderData, setOrderData] = useState<NewOrderData>({
    client_id: '',
    status: 'pending',
    billing_address: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      nif_cif: '',
      address_line1: '',
      address_line2: '',
      city: '',
      region: '',
      postal_code: '',
      activity: '',
      company_name: '',
      company_position: ''
    },
    shipping_address: {
      first_name: '',
      last_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      region: '',
      postal_code: ''
    },
    shipping_method: '',
    payment_method: '',
    notes: '',
    items: [{ product_id: '', variant_id: '', product_title: '', variant_title: '', qty: 1, price_cents: 0 }]
  })

  useEffect(() => {
    loadProducts()
    loadShippingMethods()
  }, [])

  const loadShippingMethods = async () => {
    try {
      const { data: methods, error } = await supabase
        .from('shipping_methods')
        .select('id, name, price_cents')
        .order('price_cents')
      
      if (!error && methods) {
        setShippingMethods(methods)
      }
    } catch (err) {
      console.error('Error loading shipping methods:', err)
    }
  }

  // Búsqueda de clientes en tiempo real
  useEffect(() => {
    if (clientSearch.trim() === '') {
      setClients([])
      return
    }

    const searchClients = async () => {
      try {
        setSearchingClients(true)
        const results = await AdminService.searchClients(clientSearch)
        setClients(results)
      } catch (err) {
        console.error('Error searching clients:', err)
      } finally {
        setSearchingClients(false)
      }
    }

    const timer = setTimeout(searchClients, 300) // Debounce de 300ms
    return () => clearTimeout(timer)
  }, [clientSearch])

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const data = await AdminService.getAllProducts({}, 100)
      
      // Transformar los datos para el picker
      const productOptions: ProductOption[] = data.map(product => ({
        id: product.id,
        title: product.title,
        variants: product.variants?.map(variant => ({
          id: variant.id,
          title: variant.title || 'Variante estándar',
          price_public_cents: variant.price_public_cents || 0,
          stock: variant.stock || 0
        })) || []
      }))
      
      setProducts(productOptions)
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }



  const handleClientSelect = async (client: AdminClient) => {
    setSelectedClient(client)
    
    // Recalcular precios de items existentes con el nuevo rol
    const updatedItems = await Promise.all(orderData.items.map(async (item) => {
      if (item.variant_id && client.role?.id) {
        const product = products.find(p => p.id === item.product_id)
        const variant = product?.variants.find(v => v.id === item.variant_id)
        if (variant) {
          // Obtener el precio de rol desde la tabla role_prices
          const rolePrice = await AdminService.getRolePriceForVariant(item.variant_id, client.role.id)
          // Si existe precio de rol, usarlo; si no, usar el precio público
          const newPrice = rolePrice !== null ? rolePrice : variant.price_public_cents
          return { ...item, price_cents: newPrice }
        }
      }
      return item
    }))

    setOrderData({
      ...orderData,
      client_id: client.id,
      items: updatedItems,
      billing_address: {
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        phone: client.phone || '',
        nif_cif: client.nif_cif || '',
        address_line1: client.address_line1 || '',
        address_line2: client.address_line2 || '',
        city: client.city || '',
        region: client.region || '',
        postal_code: client.postal_code || '',
        activity: client.activity || '',
        company_name: client.company_name || '',
        company_position: client.company_position || ''
      },
      shipping_address: {
        first_name: '',
        last_name: '',
        phone: '',
        address_line1: client.address_line1 || '',
        address_line2: client.address_line2 || '',
        city: client.city || '',
        region: client.region || '',
        postal_code: client.postal_code || ''
      }
    })
    setClientSearch('')
  }

  const addOrderItem = () => {
    setOrderData({
      ...orderData,
      items: [...orderData.items, { product_id: '', variant_id: '', product_title: '', variant_title: '', qty: 1, price_cents: 0 }]
    })
  }

  const removeOrderItem = (index: number) => {
    const newItems = orderData.items.filter((_, i) => i !== index)
    setOrderData({
      ...orderData,
      items: newItems.length > 0 ? newItems : [{ product_id: '', variant_id: '', product_title: '', variant_title: '', qty: 1, price_cents: 0 }]
    })
  }

  const updateOrderItem = (index: number, field: keyof NewOrderItem, value: any) => {
    const newItems = [...orderData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setOrderData({ ...orderData, items: newItems })
  }

  const copyBillingToShipping = () => {
    setOrderData({
      ...orderData,
      shipping_address: {
        first_name: orderData.billing_address.first_name,
        last_name: orderData.billing_address.last_name,
        phone: orderData.billing_address.phone,
        address_line1: orderData.billing_address.address_line1,
        address_line2: orderData.billing_address.address_line2,
        city: orderData.billing_address.city,
        region: orderData.billing_address.region,
        postal_code: orderData.billing_address.postal_code
      }
    })
  }

  const calculateTotal = () => {
    const itemsTotal = orderData.items.reduce((total, item) => total + (item.qty * item.price_cents), 0)
    return itemsTotal + shippingCostCents
  }

  const handleProductVariantSelect = async (index: number, productId: string, variantId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    const selectedVariant = selectedProduct?.variants.find(v => v.id === variantId)
    
    if (selectedProduct && selectedVariant) {
      // Calcular precio basado en el rol del cliente
      let finalPrice = selectedVariant.price_public_cents
      
      // Obtener el precio del rol desde la tabla role_prices
      if (selectedClient?.role?.id) {
        const rolePrice = await AdminService.getRolePriceForVariant(variantId, selectedClient.role.id)
        if (rolePrice !== null) {
          finalPrice = rolePrice
        }
      }

      const updatedItems = [...orderData.items]
      updatedItems[index] = {
        ...updatedItems[index],
        product_id: productId,
        variant_id: variantId,
        product_title: selectedProduct.title,
        variant_title: selectedVariant.title,
        price_cents: finalPrice
      }

      setOrderData({
        ...orderData,
        items: updatedItems
      })
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('Iniciando creación de pedido...')
      
      // Validate required fields
      if (!orderData.client_id) {
        alert('Debe seleccionar un cliente')
        return
      }
      
      console.log('Cliente seleccionado:', orderData.client_id)

      // Validate billing address
      if (!orderData.billing_address.first_name || !orderData.billing_address.last_name || 
          !orderData.billing_address.email || !orderData.billing_address.phone || 
          !orderData.billing_address.address_line1 || !orderData.billing_address.city) {
        alert('Debe completar todos los campos obligatorios de la dirección de facturación')
        return
      }

      // Validate shipping address  
      if (!orderData.shipping_address.address_line1 || !orderData.shipping_address.city) {
        alert('Debe completar todos los campos obligatorios de la dirección de envío')
        return
      }

      // Campos de shipping y payment son opcionales por ahora (no existen en DB)
      console.log('Métodos de envío y pago seleccionados (no se guardan en DB aún):', {
        shipping: orderData.shipping_method,
        payment: orderData.payment_method
      })
      
      // Limpiar product_id si es producto personalizado antes de validar
      const cleanedItems = orderData.items.map(item => {
        if (item.product_id === '__CUSTOM__' || (!item.product_id && item.product_title)) {
          // Producto personalizado - no necesita product_id ni variant_id
          return {
            ...item,
            product_id: undefined,
            variant_id: undefined
          }
        }
        return item
      })

      // Validar items (después de limpiar)
      const invalidItems = cleanedItems.filter((item, index) => {
        // Para productos del catálogo: deben tener variant_id
        // Para productos personalizados: deben tener product_title
        const isCustomProduct = !item.product_id && item.product_title
        const isCatalogProduct = item.variant_id || (item.product_id && item.product_title)
        const hasProduct = isCustomProduct || isCatalogProduct
        return !hasProduct || item.qty <= 0 || item.price_cents <= 0
      })
      
      if (invalidItems.length > 0) {
        alert('Todos los artículos deben tener:\n- Producto seleccionado del catálogo con variante O\n- Nombre de producto personalizado\n- Cantidad válida (mayor a 0)\n- Precio válido (mayor a 0)')
        return
      }
      
      console.log('Validaciones básicas completadas')

      // Advertir sobre productos del catálogo sin variante seleccionada (excluir personalizados)
      const itemsWithoutVariant = cleanedItems.filter(item => 
        item.product_id && !item.variant_id
      )
      
      if (itemsWithoutVariant.length > 0) {
        const confirmed = confirm(
          `Hay ${itemsWithoutVariant.length} artículo(s) del catálogo sin variante específica seleccionada. ` +
          `Esto puede afectar el control de stock. ¿Deseas continuar?`
        )
        if (!confirmed) return
      }
      
      // Combinar billing y shipping address en el campo shipping_address (único disponible en DB)
      const combinedAddress = {
        billing: orderData.billing_address,
        shipping: orderData.shipping_address,
        shipping_method: orderData.shipping_method,
        payment_method: orderData.payment_method,
        notes: orderData.notes
      }

      const itemsTotalCents = cleanedItems.reduce((total, item) => total + (item.qty * item.price_cents), 0)
      // subtotal_cents incluye items + envío (base imponible para IVA, sin IVA)
      // Los precios ya incluyen IVA, así que: subtotal_sin_iva = (items + envío) / 1.21
      const subtotalWithTaxCents = itemsTotalCents + shippingCostCents
      const TAX_RATE = 21
      const subtotalCents = Math.round(subtotalWithTaxCents / (1 + TAX_RATE / 100))
      const totalCents = subtotalWithTaxCents
      
      console.log('Datos del pedido a enviar:', {
        client_id: orderData.client_id,
        status: orderData.status,
        subtotal_cents: subtotalCents,
        shipping_cost_cents: shippingCostCents,
        total_cents: totalCents,
        items_count: orderData.items.length,
        combined_address: combinedAddress
      })
      
      const newOrderId = await AdminService.createOrder({
        client_id: orderData.client_id,
        status: orderData.status,
        subtotal_cents: subtotalCents,
        shipping_cost_cents: shippingCostCents,
        total_cents: totalCents,
        shipping_address: combinedAddress,
        items: cleanedItems
      })
      
      if (newOrderId) {
        alert('Pedido creado correctamente')
        router.push(`/admin/orders/${newOrderId}`)
      } else {
        alert('Error al crear el pedido')
      }
      
    } catch (err) {
      console.error('Error creating order:', err)
      // Mostrar información más específica del error
      let errorMessage = 'Error desconocido al crear el pedido'
      
      if (err instanceof Error) {
        errorMessage = err.message
        console.error('Error stack:', err.stack)
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err)
      }
      
      alert(`Error al crear el pedido: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const filteredClients = clients // Ya están filtrados desde la búsqueda en la API

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/orders')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ShoppingBagIcon className="h-8 w-8 mr-3 text-indigo-600" />
                  Crear Nuevo Pedido
                </h1>
                <p className="mt-2 text-gray-600">
                  Crea un pedido manualmente desde el panel de administración
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/orders')}
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
                {saving ? 'Creando...' : 'Crear Pedido'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Client Selection */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Seleccionar Cliente</h3>
              </div>
              <div className="px-6 py-4">
                {selectedClient ? (
                  <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <UserIcon className="h-8 w-8 text-indigo-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedClient.first_name} {selectedClient.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{selectedClient.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClient(null)
                        setOrderData({ ...orderData, client_id: '' })
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Buscar cliente por nombre o email..."
                      />
                    </div>
                    
                    {clientSearch && (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                        {searchingClients && (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            Buscando clientes...
                          </div>
                        )}
                        {!searchingClients && filteredClients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => handleClientSelect(client)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                  {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {client.first_name} {client.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{client.email}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                        {!searchingClients && filteredClients.length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No se encontraron clientes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Estado del Pedido</h3>
              </div>
              <div className="px-6 py-4">
                <select
                  value={orderData.status}
                  onChange={(e) => setOrderData({ ...orderData, status: e.target.value as any })}
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

            {/* Billing Address */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Dirección de Facturación</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={orderData.billing_address.first_name}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        billing_address: { ...orderData.billing_address, first_name: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellidos *</label>
                    <input
                      type="text"
                      required
                      value={orderData.billing_address.last_name}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        billing_address: { ...orderData.billing_address, last_name: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={orderData.billing_address.email}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      billing_address: { ...orderData.billing_address, email: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono *</label>
                    <input
                      type="tel"
                      required
                      value={orderData.billing_address.phone}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        billing_address: { ...orderData.billing_address, phone: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">NIF/CIF</label>
                    <input
                      type="text"
                      value={orderData.billing_address.nif_cif}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        billing_address: { ...orderData.billing_address, nif_cif: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="12345678Z"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección *</label>
                  <input
                    type="text"
                    required
                    value={orderData.billing_address.address_line1}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      billing_address: { ...orderData.billing_address, address_line1: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección 2</label>
                  <input
                    type="text"
                    value={orderData.billing_address.address_line2}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      billing_address: { ...orderData.billing_address, address_line2: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciudad *</label>
                    <input
                      type="text"
                      required
                      value={orderData.billing_address.city}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        billing_address: { ...orderData.billing_address, city: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                    <input
                      type="text"
                      value={orderData.billing_address.postal_code}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        billing_address: { ...orderData.billing_address, postal_code: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Región</label>
                  <input
                    type="text"
                    value={orderData.billing_address.region}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      billing_address: { ...orderData.billing_address, region: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                {/* Información empresarial opcional */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Información Empresarial (Opcional)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Actividad</label>
                      <input
                        type="text"
                        value={orderData.billing_address.activity}
                        onChange={(e) => setOrderData({
                          ...orderData,
                          billing_address: { ...orderData.billing_address, activity: e.target.value }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Actividad económica"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Empresa</label>
                        <input
                          type="text"
                          value={orderData.billing_address.company_name}
                          onChange={(e) => setOrderData({
                            ...orderData,
                            billing_address: { ...orderData.billing_address, company_name: e.target.value }
                          })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Nombre de la empresa"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cargo</label>
                        <input
                          type="text"
                          value={orderData.billing_address.company_position}
                          onChange={(e) => setOrderData({
                            ...orderData,
                            billing_address: { ...orderData.billing_address, company_position: e.target.value }
                          })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Cargo en la empresa"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Dirección de Envío</h3>
                  <button
                    type="button"
                    onClick={copyBillingToShipping}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Copiar de facturación
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección *</label>
                  <input
                    type="text"
                    required
                    value={orderData.shipping_address.address_line1}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      shipping_address: { ...orderData.shipping_address, address_line1: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección 2</label>
                  <input
                    type="text"
                    value={orderData.shipping_address.address_line2}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      shipping_address: { ...orderData.shipping_address, address_line2: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciudad *</label>
                    <input
                      type="text"
                      required
                      value={orderData.shipping_address.city}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        shipping_address: { ...orderData.shipping_address, city: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                    <input
                      type="text"
                      value={orderData.shipping_address.postal_code}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        shipping_address: { ...orderData.shipping_address, postal_code: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Región</label>
                  <input
                    type="text"
                    value={orderData.shipping_address.region}
                    onChange={(e) => setOrderData({
                      ...orderData,
                      shipping_address: { ...orderData.shipping_address, region: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Artículos del Pedido</h3>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Artículo {index + 1}</span>
                      {orderData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {/* Selector de Producto */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Producto *</label>
                        <select
                          value={item.product_id || ''}
                          onChange={(e) => {
                            const productId = e.target.value
                            if (productId === '__CUSTOM__') {
                              // Producto personalizado - limpiar IDs y permitir entrada manual
                              const updatedItems = [...orderData.items]
                              updatedItems[index] = {
                                ...updatedItems[index],
                                product_id: '__CUSTOM__', // Marca para identificar producto personalizado
                                variant_id: '',
                                product_title: '',
                                variant_title: '',
                                price_cents: 0
                              }
                              setOrderData({ ...orderData, items: updatedItems })
                            } else if (productId) {
                              // Auto-seleccionar la primera variante si solo hay una
                              const selectedProduct = products.find(p => p.id === productId)
                              if (selectedProduct && selectedProduct.variants.length === 1) {
                                handleProductVariantSelect(index, productId, selectedProduct.variants[0].id)
                              } else {
                                // Solo actualizar el producto, el usuario deberá seleccionar variante
                                const updatedItems = [...orderData.items]
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  product_id: productId,
                                  variant_id: '',
                                  product_title: selectedProduct?.title || '',
                                  variant_title: '',
                                  price_cents: 0
                                }
                                setOrderData({ ...orderData, items: updatedItems })
                              }
                            } else {
                              // Limpiar todo
                              const updatedItems = [...orderData.items]
                              updatedItems[index] = {
                                ...updatedItems[index],
                                product_id: '',
                                variant_id: '',
                                product_title: '',
                                variant_title: '',
                                price_cents: 0
                              }
                              setOrderData({ ...orderData, items: updatedItems })
                            }
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Seleccionar producto...</option>
                          <option value="__CUSTOM__" className="font-semibold text-indigo-600">
                            ➕ Producto Personalizado (no existe en catálogo)
                          </option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.title} ({product.variants.length} variante{product.variants.length !== 1 ? 's' : ''})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Campos para producto personalizado */}
                      {(item.product_id === '__CUSTOM__' || (!item.product_id && !item.variant_id)) && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre del Producto *</label>
                            <input
                              type="text"
                              value={item.product_title || ''}
                              onChange={(e) => updateOrderItem(index, 'product_title', e.target.value)}
                              placeholder="Ej: Instalación de suelo radiante"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Descripción/Variante (opcional)</label>
                            <input
                              type="text"
                              value={item.variant_title || ''}
                              onChange={(e) => updateOrderItem(index, 'variant_title', e.target.value)}
                              placeholder="Ej: Para vivienda de 100m²"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </>
                      )}

                      {/* Selector de Variante */}
                      {item.product_id && item.product_id !== '__CUSTOM__' && (
                        <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Variante *</label>
                          <select
                            value={item.variant_id || ''}
                            onChange={(e) => {
                              if (e.target.value && item.product_id) {
                                handleProductVariantSelect(index, item.product_id, e.target.value)
                              }
                            }}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="">Seleccionar variante...</option>
                            {products
                              .find(p => p.id === item.product_id)
                              ?.variants.map(variant => (
                                <option key={variant.id} value={variant.id}>
                                  {variant.title} - €{(variant.price_public_cents / 100).toFixed(2)} 
                                  {variant.stock > 0 ? ` (Stock: ${variant.stock})` : ' (Sin stock)'}
                                </option>
                              ))}
                          </select>
                          </div>
                          
                          {/* Campo editable para nombre de variante */}
                          {item.variant_id && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Nombre de Variante (editable)
                                <span className="text-xs text-gray-500 ml-2">Puedes modificar el nombre que aparecerá en la factura</span>
                              </label>
                              <input
                                type="text"
                                value={item.variant_title || ''}
                                onChange={(e) => updateOrderItem(index, 'variant_title', e.target.value)}
                                placeholder="Dejar vacío para usar el nombre del catálogo"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                        </div>
                          )}
                        </>
                      )}

                      {/* Información del producto seleccionado */}
                      {item.product_title && (item.variant_id || item.variant_title) && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm font-medium text-gray-900">{item.product_title}</p>
                          {item.variant_title && (
                          <p className="text-sm text-gray-600">{item.variant_title}</p>
                          )}
                          {!item.variant_id && (
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ Producto personalizado - No se descontará stock
                            </p>
                          )}
                          {selectedClient?.role?.name && selectedClient.role.name !== 'guest' && item.variant_id && (
                            <p className="text-sm text-green-600">
                              Precio con descuento {selectedClient.role.name}: 
                              €{(item.price_cents / 100).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cantidad *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.qty}
                            onChange={(e) => updateOrderItem(index, 'qty', parseInt(e.target.value) || 1)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Precio unitario (€) *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={(item.price_cents / 100).toFixed(2)}
                            onChange={(e) => updateOrderItem(index, 'price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          {item.variant_id && (
                            <p className="text-xs text-gray-500 mt-1">Precio sugerido según el rol. Puedes modificarlo manualmente.</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        Subtotal: €{((item.qty * item.price_cents) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">
                      €{((orderData.items.reduce((total, item) => total + (item.qty * item.price_cents), 0)) / 100).toFixed(2)}
                    </span>
                  </div>
                  {shippingCostCents > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Envío:</span>
                      <span className="text-gray-900">€{(shippingCostCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="text-base font-medium text-gray-900">Total del Pedido:</span>
                    <span className="text-base font-medium text-gray-900">
                      €{(calculateTotal() / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping & Payment Methods */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Envío y Pago</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Método de Envío *</label>
                    <select
                      required
                      value={orderData.shipping_method}
                      onChange={(e) => {
                        const selectedMethod = shippingMethods.find(m => m.id === e.target.value)
                        setOrderData({ ...orderData, shipping_method: e.target.value })
                        if (selectedMethod) {
                          setShippingCostCents(selectedMethod.price_cents)
                        }
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Seleccionar método</option>
                      {shippingMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name} - €{(method.price_cents / 100).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Método de Pago *</label>
                    <select
                      required
                      value={orderData.payment_method}
                      onChange={(e) => setOrderData({ ...orderData, payment_method: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Seleccionar método</option>
                      <option value="transfer">Transferencia Bancaria</option>
                      <option value="card">Tarjeta de Crédito</option>
                      <option value="paypal">PayPal</option>
                      <option value="cash">Efectivo (Recogida)</option>
                      <option value="financing">Financiación</option>
                    </select>
                  </div>
                </div>
                

              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Notas del Pedido</h3>
              </div>
              <div className="px-6 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea
                    rows={4}
                    value={orderData.notes}
                    onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Instrucciones especiales, notas de instalación, etc."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}