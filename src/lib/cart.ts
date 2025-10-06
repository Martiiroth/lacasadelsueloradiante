/**
 * CartService - Servicio de carrito de compras
 * 
 * ✅ COMPATIBLE CON ARQUITECTURA SUPABASE SSR
 * Cliente browser a través de lib/supabase.ts (wrapper compatible)
 */

import { supabase } from './supabase'
import type { Cart, CartItem, AddToCartData, UpdateCartItemData, CartLog } from '../types/cart'

export class CartService {
  // Obtener o crear carrito para un cliente
  static async getOrCreateCart(clientId: string): Promise<Cart | null> {
    try {
      console.log('🛒 CartService.getOrCreateCart for clientId:', clientId)
      
      // Primero intentar obtener carrito existente
      let { data: cart, error } = await supabase
        .from('carts')
        .select('*')
        .eq('client_id', clientId)
        .single()

      console.log('🔍 Existing cart check:', { cart, error })

      // Si no existe, crear uno nuevo
      if (error && error.code === 'PGRST116') {
        console.log('🆕 Creating new cart for client:', clientId)
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            client_id: clientId,
            currency: 'EUR'
          })
          .select()
          .single()

        console.log('💾 New cart result:', { newCart, createError })

        if (createError) {
          console.error('❌ Error creating cart:', createError)
          return null
        }

        cart = newCart
      } else if (error) {
        console.error('❌ Error fetching cart:', error)
        return null
      }

