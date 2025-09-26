import { ReactNode } from 'react'

interface AdminLayoutRootProps {
  children: ReactNode
}

export default function AdminLayoutRoot({ children }: AdminLayoutRootProps) {
  return children
}