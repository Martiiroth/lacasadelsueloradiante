'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CartService } from '../lib/cart'
import { useAuth } from './AuthContext'
import { useHydration } from '../hooks/useHydration'
import type { Cart, CartItem, AddToCartData, UpdateCartItemData, CartContextType } from '../types/cart'

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const { user } = useAuth()
  const isHydrated = useHydration()
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inicializar carrito - solo después de hidratación
  useEffect(() => {
    if (!isHydrated) return
    
    if (user?.client?.id) {
      initializeCart()
    } else {
      // Cargar carrito desde localStorage para usuarios no autenticados
      loadLocalCart()
    }
  }, [isHydrated, user?.client?.id])

  // Cargar carrito desde localStorage
  const loadLocalCart = () => {
    try {
      const localCartItems = localStorage.getItem('cart_items')
      if (localCartItems) {
        const items = JSON.parse(localCartItems) as CartItem[]
        setCartItems(items)
        
        // Crear un carrito temporal para usuarios no autenticados
        const tempCart: Cart = {
          id: 'local_cart',
          client_id: 'anonymous',
          currency: 'EUR',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: items
        }
        setCart(tempCart)
      }
    } catch (error) {
      console.error('Error loading local cart:', error)
    }
  }

  // Guardar carrito en localStorage
  const saveLocalCart = (items: CartItem[]) => {
    try {
      localStorage.setItem('cart_items', JSON.stringify(items))
    } catch (error) {
      console.error('Error saving local cart:', error)
    }
  }

  const initializeCart = async () => {
    if (!user?.client?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const userCart = await CartService.getOrCreateCart(user.client.id)
      if (userCart) {
        setCart(userCart)
        const items = await CartService.getCartItems(userCart.id)
        setCartItems(items)
      }
    } catch (err) {
      console.error('Error initializing cart:', err)
      setError('Error al cargar el carrito')
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (data: AddToCartData): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      if (user?.client?.id && cart && cart.id !== 'local_cart') {
        // Usuario autenticado - usar base de datos
        const newItem = await CartService.addToCart(cart.id, data)
        if (newItem) {
          const updatedItems = await CartService.getCartItems(cart.id)
          setCartItems(updatedItems)
          console.log('✅ Producto añadido al carrito (BD)')
          return true
        } else {
          setError('Error al añadir producto al carrito')
          return false
        }
      } else {
        // Usuario no autenticado - usar localStorage
        const newItem: CartItem = {
          id: `local_${Date.now()}_${data.variant_id}`,
          cart_id: 'local_cart',
          variant_id: data.variant_id,
          qty: data.qty,
          price_at_addition_cents: data.price_cents,
          added_at: new Date().toISOString()
        }

        // Verificar si el item ya existe
        const existingItemIndex = cartItems.findIndex(item => item.variant_id === data.variant_id)
        let updatedItems: CartItem[]

        if (existingItemIndex >= 0) {
          // Actualizar cantidad
          updatedItems = cartItems.map((item, index) => 
            index === existingItemIndex 
              ? { ...item, qty: item.qty + data.qty }
              : item
          )
        } else {
          // Añadir nuevo item
          updatedItems = [...cartItems, newItem]
        }

        setCartItems(updatedItems)
        saveLocalCart(updatedItems)
        console.log('✅ Producto añadido al carrito (Local)')
        return true
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      setError('Error al añadir producto al carrito')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateCartItem = async (itemId: string, data: UpdateCartItemData): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      if (user?.client?.id && cart && cart.id !== 'local_cart') {
        // Usuario autenticado - usar base de datos
        const updatedItem = await CartService.updateCartItem(itemId, data)
        if (updatedItem) {
          setCartItems(prev => 
            prev.map(item => 
              item.id === itemId ? { ...item, qty: data.qty } : item
            )
          )
          return true
        } else {
          setError('Error al actualizar producto')
          return false
        }
      } else {
        // Usuario no autenticado - usar localStorage
        const updatedItems = cartItems.map(item =>
          item.id === itemId ? { ...item, qty: data.qty } : item
        )
        setCartItems(updatedItems)
        saveLocalCart(updatedItems)
        console.log('✅ Producto actualizado (Local)')
        return true
      }
    } catch (err) {
      console.error('Error updating cart item:', err)
      setError('Error al actualizar producto')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (itemId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      if (user?.client?.id && cart && cart.id !== 'local_cart') {
        // Usuario autenticado - usar base de datos
        const success = await CartService.removeFromCart(itemId)
        if (success) {
          setCartItems(prev => prev.filter(item => item.id !== itemId))
          console.log('✅ Producto eliminado del carrito (BD)')
          return true
        } else {
          setError('Error al eliminar producto')
          return false
        }
      } else {
        // Usuario no autenticado - usar localStorage
        const updatedItems = cartItems.filter(item => item.id !== itemId)
        setCartItems(updatedItems)
        saveLocalCart(updatedItems)
        console.log('✅ Producto eliminado del carrito (Local)')
        return true
      }
    } catch (err) {
      console.error('Error removing from cart:', err)
      setError('Error al eliminar producto')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      if (user?.client?.id && cart && cart.id !== 'local_cart') {
        // Usuario autenticado - usar base de datos
        const success = await CartService.clearCart(cart.id)
        if (success) {
          setCartItems([])
          console.log('✅ Carrito vaciado (BD)')
          return true
        } else {
          setError('Error al vaciar carrito')
          return false
        }
      } else {
        // Usuario no autenticado - limpiar localStorage
        setCartItems([])
        localStorage.removeItem('cart_items')
        console.log('✅ Carrito vaciado (Local)')
        return true
      }
    } catch (err) {
      console.error('Error clearing cart:', err)
      setError('Error al vaciar carrito')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCart = async (): Promise<void> => {
    if (!cart) return

    setIsLoading(true)
    try {
      const items = await CartService.getCartItems(cart.id)
      setCartItems(items)
    } catch (err) {
      console.error('Error refreshing cart:', err)
      setError('Error al actualizar carrito')
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones de cálculo
  const getTotalItems = (): number => {
    return cartItems.reduce((total, item) => total + item.qty, 0)
  }

  const getTotalPrice = (): number => {
    return cartItems.reduce((total, item) => {
      // Convertir centavos a euros
      const priceInEuros = item.price_at_addition_cents / 100
      return total + (priceInEuros * item.qty)
    }, 0)
  }

  const getItemCount = (variantId: string): number => {
    const item = cartItems.find(item => item.variant_id === variantId)
    return item ? item.qty : 0
  }

  const value: CartContextType = {
    cart,
    cartItems,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    getTotalItems,
    getTotalPrice,
    getItemCount
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}