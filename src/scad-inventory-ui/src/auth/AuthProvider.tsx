import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext, type AuthSession } from './AuthContext'

const storageKey = 'scad-inventory-session'

function readSession(): AuthSession | null {
  const stored = window.localStorage.getItem(storageKey)

  if (!stored) return null

  try {
    const session = JSON.parse(stored) as Partial<AuthSession>

    if (!session.accessToken || !session.user?.username || !session.user.warehouseCode) {
      window.localStorage.removeItem(storageKey)
      return null
    }

    return session as AuthSession
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readSession)

  const saveSession = useCallback((nextSession: AuthSession) => {
    window.localStorage.setItem(storageKey, JSON.stringify(nextSession))
    setSession(nextSession)
  }, [])

  const signOut = useCallback(() => {
    window.localStorage.removeItem(storageKey)
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, saveSession, signOut }), [session, saveSession, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
