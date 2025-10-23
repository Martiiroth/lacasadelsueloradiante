# API de Productos - Documentación para App Móvil

## 📱 Descripción General

API REST para mostrar productos de la tienda en la app móvil con tarjetas (cards) que incluyen:
- Imagen del producto
- Nombre del producto
- Precio
- Enlace directo a la web del producto

**Base URL:** `https://lacasadelsueloradiante.es/api/mobile`

---

## 🛍️ Endpoints de Productos

### 1. Listar Productos

Obtiene una lista de productos con paginación y filtros.

**Endpoint:** `GET /api/mobile/products`

**Parámetros Query (opcionales):**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Cantidad de productos a retornar |
| `offset` | number | 0 | Offset para paginación |
| `category` | string | - | Slug de categoría para filtrar |
| `search` | string | - | Búsqueda por título del producto |
| `brand_id` | uuid | - | Filtrar por marca |
| `is_new` | boolean | - | Solo productos nuevos |
| `is_on_sale` | boolean | - | Solo productos en oferta |
| `in_stock` | boolean | - | Solo productos con stock disponible |

**Ejemplos de URLs:**

```
GET /api/mobile/products
GET /api/mobile/products?limit=10&offset=0
GET /api/mobile/products?category=suelo-radiante
GET /api/mobile/products?search=termostato
GET /api/mobile/products?is_new=true
GET /api/mobile/products?is_on_sale=true&in_stock=true
```

