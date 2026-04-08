import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import type { Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  organization_id: string
  role: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    const { data } = await supabase.auth.getSession()
    set({ session: data.session })

    if (data.session) {
      try {
        const { data: profile } = await api.get<{ data: Profile }>('/api/profile')
        set({ profile: profile as any })
      } catch {}
    }

    set({ isLoading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
      if (!session) set({ profile: null })
    })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ session: data.session })

    try {
      const { data: profile } = await api.get<{ data: Profile }>('/api/profile')
      set({ profile: profile as any })
    } catch {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },
}))
