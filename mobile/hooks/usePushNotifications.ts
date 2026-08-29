import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { api } from '../api/client'

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted')
      return null
    }

    // Get the raw device push token (FCM for Android, APNs for iOS) for backend firebase-admin compatibility
    const tokenData = await Notifications.getDevicePushTokenAsync()
    
    const token = tokenData.data
    console.log('[Push] Raw device push token obtained:', token.substring(0, 30) + '...')
    return token
  } catch (err) {
    console.error('[Push] Failed to get push token:', err)
    return null
  }
}

export async function savePushTokenToBackend(token: string): Promise<void> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android'
    await api.registerPushToken(token, platform)
    console.log('[Push] Token registered with backend')
  } catch (err: any) {
    console.log('[Push] Notice: Token registration deferred/skipped (auth pending or not logged in)')
  }
}

export function usePushNotifications(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return

    let subscriptionReceived: ReturnType<typeof Notifications.addNotificationReceivedListener>
    let subscriptionResponse: ReturnType<typeof Notifications.addNotificationResponseReceivedListener>

    // Register and save token
    registerForPushNotifications().then(token => {
      if (token) savePushTokenToBackend(token)
    })

    // Listen for incoming notifications (app in foreground)
    subscriptionReceived = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Notification received:', notification.request.content.title)
    })

    // Listen for notification taps
    subscriptionResponse = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any
      console.log('[Push] Notification tapped, type:', data?.type)
    })

    return () => {
      subscriptionReceived?.remove()
      subscriptionResponse?.remove()
    }
  }, [isAuthenticated])
}