**Respuesta (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "slug": "termostato-wifi-inteligente",
      "title": "Termostato WiFi Inteligente",
      "short_description": "Control inteligente de temperatura con WiFi",
      "is_new": true,
      "is_on_sale": false,
      
      "image": {
        "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato.jpg",
        "alt": "Termostato WiFi Inteligente"
      },
      
      "images": [
        {
          "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato.jpg",
          "alt": "Termostato WiFi Inteligente",
          "position": 0
        },
        {
          "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato-2.jpg",
          "alt": "Vista lateral",
          "position": 1
        }
      ],
      
      "brand": {
        "id": "456e4567-e89b-12d3-a456-426614174222",
        "name": "Honeywell",
        "slug": "honeywell",
        "logo_url": "https://xyzabcdef.supabase.co/storage/v1/object/public/brand-logos/honeywell.png"
      },
      
      "categories": [
        {
          "id": "789e4567-e89b-12d3-a456-426614174333",
          "name": "Termostatos",
          "slug": "termostatos"
        }
      ],
      
      "price": {
        "min_cents": 8999,
        "max_cents": 8999,
        "formatted_min": "89.99€",
        "formatted_max": "89.99€",
        "has_range": false
      },
      
      "stock": {
        "total": 15,
        "available": true,
        "is_backorder": false
      },
      
      "variants_count": 1,
      
      "web_url": "https://lacasadelsueloradiante.es/products/termostato-wifi-inteligente",
      "api_url": "https://lacasadelsueloradiante.es/api/mobile/products/termostato-wifi-inteligente"
    },
    {
      "id": "234e4567-e89b-12d3-a456-426614174111",
      "slug": "cable-calefactor-10m",
      "title": "Cable Calefactor 10m",
      "short_description": "Cable calefactor para suelo radiante",
      "is_new": false,
      "is_on_sale": true,
      
      "image": {
        "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/cable.jpg",
        "alt": "Cable Calefactor 10m"
      },
      
      "images": [
        {
          "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/cable.jpg",
          "alt": "Cable Calefactor 10m",
          "position": 0
        }
      ],
      
      "brand": null,
      
      "categories": [
        {
          "id": "890e4567-e89b-12d3-a456-426614174444",
          "name": "Cables Calefactores",
          "slug": "cables-calefactores"
        }
      ],
      
      "price": {
        "min_cents": 12500,
        "max_cents": 15000,
        "formatted_min": "125.00€",
        "formatted_max": "150.00€",
        "has_range": true
      },
      
      "stock": {
        "total": 0,
        "available": false,
        "is_backorder": true
      },
      
      "variants_count": 2,
      
      "web_url": "https://lacasadelsueloradiante.es/products/cable-calefactor-10m",
      "api_url": "https://lacasadelsueloradiante.es/api/mobile/products/cable-calefactor-10m"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "returned": 2,
    "has_more": false
  },
  "filters_applied": {
    "category": null,
    "search": null,
    "brand_id": null,
    "is_new": false,
    "is_on_sale": false,
    "in_stock": false
  }
}
```

---

### 2. Detalle de Producto

Obtiene información completa de un producto específico.

**Endpoint:** `GET /api/mobile/products/{slug}`

**Parámetros URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `slug` | string | Slug único del producto |

**Ejemplo:**

```
GET /api/mobile/products/termostato-wifi-inteligente
```

**Respuesta (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "slug": "termostato-wifi-inteligente",
    "title": "Termostato WiFi Inteligente",
    "short_description": "Control inteligente de temperatura con WiFi",
    "description": "Termostato programable con conexión WiFi que te permite controlar la temperatura de tu hogar desde cualquier lugar usando tu smartphone. Compatible con asistentes de voz como Alexa y Google Home.",
    "is_new": true,
    "is_on_sale": false,
    "created_at": "2025-10-15T10:00:00.000Z",
    
    "brand": {
      "id": "456e4567-e89b-12d3-a456-426614174222",
      "name": "Honeywell",
      "slug": "honeywell",
      "description": "Líder mundial en control de climatización",
      "logo_url": "https://xyzabcdef.supabase.co/storage/v1/object/public/brand-logos/honeywell.png",
      "website": "https://www.honeywell.com"
    },
    
    "images": [
      {
        "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato.jpg",
        "alt": "Termostato WiFi Inteligente",
        "position": 0
      },
      {
        "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato-2.jpg",
        "alt": "Vista lateral",
        "position": 1
      },
      {
        "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato-3.jpg",
        "alt": "Instalación",
        "position": 2
      }
    ],
    
    "main_image": {
      "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato.jpg",
      "alt": "Termostato WiFi Inteligente",
      "position": 0
    },
    
    "categories": [
      {
        "id": "789e4567-e89b-12d3-a456-426614174333",
        "name": "Termostatos",
        "slug": "termostatos"
      },
      {
        "id": "890e4567-e89b-12d3-a456-426614174444",
        "name": "Smart Home",
        "slug": "smart-home"
      }
    ],
    
    "price": {
      "min_cents": 8999,
      "max_cents": 8999,
      "formatted_min": "89.99€",
      "formatted_max": "89.99€",
      "has_range": false
    },
    
    "stock": {
      "total": 15,
      "available": true,
      "is_backorder": false
    },
    
    "variants": [
      {
        "id": "345e4567-e89b-12d3-a456-426614174555",
        "sku": "TERM-WIFI-001",
        "title": "Blanco",
        "price": {
          "cents": 8999,
          "formatted": "89.99€",
          "euros": "89.99"
        },
        "stock": {
          "quantity": 15,
          "available": true,
          "is_backorder": false
        },
        "weight_grams": 250,
        "dimensions": {
          "width": 10,
          "height": 10,
          "depth": 3
        },
        "images": [
          {
            "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/variant-images/termostato-blanco.jpg",
            "alt": "Termostato blanco",
            "position": 0
          }
        ]
      }
    ],
    
    "variants_count": 1,
    
    "resources": [
      {
        "id": "567e4567-e89b-12d3-a456-426614174666",
        "type": "manual",
        "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/manuals/termostato-manual.pdf",
        "label": "Manual de usuario"
      },
      {
        "id": "678e4567-e89b-12d3-a456-426614174777",
        "type": "video",
        "url": "https://youtube.com/watch?v=xyz123",
        "label": "Tutorial de instalación"
      }
    ],
    
    "web_url": "https://lacasadelsueloradiante.es/products/termostato-wifi-inteligente",
    "share_url": "https://lacasadelsueloradiante.es/products/termostato-wifi-inteligente",
    
    "meta": {
      "title": "Termostato WiFi Inteligente - La Casa del Suelo Radiante",
      "description": "Control inteligente de temperatura con WiFi"
    }
  }
}
```

