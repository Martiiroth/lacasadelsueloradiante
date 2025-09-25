'use client'

import { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import CartDrawer from './CartDrawer'

interface CartIconProps {
  className?: string
}

export default function CartIcon({ className = '' }: CartIconProps) {
  const { getTotalItems } = useCart()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const totalItems = getTotalItems()

  const handleCartClick = () => {
    setIsDrawerOpen(true)
  }

  return (
    <>
      <button
        onClick={handleCartClick}
        className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        aria-label="Abrir carrito"
        title="Ver carrito"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h-.9m15.4 0v0a1 1 0 01-1 1H9m8-1a1 1 0 01-1 1m1-1h.01M19 19a2 2 0 11-4 0 2 2 0 014 0zM9 19a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        
        {/* Contador de items */}
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      <CartDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  )
}