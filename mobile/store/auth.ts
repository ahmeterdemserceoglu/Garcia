import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../api/client'

interface User {
  id: string
  email: string
  name: string
  isFaceVerified: boolean
  isEmailVerified?: boolean
  isPremium: boolean
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  profile?: any
  photos?: any[]
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, deviceId?: string, deviceName?: string) => Promise<void>
  register: (data: { email: string; password: string; name: string; birthDate: string; gender: string }) => Promise<void>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  loadSession: async () => {
    try {
      const [token, userJson] = await AsyncStorage.multiGet(['accessToken', 'user'])
      const accessToken = token[1]
      const user = userJson[1] ? JSON.parse(userJson[1]) : null
      if (accessToken && user) {
        set({ accessToken, user, isAuthenticated: true })
        // Refresh user data in background
        api.me().then(({ data }) => {
          set({ user: data.user })
          const userToSave = { ...data.user }
          delete userToSave.photos
          AsyncStorage.setItem('user', JSON.stringify(userToSave))
        }).catch(() => {})
      }
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (email, password, deviceId, deviceName) => {
    const { data } = await api.login({ email, password, deviceId, deviceName })
    const userToSave = { ...data.user }
    delete userToSave.photos
    await AsyncStorage.multiSet([
      ['accessToken', data.accessToken],
      ['refreshToken', data.refreshToken],
      ['user', JSON.stringify(userToSave)],
    ])
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true })
    get().loadSession()
  },

  register: async (payload) => {
    const { data } = await api.register(payload)
    const userToSave = { ...data.user }
    delete userToSave.photos
    await AsyncStorage.multiSet([
      ['accessToken', data.accessToken],
      ['refreshToken', data.refreshToken],
      ['user', JSON.stringify(userToSave)],
    ])
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true })
    get().loadSession()
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user'])
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  updateUser: (data) => {
    const updated = { ...get().user, ...data } as User
    set({ user: updated })
    const userToSave = { ...updated }
    delete userToSave.photos
    AsyncStorage.setItem('user', JSON.stringify(userToSave))
  },
}))
