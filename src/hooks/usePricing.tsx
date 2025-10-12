'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface PricingContextType {
  showWithVAT: boolean
  toggleVAT: () => void
  calculatePrice: (publicPriceCents: number, rolePriceCents?: number) => {
    displayPrice: number
    originalPrice: number
    discount: number
    showDiscount: boolean
  }
  formatPrice: (price: number) => string
  getVATAmount: (price: number) => number
}

const PricingContext = createContext<PricingContextType | undefined>(undefined)

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

  const calculatePrice = (publicPriceCents: number, rolePriceCents?: number) => {
    // Convertir céntimos a euros
    const publicPriceEuros = publicPriceCents / 100
    const rolePriceEuros = rolePriceCents ? rolePriceCents / 100 : publicPriceEuros
    
    // Determinar si hay descuento por rol
    const hasRoleDiscount = rolePriceCents && rolePriceCents < publicPriceCents
    const discountPercentage = hasRoleDiscount 
      ? Math.round(((publicPriceCents - rolePriceCents) / publicPriceCents) * 100)
      : 0
    
    // Los precios en BD ya incluyen IVA
    // Precio base con IVA será el precio de rol si existe, sino el precio público
    const basePriceWithVAT = rolePriceEuros
    
    // Calcular precio sin IVA (quitando el 21%)
    const basePriceWithoutVAT = basePriceWithVAT / (1 + VAT_RATE)
    
    // Precio a mostrar según preferencia
    const displayPrice = showWithVAT ? basePriceWithVAT : basePriceWithoutVAT
    
    // Precio original (sin descuento) - también incluye IVA en BD
    const originalPriceWithVAT = publicPriceEuros
    const originalPriceWithoutVAT = originalPriceWithVAT / (1 + VAT_RATE)
    const originalPrice = showWithVAT ? originalPriceWithVAT : originalPriceWithoutVAT
    
    return {
      displayPrice: Math.round(displayPrice * 100) / 100,
      originalPrice: Math.round(originalPrice * 100) / 100,
      discount: discountPercentage,
      showDiscount: hasRoleDiscount || false
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

  const getVATAmount = (priceWithVAT: number): number => {
    // Calcular el IVA contenido en un precio que ya incluye IVA
    const priceWithoutVAT = priceWithVAT / (1 + VAT_RATE)
    const vatAmount = priceWithVAT - priceWithoutVAT
    return Math.round(vatAmount * 100) / 100
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