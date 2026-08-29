import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../store/auth'
import { Colors } from '../constants/Colors'

export default function Index() {
  const router = useRouter()
  const { isLoading, isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/(auth)/welcome')
    } else if (!user?.profile?.city) {
      router.replace('/(onboarding)/photos')
    } else {
      router.replace('/(tabs)/discover')
    }
  }, [isLoading, isAuthenticated, user])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  )
}