      console.log('✅ Final cart:', cart)
      return cart
    } catch (error) {
      console.error('❌ Error in getOrCreateCart:', error)
      return null
    }
  }

  // Obtener items del carrito con información de productos
  static async getCartItems(cartId: string): Promise<CartItem[]> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          variant:product_variants (
            id,
            title,
            sku,
            price_public_cents,
            stock,
            product:products (
              id,
              title,
              slug,
              product_images!product_images_product_id_fkey (
                url,
                alt,
                position
              )
            )
          )
        `)
        .eq('cart_id', cartId)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching cart items:', error)
        return []
      }

      // Transformar datos para incluir la primera imagen
      return (data || []).map((item: any) => ({
        ...item,
        variant: {
          ...item.variant,
          product: {
            ...item.variant.product,
            image: item.variant.product.product_images?.[0]
          }
        }
      }))
    } catch (error) {
      console.error('Error in getCartItems:', error)
      return []
    }
  }

  // Añadir producto al carrito
  static async addToCart(cartId: string, data: AddToCartData): Promise<CartItem | null> {
    try {
      console.log('🛒 CartService.addToCart:', { cartId, data })
      
      // VALIDAR STOCK DISPONIBLE ANTES DE AGREGAR
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('stock, title, sku')
        .eq('id', data.variant_id)
        .single()

      if (variantError || !variantData) {
        console.error('❌ Error al obtener variante:', variantError)
        throw new Error('No se pudo verificar el stock del producto')
      }

      console.log('📦 Stock disponible:', { 
        variant: variantData.title || variantData.sku, 
        stock: variantData.stock, 
        requested: data.qty 
      })
      
      // Verificar si el item ya existe en el carrito
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('variant_id', data.variant_id)
        .single()

      console.log('🔍 Existing item check:', { existingItem, checkError })

      if (existingItem) {
        // Si existe, validar que la cantidad total no exceda el stock
        const newTotalQty = existingItem.qty + data.qty
        
        if (newTotalQty > variantData.stock) {
          const available = variantData.stock - existingItem.qty
          console.error('❌ Stock insuficiente:', {
            currentInCart: existingItem.qty,
            requested: data.qty,
            available: variantData.stock,
            wouldExceed: newTotalQty
          })
          throw new Error(
            `Stock insuficiente. Ya tienes ${existingItem.qty} en el carrito. ` +
            `Solo puedes agregar ${available} más. Stock disponible: ${variantData.stock}`
          )
        }
        
        // Si existe, actualizar cantidad
        console.log('📝 Updating existing item')
        return await this.updateCartItem(existingItem.id, {
          qty: newTotalQty
        })
      }

      // Validar stock para nuevo item
      if (data.qty > variantData.stock) {
        console.error('❌ Stock insuficiente para nuevo item:', {
          requested: data.qty,
          available: variantData.stock
        })
        throw new Error(
          `Stock insuficiente. Solicitado: ${data.qty}, Disponible: ${variantData.stock}`
        )
      }

      // Si no existe, crear nuevo item
      console.log('🆕 Creating new cart item')
      const { data: newItem, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          variant_id: data.variant_id,
          qty: data.qty,
          price_at_addition_cents: data.price_cents
        })
        .select()
        .single()

      console.log('💾 Insert result:', { newItem, error })

      if (error) {
        console.error('❌ Error adding to cart:', error)
        return null
      }

      // Actualizar timestamp del carrito
      await this.updateCartTimestamp(cartId)

      // Log de la acción - simplificado por ahora
      await this.logCartAction(cartId, 'add_item', {
        variant_id: data.variant_id,
        qty: data.qty,
        price_cents: data.price_cents
      })

      return newItem
    } catch (error) {
      console.error('Error in addToCart:', error)
      // Re-lanzar el error para que el componente pueda mostrarlo
      throw error
    }
  }

  // Actualizar cantidad de un item del carrito
  static async updateCartItem(itemId: string, data: UpdateCartItemData): Promise<CartItem | null> {
    try {
      // Obtener el item actual para saber qué variante es
      const { data: currentItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('variant_id, qty')
        .eq('id', itemId)
        .single()

      if (fetchError || !currentItem) {
        console.error('❌ Error al obtener item del carrito:', fetchError)
        throw new Error('No se pudo obtener el item del carrito')
      }

      // Validar stock disponible antes de actualizar
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('stock, title, sku')
        .eq('id', currentItem.variant_id)
        .single()

      if (variantError || !variantData) {
        console.error('❌ Error al obtener variante:', variantError)
        throw new Error('No se pudo verificar el stock del producto')
      }

      console.log('📦 Validando actualización de cantidad:', {
        variant: variantData.title || variantData.sku,
        currentQty: currentItem.qty,
        newQty: data.qty,
        stock: variantData.stock
      })

      // Validar que la nueva cantidad no exceda el stock
      if (data.qty > variantData.stock) {
        console.error('❌ Stock insuficiente para actualización:', {
          requested: data.qty,
          available: variantData.stock
        })
        throw new Error(
          `Stock insuficiente. Solicitado: ${data.qty}, Disponible: ${variantData.stock}`
        )
      }

      const { data: updatedItem, error } = await supabase
        .from('cart_items')
        .update({ qty: data.qty })
        .eq('id', itemId)
        .select()
        .single()

      if (error) {
        console.error('Error updating cart item:', error)
        return null
      }

      // Actualizar timestamp del carrito
      if (updatedItem) {
        await this.updateCartTimestamp(updatedItem.cart_id)
        
        // Log de la acción
        await this.logCartAction(updatedItem.cart_id, 'update_item', {
          item_id: itemId,
          new_qty: data.qty
        })
      }

      return updatedItem
    } catch (error) {
      console.error('Error in updateCartItem:', error)
      // Re-lanzar el error para que el componente pueda mostrarlo
      throw error
    }
  }

  // Remover item del carrito
  static async removeFromCart(itemId: string): Promise<boolean> {
    try {
      // Obtener información del item antes de eliminarlo
      const { data: item } = await supabase
        .from('cart_items')
        .select('cart_id, variant_id, qty')
        .eq('id', itemId)
        .single()

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('Error removing from cart:', error)
        return false
      }

      if (item) {
        // Actualizar timestamp del carrito
        await this.updateCartTimestamp(item.cart_id)
        
        // Log de la acción
        await this.logCartAction(item.cart_id, 'remove_item', {
          item_id: itemId,
          variant_id: item.variant_id,
          qty: item.qty
        })
      }

      return true
    } catch (error) {
      console.error('Error in removeFromCart:', error)
      return false
    }
  }

  // Limpiar carrito completamente
  static async clearCart(cartId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)

      if (error) {
        console.error('Error clearing cart:', error)
        return false
      }

      // Actualizar timestamp del carrito
      await this.updateCartTimestamp(cartId)
      
      // Log de la acción
      await this.logCartAction(cartId, 'clear_cart', {})

      return true
    } catch (error) {
      console.error('Error in clearCart:', error)
      return false
    }
  }

  // Actualizar timestamp del carrito
  private static async updateCartTimestamp(cartId: string): Promise<void> {
    await supabase
      .from('carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cartId)
  }

  // Log de acciones del carrito
  private static async logCartAction(
    cartId: string, 
    action: string, 
    details: any, 
    performedBy?: string
  ): Promise<void> {
    try {
      const logData: any = {
        cart_id: cartId,
        action,
        details
      }
      
      if (performedBy) {
        logData.performed_by = performedBy
      }

      await supabase
        .from('cart_logs')
        .insert(logData)
    } catch (error) {
      console.error('Error logging cart action:', error)
    }
  }

  // Obtener logs del carrito (para debugging/admin)
  static async getCartLogs(cartId: string): Promise<CartLog[]> {
    try {
      const { data, error } = await supabase
        .from('cart_logs')
        .select('*')
        .eq('cart_id', cartId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching cart logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getCartLogs:', error)
      return []
    }
  }
}