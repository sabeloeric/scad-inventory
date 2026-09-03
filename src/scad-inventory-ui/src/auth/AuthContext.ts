import { createContext, useContext } from 'react'
import type { LoginResponse } from '../api/auth'

export type AuthSession = LoginResponse

export interface AuthContextValue {
  session: AuthSession | null
  saveSession: (session: AuthSession) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) throw new Error('useAuth must be used inside AuthProvider.')

  return context
}
