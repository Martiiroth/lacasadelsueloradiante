'use client'

import { useState } from 'react'
import { UserGroupIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline'
import type { VariantRolePrice } from '@/types/admin'

interface RolePriceManagerProps {
  rolePrices: VariantRolePrice[]
  publicPrice: number
  onChange: (rolePrices: VariantRolePrice[]) => void
}

const CUSTOMER_ROLES = [
  { name: 'guest' as const, label: 'Cliente General', description: 'Precio público para clientes sin descuentos especiales' },
  { name: 'instalador' as const, label: 'Instalador', description: 'Precio especial para instaladores profesionales' },
  { name: 'sat' as const, label: 'SAT', description: 'Precio para servicio de atención técnica' },
  { name: 'admin' as const, label: 'Administrador', description: 'Precio para administradores del sistema' }
]

export default function RolePriceManager({
  rolePrices,
  publicPrice,
  onChange
}: RolePriceManagerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handlePriceChange = (roleName: VariantRolePrice['role_name'], priceCents: number) => {
    const updatedPrices = rolePrices.filter(rp => rp.role_name !== roleName)
    
    // Solo añadir si el precio es diferente al público y mayor que 0
    if (priceCents > 0 && priceCents !== publicPrice) {
      updatedPrices.push({ role_name: roleName, price_cents: priceCents })
    }
    
    onChange(updatedPrices)
  }

  const getRolePrice = (roleName: VariantRolePrice['role_name']) => {
    const rolePrice = rolePrices.find(rp => rp.role_name === roleName)
    return rolePrice ? rolePrice.price_cents : publicPrice
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2)
  }

  const parsePrice = (value: string) => {
    return Math.round(parseFloat(value || '0') * 100)
  }

  const getDiscountPercentage = (roleName: VariantRolePrice['role_name']) => {
    const rolePrice = getRolePrice(roleName)
    if (rolePrice >= publicPrice) return 0
    return Math.round(((publicPrice - rolePrice) / publicPrice) * 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
          <h4 className="text-sm font-medium text-gray-900">Precios por Tipo de Cliente</h4>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          {showAdvanced ? 'Ocultar' : 'Configurar precios'}
        </button>
      </div>

      {showAdvanced && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Precio público:</strong> €{formatPrice(publicPrice)}</p>
            <p className="text-xs mt-1">Configura precios especiales para diferentes tipos de cliente. Si no se especifica, se usa el precio público.</p>
          </div>

          <div className="grid gap-4">
            {CUSTOMER_ROLES.map((role) => {
              const currentPrice = getRolePrice(role.name)
              const isCustomPrice = rolePrices.some(rp => rp.role_name === role.name)
              const discount = getDiscountPercentage(role.name)

              return (
                <div key={role.name} className="flex items-center space-x-4 p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="text-sm font-medium text-gray-900">{role.label}</h5>
                      {discount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formatPrice(currentPrice)}
                        onChange={(e) => handlePriceChange(role.name, parsePrice(e.target.value))}
                        className={`w-24 pl-8 pr-3 py-1 text-sm border rounded-md ${
                          isCustomPrice 
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-900' 
                            : 'border-gray-300 bg-gray-50 text-gray-700'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    
                    {isCustomPrice && (
                      <button
                        type="button"
                        onClick={() => handlePriceChange(role.name, publicPrice)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                        title="Usar precio público"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <UserGroupIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Precios por Tipo de Cliente
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Cliente General:</strong> Precio público estándar</li>
                    <li><strong>Instalador:</strong> Descuentos para profesionales</li>
                    <li><strong>SAT:</strong> Precios especiales para servicio técnico</li>
                    <li><strong>Administrador:</strong> Acceso a precios de coste</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de precios configurados */}
      {rolePrices.length > 0 && !showAdvanced && (
        <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
          <span className="font-medium">Precios especiales configurados:</span>
          {' '}
          {rolePrices.map((rp, index) => {
            const role = CUSTOMER_ROLES.find(r => r.name === rp.role_name)
            const discount = getDiscountPercentage(rp.role_name)
            return (
              <span key={rp.role_name}>
                {index > 0 && ', '}
                {role?.label} (€{formatPrice(rp.price_cents)}{discount > 0 && `, -${discount}%`})
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}