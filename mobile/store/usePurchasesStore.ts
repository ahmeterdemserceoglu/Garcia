import { create } from 'zustand'
import { PurchasesPackage } from 'react-native-purchases'
import { RevenueCatService } from '../lib/revenuecat'

interface PurchasesState {
  isPremium: boolean
  offerings: PurchasesPackage[]
  isLoading: boolean
  
  initialize: (userId?: string) => Promise<void>
  purchasePackage: (pack: PurchasesPackage) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
}

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  isPremium: false,
  offerings: [],
  isLoading: true,

  initialize: async (userId?: string) => {
    set({ isLoading: true })
    await RevenueCatService.configure(userId)
    
    const offeringsData = await RevenueCatService.getOfferings()
    let packages: PurchasesPackage[] = []
    
    if (offeringsData && offeringsData.availablePackages) {
      packages = offeringsData.availablePackages
    }
    
    // In a real app we'd also check customerInfo initially to set isPremium
    // but RevenueCatService.configure doesn't return customerInfo directly.
    // Usually you add a listener or call Purchases.getCustomerInfo()
    
    set({ offerings: packages, isLoading: false })
  },

  purchasePackage: async (pack: PurchasesPackage) => {
    set({ isLoading: true })
    const success = await RevenueCatService.purchasePackage(pack)
    if (success) {
      set({ isPremium: true, isLoading: false })
      return true
    }
    set({ isLoading: false })
    return false
  },

  restorePurchases: async () => {
    set({ isLoading: true })
    const success = await RevenueCatService.restorePurchases()
    if (success) {
      set({ isPremium: true, isLoading: false })
      return true
    }
    set({ isLoading: false })
    return false
  }
}))
