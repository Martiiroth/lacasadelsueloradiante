'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import type { ProductWithVariants } from '../../../types/products'
import { ProductService } from '../../../lib/products'
import ImageGallery from '../../../components/products/ImageGallery'
import VariantSelector from '../../../components/products/VariantSelector'
import AddToCartButton from '../../../components/products/AddToCartButton'
import Reviews from '../../../components/products/Reviews'
import ResourcesList from '../../../components/products/ResourcesList'
import { TestDataService } from '../../../lib/test-data'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = params?.slug as string

  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Cargar producto
  useEffect(() => {
    if (!slug) return

    const loadProduct = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Primero asegurar que el producto existe
        await TestDataService.createProductWithSlug(slug)
        
        const productData = await ProductService.getProductBySlug(
          slug, 
          user?.client?.customer_role?.name
        )
        
        if (!productData) {
          setError('Producto no encontrado')
          return
        }

        console.log('🎯 Product data loaded:', productData)
        setProduct(productData)
        
        // Seleccionar primera variante disponible
        if (productData.variants && productData.variants.length > 0) {
          const firstAvailable = productData.variants.find(v => v.stock > 0) 
            || productData.variants[0]
          setSelectedVariantId(firstAvailable.id)
          console.log('🔧 Selected variant:', firstAvailable.title || firstAvailable.sku)
        }
      } catch (err) {
        setError('Error al cargar el producto')
        console.error('❌ Error loading product:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug, user?.client?.customer_role?.name])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Producto no encontrado'}
          </h1>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      </div>
    )
  }

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId)
  const hasMultipleVariants = (product.variants?.length || 0) > 1

  // Debug logs
  console.log('🎯 Current state:', { 
    loading, 
    error, 
    productLoaded: !!product,
    variantsCount: product?.variants?.length || 0,
    selectedVariantId,
    selectedVariant: selectedVariant ? { id: selectedVariant.id, title: selectedVariant.title, stock: selectedVariant.stock } : null
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-700 hover:text-blue-600"
              >
                Inicio
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <button
                  onClick={() => router.push('/products')}
                  className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2"
                >
                  Productos
                </button>
              </div>
            </li>
            {product.categories && product.categories.length > 0 && (
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-gray-500 md:ml-2">
                    {product.categories[0].name}
                  </span>
                </div>
              </li>
            )}
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">
                  {product.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galería de imágenes */}
          <div>
            {product.images && product.images.length > 0 ? (
              <ImageGallery 
                productImages={product.images}
                variantImages={selectedVariant?.images || []}
                productTitle={product.title}
              />
            ) : (
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Sin imagen disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {product.is_new && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Nuevo
                  </span>
                )}
                {product.is_on_sale && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    Oferta
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>
              
              {product.short_description && (
                <p className="text-xl text-gray-600 mb-6">
                  {product.short_description}
                </p>
              )}
            </div>

            {/* Selector de variantes */}
            {product.variants && product.variants.length > 0 && (
              <div>
                {hasMultipleVariants && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Opciones disponibles
                    </h3>
                    <VariantSelector
                      variants={product.variants}
                      selectedVariant={selectedVariant || null}
                      onVariantChange={(variant) => setSelectedVariantId(variant.id)}
                    />
                  </>
                )}
                
                {/* Mostrar variante única sin selector */}
                {!hasMultipleVariants && selectedVariant && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Producto disponible
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {selectedVariant.title || product.title}
                        </h4>
                        {selectedVariant.sku && (
                          <p className="text-sm text-gray-500">SKU: {selectedVariant.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">
                          €{(selectedVariant.price_public_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Precio y stock */}
            {selectedVariant ? (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {user?.client?.customer_role?.name && selectedVariant.role_prices?.find(rp => rp.role?.name === user.client?.customer_role?.name) 
                        ? `€${(selectedVariant.role_prices.find(rp => rp.role?.name === user.client?.customer_role?.name)!.price_cents / 100).toFixed(2)}`
                        : `€${(selectedVariant.price_public_cents / 100).toFixed(2)}`
                      }
                    </div>
                    {user?.client?.customer_role?.name && selectedVariant.role_prices?.find(rp => rp.role?.name === user.client?.customer_role?.name) && (
                      <div className="text-sm text-gray-500">
                        Precio público: €{(selectedVariant.price_public_cents / 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedVariant.stock > 0 
                        ? `${selectedVariant.stock} en stock`
                        : 'Sin stock'
                      }
                    </div>
                    {selectedVariant.sku && (
                      <div className="text-xs text-gray-500 mt-1">
                        SKU: {selectedVariant.sku}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cantidad y botón de añadir al carrito */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <label htmlFor="quantity" className="sr-only">
                      Cantidad
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={quantity <= 1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedVariant.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-3 py-2 text-center border-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={quantity >= selectedVariant.stock}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <AddToCartButton
                      variant={selectedVariant}
                      disabled={selectedVariant.stock === 0}
                      quantity={quantity}
                    />
                  </div>
                </div>
              </div>
            ) : product.variants && product.variants.length > 0 ? (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="text-center text-gray-500">
                  <p className="mb-4">Selecciona una variante para ver el precio y añadir al carrito</p>
                  <p className="text-sm">Variantes disponibles: {product.variants.length}</p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="text-center text-gray-500">
                  <p>Este producto no tiene variantes disponibles</p>
                </div>
              </div>
            )}

            {/* Información técnica de la variante */}
            {selectedVariant && (selectedVariant.weight_grams || selectedVariant.dimensions || selectedVariant.sku) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Especificaciones técnicas
                </h3>
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  {selectedVariant.sku && (
                    <div className="flex justify-between">
                      <dt className="font-medium text-gray-700">SKU:</dt>
                      <dd className="text-gray-600">{selectedVariant.sku}</dd>
                    </div>
                  )}
                  {selectedVariant.weight_grams && (
                    <div className="flex justify-between">
                      <dt className="font-medium text-gray-700">Peso:</dt>
                      <dd className="text-gray-600">{selectedVariant.weight_grams}g</dd>
                    </div>
                  )}
                  {selectedVariant.dimensions && (
                    <div className="flex justify-between">
                      <dt className="font-medium text-gray-700">Dimensiones:</dt>
                      <dd className="text-gray-600">
                        {typeof selectedVariant.dimensions === 'object' 
                          ? Object.entries(selectedVariant.dimensions)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')
                          : String(selectedVariant.dimensions)
                        }
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Categorías */}
            {product.categories && product.categories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Categorías
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <span
                      key={category.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Descripción completa */}
        {product.description && (
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Descripción del producto
              </h2>
              <div 
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </div>
        )}

        {/* Recursos */}
        {product.resources && product.resources.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <ResourcesList resources={product.resources} />
            </div>
          </div>
        )}

        {/* Reviews */}
        {product.reviews && (
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <Reviews 
                reviews={product.reviews}
                productId={product.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}