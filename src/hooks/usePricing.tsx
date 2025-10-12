'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface PricingContextType {
  showWithVAT: boolean
  toggleVAT: () => void
  calculatePrice: (basePrice: number, userRole?: string) => {
    displayPrice: number
    originalPrice: number
    discount: number
    showDiscount: boolean
  }
  formatPrice: (price: number) => string
  getVATAmount: (price: number) => number
}

const PricingContext = createContext<PricingContextType | undefined>(undefined)

// Configuración de descuentos por rol
const ROLE_DISCOUNTS: Record<string, number> = {
  'instalador': 15, // 15% descuento
  'distribuidor': 25, // 25% descuento
  'mayorista': 35, // 35% descuento
  'cliente': 0, // Sin descuento
  'admin': 0 // Sin descuento
}

const VAT_RATE = 0.21 // 21% IVA España

export function PricingProvider({ children }: { children: ReactNode }) {
  const [showWithVAT, setShowWithVAT] = useState(true)
  const { user } = useAuth()

  // Persistir preferencia de IVA en localStorage
  useEffect(() => {
    const savedVATPreference = localStorage.getItem('showWithVAT')
    if (savedVATPreference !== null) {
      setShowWithVAT(JSON.parse(savedVATPreference))
    }
  }, [])

  const toggleVAT = () => {
    const newValue = !showWithVAT
    setShowWithVAT(newValue)
    localStorage.setItem('showWithVAT', JSON.stringify(newValue))
  }

  const calculatePrice = (basePrice: number, userRole?: string) => {
    // Determinar el rol del usuario
    const currentRole = userRole || user?.client?.customer_role?.name || 'cliente'
    
    // Obtener descuento por rol
    const discountPercentage = ROLE_DISCOUNTS[currentRole] || 0
    
    // Calcular precio con descuento (precio base sin IVA)
    const discountedPrice = basePrice * (1 - discountPercentage / 100)
    
    // Calcular precio con IVA
    const priceWithVAT = discountedPrice * (1 + VAT_RATE)
    
    // Precio a mostrar según preferencia
    const displayPrice = showWithVAT ? priceWithVAT : discountedPrice
    
    return {
      displayPrice: Math.round(displayPrice * 100) / 100,
      originalPrice: showWithVAT ? basePrice * (1 + VAT_RATE) : basePrice,
      discount: discountPercentage,
      showDiscount: discountPercentage > 0
    }
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const getVATAmount = (priceWithoutVAT: number): number => {
    return Math.round(priceWithoutVAT * VAT_RATE * 100) / 100
  }

  return (
    <PricingContext.Provider
      value={{
        showWithVAT,
        toggleVAT,
        calculatePrice,
        formatPrice,
        getVATAmount
      }}
    >
      {children}
    </PricingContext.Provider>
  )
}

export function usePricing() {
  const context = useContext(PricingContext)
  if (context === undefined) {
    throw new Error('usePricing must be used within a PricingProvider')
  }
  return context
}