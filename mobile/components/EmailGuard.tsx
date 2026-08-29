import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/auth'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'

import { router } from 'expo-router'

export function EmailGuard({ children }: { children: React.ReactNode }) {
  const { user, loadSession, logout } = useAuthStore()

// EMAIL VERIFICATION KONTROLÜ (Eğer e-posta doğrulanmadıysa)
  if (user && !user.isEmailVerified) {
    const handleResend = async () => {
      try {
        await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/resend-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        })
        alert('Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu (veya backend konsolunu) kontrol edin.')
      } catch (e) {
        alert('E-posta gönderilirken hata oluştu.')
      }
    }

    const handleCheck = async () => {
      await loadSession()
    }

    const handleLogout = async () => {
      await logout()
      router.replace('/(auth)/welcome')
    }

    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, '#1A0D15', Colors.background]} style={StyleSheet.absoluteFill} />
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={{ position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="rgba(255,255,255,0.7)" style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
              <Ionicons name="mail" size={48} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>E-posta Doğrulaması Gerekli</Text>
          <Text style={styles.description}>
            Hesabınızı güvene almak için e-posta adresinizi doğrulamanız gerekiyor. {user.email} adresine gönderilen linke tıklayın.
          </Text>
          
          <TouchableOpacity style={styles.continueBtn} onPress={handleCheck} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.continueGrad}>
              <Text style={styles.continueText}>Doğrulamayı Kontrol Et</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.continueBtn, { marginTop: Spacing.md }]} onPress={handleResend} activeOpacity={0.85}>
            <View style={[styles.continueGrad, { backgroundColor: 'rgba(232,82,106,0.1)', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(232,82,106,0.3)' }]}>
              <Text style={[styles.continueText, { color: Colors.primary }]}>Tekrar Gönder</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: Spacing.xl,
    ...Shadows.glow,
  },
  iconGradient: {
    flex: 1,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  continueBtn: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
    marginTop: Spacing.xl,
  },
  continueGrad: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  continueText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
})