**404 - Producto no encontrado:**

```json
{
  "error": "Producto no encontrado"
}
```

---

## 📂 Endpoint de Categorías

### Listar Categorías

Obtiene todas las categorías con contador de productos.

**Endpoint:** `GET /api/mobile/categories`

**Parámetros Query (opcionales):**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `include_products` | boolean | false | Incluir productos destacados de cada categoría |

**Ejemplo:**

```
GET /api/mobile/categories
GET /api/mobile/categories?include_products=true
```

**Respuesta (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "789e4567-e89b-12d3-a456-426614174333",
      "name": "Termostatos",
      "slug": "termostatos",
      "parent": null,
      "products_count": 12,
      "featured_products": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "slug": "termostato-wifi-inteligente",
          "title": "Termostato WiFi Inteligente",
          "image": {
            "url": "https://xyzabcdef.supabase.co/storage/v1/object/public/product-images/termostato.jpg",
            "alt": "Termostato WiFi Inteligente"
          },
          "web_url": "https://lacasadelsueloradiante.es/products/termostato-wifi-inteligente"
        }
      ]
    },
    {
      "id": "890e4567-e89b-12d3-a456-426614174444",
      "name": "Cables Calefactores",
      "slug": "cables-calefactores",
      "parent": {
        "id": "999e4567-e89b-12d3-a456-426614174888",
        "name": "Suelo Radiante",
        "slug": "suelo-radiante"
      },
      "products_count": 25,
      "featured_products": []
    }
  ],
  "total": 2
}
```

---

## 📱 Integración en la App

### Ejemplo de Card de Producto (React Native)

```typescript
import React from 'react'
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native'

interface ProductCardProps {
  product: {
    id: string
    title: string
    short_description: string
    image: { url: string; alt: string } | null
    price: {
      formatted_min: string
      formatted_max: string
      has_range: boolean
    }
    stock: {
      available: boolean
      is_backorder: boolean
    }
    is_new: boolean
    is_on_sale: boolean
    web_url: string
  }
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const openProduct = () => {
    Linking.openURL(product.web_url)
  }
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={openProduct}
      activeOpacity={0.8}
    >
      {/* Badges */}
      <View style={styles.badges}>
        {product.is_new && (
          <View style={styles.badgeNew}>
            <Text style={styles.badgeText}>NUEVO</Text>
          </View>
        )}
        {product.is_on_sale && (
          <View style={styles.badgeSale}>
            <Text style={styles.badgeText}>OFERTA</Text>
          </View>
        )}
      </View>
      
      {/* Imagen */}
      <Image
        source={{ uri: product.image?.url || 'https://via.placeholder.com/300' }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Información */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {product.short_description}
        </Text>
        
        {/* Precio */}
        <Text style={styles.price}>
          {product.price.has_range 
            ? `${product.price.formatted_min} - ${product.price.formatted_max}`
            : product.price.formatted_min
          }
        </Text>
        
        {/* Stock */}
        {product.stock.is_backorder ? (
          <Text style={styles.stockBackorder}>Bajo pedido</Text>
        ) : product.stock.available ? (
          <Text style={styles.stockAvailable}>En stock</Text>
        ) : (
          <Text style={styles.stockUnavailable}>Sin stock</Text>
        )}
        
        {/* Botón */}
        <TouchableOpacity style={styles.button} onPress={openProduct}>
          <Text style={styles.buttonText}>Ver en la web</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badges: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  badgeNew: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSale: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  stockAvailable: {
    fontSize: 12,
    color: '#22c55e',
    marginBottom: 12,
  },
  stockBackorder: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 12,
  },
  stockUnavailable: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
})
```

### Ejemplo de Servicio para Obtener Productos

```typescript
// services/productsService.ts
const API_BASE = 'https://lacasadelsueloradiante.es/api/mobile'

