import { Platform } from 'react-native'
import Purchases, { LOG_LEVEL, PurchasesStoreProduct, PurchasesPackage } from 'react-native-purchases'

// RevenueCat SDK keys — loaded from env, never hardcoded
// These are "publishable" keys (like Stripe pk_), safe for client bundles
// but must not be committed to source control directly
const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  google: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? ''
}

export const RevenueCatService = {
  async configure(userId?: string) {
    if (Platform.OS === 'web') return

    // RevenueCat configuration is temporarily disabled to prevent console spam
    // until the app backend and Play Console products are fully set up.
    Purchases.setLogLevel(LOG_LEVEL.WARN)
    
    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google
    
    if (userId) {
      Purchases.configure({ apiKey, appUserID: userId })
    } else {
      Purchases.configure({ apiKey })
    }
  },

  async getOfferings() {
    try {
      if (Platform.OS === 'web') return null
      const offerings = await Purchases.getOfferings()
      return offerings.current !== null ? offerings.current : null
    } catch (e: any) {
      // Silencing configuration errors because we're using a mock premium setup
      return null
    }
  },

  async purchasePackage(pack: PurchasesPackage) {
    try {
      if (Platform.OS === 'web') return false
      const { customerInfo } = await Purchases.purchasePackage(pack)
      // "premium" is the default identifier in RevenueCat for premium entitlement
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        return true
      }
      return false
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed', e)
      }
      return false
    }
  },

  async restorePurchases() {
    try {
      if (Platform.OS === 'web') return false
      const customerInfo = await Purchases.restorePurchases()
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        return true
      }
      return false
    } catch (e) {
      console.error('Restore failed', e)
      return false
    }
  }
}
