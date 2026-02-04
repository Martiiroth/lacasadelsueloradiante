'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { AdminService } from '@/lib/adminService'
import type { AdminProduct } from '@/types/admin'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

export default function AdminCarouselPage() {
  const [productIds, setProductIds] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addSearch, setAddSearch] = useState('')

  useEffect(() => {
    loadCarousel()
    loadProducts()
  }, [])

  const loadCarousel = async () => {
    try {
      const res = await fetch('/api/admin/carousel')
      if (!res.ok) throw new Error('Error al cargar')
      const data = await res.json()
      setProductIds(data.product_ids || [])
    } catch (e) {
      setMessage({ type: 'error', text: 'No se pudo cargar el carrusel' })
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await AdminService.getAllProducts({}, 1000, 0)
      setAllProducts(data || [])
    } catch (e) {
      console.error('Error loading products:', e)
    }
  }

  const saveCarousel = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: productIds })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al guardar')
      setMessage({ type: 'success', text: 'Carrusel guardado correctamente' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  const addProduct = (id: string) => {
    if (productIds.includes(id)) return
    setProductIds((prev) => [...prev, id])
  }

  const removeProduct = (id: string) => {
    setProductIds((prev) => prev.filter((pid) => pid !== id))
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    setProductIds((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  const moveDown = (index: number) => {
    if (index >= productIds.length - 1) return
    setProductIds((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  const byId = new Map(allProducts.map((p) => [p.id, p]))
  const inCarousel = new Set(productIds)
  const available = allProducts.filter((p) => !inCarousel.has(p.id))
  const filteredAvailable = addSearch.trim()
    ? available.filter(
        (p) =>
          p.title.toLowerCase().includes(addSearch.toLowerCase()) ||
          (p.slug || '').toLowerCase().includes(addSearch.toLowerCase())
      )
    : available.slice(0, 30)

  if (loading) {
    return (
      <AdminLayout activeSection="carousel">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeSection="carousel">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carrusel de la homepage</h1>
        <p className="text-gray-600 mb-6">
          Elige los productos que quieres mostrar en el carrusel infinito de la página principal. El orden aquí define el orden de aparición.
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos en el carrusel</h2>
            {productIds.length === 0 ? (
              <p className="text-gray-500 text-sm">Aún no hay productos. Añade algunos desde la columna de la derecha.</p>
            ) : (
              <ul className="space-y-2">
                {productIds.map((id, index) => {
                  const product = byId.get(id)
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                      <span className="flex-1 truncate text-gray-900">
                        {product?.title ?? id}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Subir"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === productIds.length - 1}
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Bajar"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProduct(id)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50"
                          aria-label="Quitar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Añadir producto</h2>
            <div className="mb-4">
              <input
                type="text"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Buscar por nombre o slug..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <ul className="space-y-1 max-h-80 overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <li className="text-gray-500 text-sm py-4">
                  {available.length === 0 ? 'Todos los productos ya están en el carrusel.' : 'No hay coincidencias.'}
                </li>
              ) : (
                filteredAvailable.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="truncate text-sm text-gray-900">{p.title}</span>
                    <button
                      type="button"
                      onClick={() => addProduct(p.id)}
                      className="flex-shrink-0 p-1.5 rounded text-brand-600 hover:bg-brand-50"
                      aria-label={`Añadir ${p.title}`}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={saveCarousel}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5 mr-2" />
                Guardar carrusel
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
