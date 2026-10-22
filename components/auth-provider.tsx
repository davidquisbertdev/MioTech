'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Membership, Store } from '@/lib/types'

type AuthCtx = {
  session: Session | null
  loading: boolean
  fullName: string
  memberships: Membership[]
  store: Store | null
  isAdmin: boolean
  usable: boolean
  setStoreId: (id: string) => void
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [fullName, setFullName] = useState('')
  const [storeId, setStoreIdState] = useState<string | null>(null)
  const userId = session?.user.id

  useEffect(() => {
    setStoreIdState(localStorage.getItem('mio.store'))
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) {
        setMemberships([])
        setLoading(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('store_members')
      .select('store_id, role, active, stores(id, name, status, paused_reason, subscription_expires_at)')
      .eq('user_id', userId)
    const list = ((data ?? []) as any[]).filter((m) => m.active && m.stores) as Membership[]
    setMemberships(list)
    const { data: p } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle()
    setFullName(p?.full_name ?? '')
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) refresh()
  }, [userId, refresh])

  const current = memberships.find((m) => m.store_id === storeId) ?? memberships[0] ?? null
  const store = current?.stores ?? null
  const usable = !!store && store.status === 'active' &&
    (!store.subscription_expires_at || new Date(store.subscription_expires_at) > new Date())

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      loading,
      fullName,
      memberships,
      store,
      isAdmin: current?.role === 'admin',
      usable,
      setStoreId: (id) => {
        localStorage.setItem('mio.store', id)
        setStoreIdState(id)
      },
      refresh,
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, loading, fullName, memberships, store, current, usable, refresh]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
