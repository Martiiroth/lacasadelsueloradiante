'use client'

import dynamic from 'next/dynamic'

// Lazy load componentes no críticos para mejorar el renderizado inicial
const WhatsAppButton = dynamic(() => import('../ui/WhatsAppButton'), {
  ssr: false,
})

const NetworkErrorHandler = dynamic(() => import('../NetworkErrorHandler'), {
  ssr: false,
})

export default function NonCriticalComponents() {
  return (
    <>
      <WhatsAppButton />
      <NetworkErrorHandler />
    </>
  )
}

