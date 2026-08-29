import { create } from 'zustand'

interface OnboardingState {
  photos: (string | null)[]
  bio: string
  occupation: string
  city: string
  district: string
  setPhotos: (photos: (string | null)[]) => void
  setBio: (bio: string) => void
  setOccupation: (occupation: string) => void
  setLocation: (city: string, district: string) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  photos: [null, null, null, null, null, null],
  bio: '',
  occupation: '',
  city: '',
  district: '',
  setPhotos: (photos) => set({ photos }),
  setBio: (bio) => set({ bio }),
  setOccupation: (occupation) => set({ occupation }),
  setLocation: (city, district) => set({ city, district }),
  reset: () => set({ photos: [null, null, null, null, null, null], bio: '', occupation: '', city: '', district: '' })
}))