export class ProductsService {
  // Listar productos
  static async getProducts(options: {
    limit?: number
    offset?: number
    category?: string
    search?: string
    isNew?: boolean
    isOnSale?: boolean
    inStock?: boolean
  } = {}) {
    try {
      const params = new URLSearchParams()
      
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())
      if (options.category) params.append('category', options.category)
      if (options.search) params.append('search', options.search)
      if (options.isNew) params.append('is_new', 'true')
      if (options.isOnSale) params.append('is_on_sale', 'true')
      if (options.inStock) params.append('in_stock', 'true')
      
      const url = `${API_BASE}/products${params.toString() ? '?' + params.toString() : ''}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar productos')
      }
      
      return data
    } catch (error) {
      console.error('Error en getProducts:', error)
      throw error
    }
  }
  
  // Detalle de producto
  static async getProduct(slug: string) {
    try {
      const response = await fetch(`${API_BASE}/products/${slug}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar producto')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en getProduct:', error)
      throw error
    }
  }
  
  // Listar categorías
  static async getCategories(includeProducts = false) {
    try {
      const url = `${API_BASE}/categories${includeProducts ? '?include_products=true' : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar categorías')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en getCategories:', error)
      throw error
    }
  }
}
```

### Ejemplo de Pantalla de Productos

```typescript
import React, { useEffect, useState } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { ProductCard } from '../components/ProductCard'
import { ProductsService } from '../services/productsService'

export const ProductsScreen = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  const loadProducts = async (refresh = false) => {
    try {
      const currentOffset = refresh ? 0 : offset
      
      const response = await ProductsService.getProducts({
        limit: 20,
        offset: currentOffset,
        inStock: true // Opcional: solo productos en stock
      })
      
      if (refresh) {
        setProducts(response.data)
      } else {
        setProducts(prev => [...prev, ...response.data])
      }
      
      setHasMore(response.pagination.has_more)
      setOffset(currentOffset + response.pagination.returned)
      
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadProducts()
  }, [])
  
  const handleRefresh = () => {
    setOffset(0)
    loadProducts(true)
  }
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadProducts()
    }
  }
  
  if (loading && products.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }
  
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
      keyExtractor={(item) => item.id}
      onRefresh={handleRefresh}
      refreshing={loading}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ padding: 16 }}
      ListFooterComponent={
        hasMore && !loading ? <ActivityIndicator color="#2563eb" /> : null
      }
    />
  )
}
```

---

## 🔒 Seguridad

- ✅ CORS habilitado para requests desde apps móviles
- ✅ Sin autenticación requerida (API pública de lectura)
- ✅ Rate limiting recomendado en producción

---

## 📝 Notas Importantes

1. **URLs de imágenes:** Todas las URLs son absolutas y apuntan a Supabase Storage
2. **Enlaces web:** El campo `web_url` abre el producto directamente en el navegador
3. **Precios:** Siempre en céntimos (`cents`) y con formato legible (`formatted`)
4. **Stock:** 
   - `available: true` = Hay stock
   - `is_backorder: true` = Sin stock pero se puede pedir
5. **Paginación:** Usar `offset` y `limit` para cargar más productos

---

## 🐛 Troubleshooting

**Error: "Error al obtener productos"**
- Verificar conexión a internet
- Verificar que la URL base sea correcta

**Imágenes no cargan**
- Verificar que las URLs de Supabase Storage sean públicas
- Comprobar políticas RLS de `product_images` y `variant_images`

**Productos sin imagen**
- El campo `image` puede ser `null` si no tiene imágenes
- Usar placeholder en la app: `https://via.placeholder.com/300`
