import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Match {
  id: string
  user1Id: string
  user2Id: string
  user1: any
  user2: any
  messages: any[]
  updatedAt: string
}

interface MatchesState {
  matches: Match[]
  setMatches: (matches: Match[]) => void
  removeMatch: (matchId: string) => void
}

export const useMatchesStore = create<MatchesState>()(
  persist(
    (set) => ({
      matches: [],
      setMatches: (matches) => set({ matches }),
      removeMatch: (matchId) => set((state) => ({
        matches: state.matches.filter((m) => m.id !== matchId)
      }))
    }),
    {
      name: 'matches-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
