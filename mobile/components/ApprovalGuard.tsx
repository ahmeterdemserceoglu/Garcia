import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/auth'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width, height } = Dimensions.get('window')
const HAS_SEEN_APPROVAL_KEY = '@has_seen_approval'

interface ApprovalGuardProps {
  children: React.ReactNode
}

export function ApprovalGuard({ children }: ApprovalGuardProps) {
  const { user, loadSession } = useAuthStore()
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null)

  useEffect(() => {
    // Sadece APPROVED olanlar için bu kontrolü yapıyoruz
    if (user?.approvalStatus === 'APPROVED' || !user?.approvalStatus) {
      AsyncStorage.getItem(HAS_SEEN_APPROVAL_KEY).then(val => {
        setHasSeenWelcome(val === 'true')
      })
    }

    let intervalId: ReturnType<typeof setInterval>
    // Kullanıcı PENDING ise her 5 saniyede bir sunucudan son durumu kontrol et
    if (user?.approvalStatus === 'PENDING') {
      intervalId = setInterval(() => {
        loadSession()
      }, 5000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [user?.approvalStatus, loadSession])

  const handleContinue = async () => {
    await AsyncStorage.setItem(HAS_SEEN_APPROVAL_KEY, 'true')
    setHasSeenWelcome(true)
  }

  

  // Eğer durum PENDING veya REJECTED ise (eski mantık çalışır)
  if (user?.approvalStatus === 'PENDING' || user?.approvalStatus === 'REJECTED') {
    const isRejected = user.approvalStatus === 'REJECTED'

    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, '#1A0D15', Colors.background]} style={StyleSheet.absoluteFill} />
        
        <View style={styles.textureContainer}>
          <Ionicons name="sparkles" size={200} color={Colors.primary} style={{ opacity: 0.03, position: 'absolute', top: 100, right: -50 }} />
          <Ionicons name="heart" size={150} color={Colors.secondary} style={{ opacity: 0.03, position: 'absolute', bottom: 150, left: -40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={isRejected ? [Colors.error, '#B92B27'] : [Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons 
                name={isRejected ? 'close-circle' : 'time'} 
                size={48} 
                color="#fff" 
              />
            </LinearGradient>
          </View>

          <Text style={styles.title}>
            {isRejected ? 'Başvurunuz Reddedildi' : 'Hesabınız İncelemede'}
          </Text>
          
          <Text style={styles.description}>
            {isRejected 
              ? 'Üzgünüz, profiliniz Garcia standartlarına uymadığı için reddedildi. Daha fazla bilgi için destek ile iletişime geçebilirsiniz.'
              : 'Topluluğumuzun kalitesini ve güvenliğini korumak için tüm yeni kayıtları manuel olarak inceliyoruz. Onaylandığınızda Garcia dünyasını keşfetmeye başlayabilirsiniz.'}
          </Text>

          {!isRejected && (
            <View style={styles.statusBox}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>Onay Bekleniyor...</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  // Eğer kullanıcı onaylanmışsa ama karşılama ekranını görmediyse:
  if (hasSeenWelcome === false) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, '#1A0D15', Colors.background]} style={StyleSheet.absoluteFill} />
        
        <View style={styles.textureContainer}>
          <Ionicons name="star" size={200} color={Colors.like} style={{ opacity: 0.05, position: 'absolute', top: 80, left: -40 }} />
          <Ionicons name="heart" size={150} color={Colors.primary} style={{ opacity: 0.05, position: 'absolute', bottom: 150, right: -40 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconWrapper, { shadowColor: Colors.like }]}>
            <LinearGradient
              colors={[Colors.like, '#2EB5AC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name="checkmark-circle" size={56} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Hesabınız Onaylandı!</Text>
          
          <Text style={styles.description}>
            Harika haber! Profilin Garcia standartlarına uygun bulundu. Artık uygulamadaki herkesle eşleşebilir, etkinliklere katılabilir ve yeni insanlarla tanışabilirsin.
          </Text>

          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.continueGrad}>
              <Text style={styles.continueText}>Uygulamaya Git</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // AsyncStorage henüz yüklenmediyse bekle
  if (hasSeenWelcome === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  // Kullanıcı APPROVED ve hoşgeldin mesajını daha önce görmüş
  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  textureContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
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
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.warning,
    marginRight: Spacing.sm,
    ...Shadows.glow,
  },
  statusText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
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
