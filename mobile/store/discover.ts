import { create } from 'zustand'
import { api } from '../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface DiscoverUser {
  id: string
  isFaceVerified: boolean
  profile: any
  photos: any[]
  isOnline?: boolean
}

interface DiscoverState {
  users: DiscoverUser[]
  passedIds: string[]
  currentIndex: number
  isLoading: boolean
  setCurrentIndex: (index: number) => void
  fetch: () => Promise<void>
  swipeRight: (userId: string, isSuperLike?: boolean, note?: string) => Promise<{ isMatch: boolean; match: any }>
  swipeLeft: () => void
  reset: () => void
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  users: [],
  passedIds: [],
  currentIndex: 0,
  isLoading: false,
  setCurrentIndex: (index) => set({ currentIndex: index }),

  fetch: async () => {
    set({ isLoading: true })
    try {
      // Load passed IDs from storage on first fetch if not loaded
      let currentPassed = get().passedIds
      if (currentPassed.length === 0) {
        const stored = await AsyncStorage.getItem('passedIds')
        if (stored) {
          currentPassed = JSON.parse(stored)
          set({ passedIds: currentPassed })
        }
      }

      const { data } = await api.getDiscover()
      
      // Filter out users we've already passed on
      const filteredUsers = data.users.filter((u: DiscoverUser) => !currentPassed.includes(u.id))
      set({ users: filteredUsers, currentIndex: 0 })
    } catch (error) {
      console.log('Failed to fetch discover data:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  swipeRight: async (userId, isSuperLike = false, note?: string) => {
    try {
      const { data } = await api.likeUser(userId, isSuperLike, note)
      set((s) => ({ currentIndex: s.currentIndex + 1 }))
      return { isMatch: data.isMatch, match: data.match }
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('LIMIT_REACHED')
      }
      // Even if failed for other reasons, just skip
      set((s) => ({ currentIndex: s.currentIndex + 1 }))
      return { isMatch: false, match: null }
    }
  },

  swipeLeft: async () => {
    const state = get()
    const userToPass = state.users[state.currentIndex]
    if (userToPass) {
      const newPassedIds = [...state.passedIds, userToPass.id]
      set({ passedIds: newPassedIds, currentIndex: state.currentIndex + 1 })
      await AsyncStorage.setItem('passedIds', JSON.stringify(newPassedIds))
    } else {
      set((s) => ({ currentIndex: s.currentIndex + 1 }))
    }
  },

  reset: () => set({ users: [], currentIndex: 0 }),
}))
