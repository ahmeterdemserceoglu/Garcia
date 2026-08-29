import { Stack } from 'expo-router'
import { EmailGuard } from '../../components/EmailGuard'

export default function OnboardingLayout() {
  return (
    <EmailGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </EmailGuard>
  )
}
