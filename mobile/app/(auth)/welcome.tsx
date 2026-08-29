import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Background */}
      <Image
        source={require('../../assets/welcome/welcome_bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* Dark overlay gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,12,0.6)', 'rgba(10,10,12,0.97)']}
        locations={[0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.primaryBtnText}>Başla</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Zaten hesabım var</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          Devam ederek{' '}
          <Text style={styles.termsLink}>Kullanım Koşulları</Text>
          {' '}ve{' '}
          <Text style={styles.termsLink}>Gizlilik Politikası</Text>
          {`'nı`} kabul ediyorsunuz.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoText: {
    fontSize: 56,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  buttons: {
    gap: Spacing.sm,
  },
  primaryBtn: {
    height: 56,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.md,
  },
  primaryBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.85)',
  },
  terms: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
})
