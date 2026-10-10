import { useContext } from 'react'
import { CustomerContext } from '../context/CustomerContext'
import { PlatformContext } from '../context/PlatformContext'

export function usePlatform() {
  const context = useContext(PlatformContext)
  if (!context) throw new Error('usePlatform must be used inside <PlatformProvider>.')
  return context
}

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomer must be used inside <CustomerProvider>.')
  return context
}
