// Tipos para el sistema de carrito de compras
export interface Cart {
  id: string
  client_id: string
  currency: string
  created_at: string
  updated_at: string
  items?: CartItem[]
}

export interface CartItem {
  id: string
  cart_id: string
  variant_id: string
  qty: number
  price_at_addition_cents: number
  added_at: string
  // Datos enriquecidos del producto/variante
  variant?: {
    id: string
    title: string
    sku: string
    price_public_cents: number
    stock: number
    variant_images?: Array<{
      id: string
      url: string
      alt: string
      position: number
    }>
    product: {
      id: string
      title: string
      slug: string
      image?: {
        url: string
        alt: string
        position?: number
      }
    }
  }
}

export interface CartLog {
  id: string
  cart_id: string
  action: string
  details: any
  performed_by: string
  created_at: string
}

export interface AddToCartData {
  variant_id: string
  qty: number
  price_cents: number
}

export interface UpdateCartItemData {
  qty: number
}

export interface CartSummary {
  total_items: number
  total_cents: number
  currency: string
}

export interface CartContextType {
  cart: Cart | null
  cartItems: CartItem[]
  isLoading: boolean
  error: string | null
  
  // Acciones
  addToCart: (data: AddToCartData) => Promise<boolean>
  updateCartItem: (itemId: string, data: UpdateCartItemData) => Promise<boolean>
  removeFromCart: (itemId: string) => Promise<boolean>
  clearCart: () => Promise<boolean>
  refreshCart: () => Promise<void>
  
  // Información calculada
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: (variantId: string) => number
}