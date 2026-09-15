'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => remove(id), 4500)
  }, [remove])

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 fade-in duration-200 ${
              t.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : t.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : t.type === 'error' ? (
              <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            ) : (
              <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            )}
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useAdminToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback si se usa fuera del provider
    return {
      toast: (m: string) => window.alert(m),
      success: (m: string) => window.alert(m),
      error: (m: string) => window.alert(m),
    }
  }
  return ctx
}
