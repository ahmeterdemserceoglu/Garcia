import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '../store/auth'
import { useChatStore } from '../store/chat'
import { usePurchasesStore } from '../store/usePurchasesStore'
import { Colors } from '../constants/Colors'
import Purchases from 'react-native-purchases'
import { GlobalAlert } from '../components/GlobalAlert'
import { usePushNotifications } from '../hooks/usePushNotifications'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 0 },
  },
})

SplashScreen.preventAutoHideAsync().catch(() => {})

function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  const player = useVideoPlayer(require('../assets/splash-video.mp4'), p => {
    p.loop = false
    p.muted = false
    p.play()
  })

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})

    const sub = player.addListener('playToEnd', () => {
      onFinish()
    })

    // Failsafe: if video takes too long, dismiss after 5s
    const timer = setTimeout(onFinish, 5000)

    return () => {
      sub.remove()
      clearTimeout(timer)
    }
  }, [])

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999, backgroundColor: Colors.background }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  )
}

import { ErrorBoundary } from '../components/ErrorBoundary'

export default function RootLayout() {

  const [isSplashFinished, setIsSplashFinished] = useState(false)
  const { loadSession, isAuthenticated, user } = useAuthStore()
  const { connectSocket, disconnectSocket } = useChatStore()
  const { initialize: initPurchases } = usePurchasesStore()

  // Register FCM push token when user is authenticated
  usePushNotifications(isAuthenticated)

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.approvalStatus === 'APPROVED') {
      connectSocket()
    } else {
      disconnectSocket()
    }
  }, [isAuthenticated, user?.approvalStatus])

  useEffect(() => {
    if (user?.id) {
      initPurchases(user.id)
      
      const listener = (customerInfo: any) => {
        const hasPremium = typeof customerInfo.entitlements.active['premium'] !== 'undefined'
        usePurchasesStore.setState({ isPremium: hasPremium })
      }
      
      Purchases.addCustomerInfoUpdateListener(listener)
      return () => { Purchases.removeCustomerInfoUpdateListener(listener) }
    } else {
      initPurchases()
    }
  }, [user?.id])

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" backgroundColor={Colors.background} />
            
            {/* Stack MUST always be rendered to avoid Expo Router infinite reload bugs */}
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="visitors" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="daily-checkin" options={{ headerShown: false, animation: 'slide_from_right' }} />
            </Stack>

            {/* Overlay Splash Screen */}
            {!isSplashFinished && (
              <SplashOverlay onFinish={() => setIsSplashFinished(true)} />
            )}

            <GlobalAlert />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
