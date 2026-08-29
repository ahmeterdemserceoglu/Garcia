import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useAuthStore } from '../../store/auth'
import { useOnboardingStore } from '../../store/onboarding'
import { api } from '../../api/client'

const INTERESTS = [
  'Fotoğrafçılık', 'Seyahat', 'Müzik', 'Filmler', 'Oyun', 'Okuma', 'Fitness', 'Yemek Yapma',
  'Sanat', 'Spor', 'Dans', 'Teknoloji', 'Evcil Hayvanlar', 'Moda', 'Doğa', 'Gurme', 'Kahve', 'Şarap',
  'Yoga', 'Meditasyon', 'Bahçecilik', 'Yazılım', 'Girişimcilik', 'El Sanatları',
  'Felsefe', 'Tarih', 'Bilim', 'Astronomi', 'Doğa Yürüyüşü', 'Kamp', 'Yüzme',
  'Bisiklet', 'Koşu', 'Kayak', 'Dalış', 'Podcast', 'Stand-up', 'Tiyatro', 'Bale',
  'Resim', 'Heykel', 'Plak Koleksiyonu', 'Araba Tutkunu', 'Motosiklet', 'Balıkçılık',
  'Golf', 'Tenis', 'Basketbol', 'Futbol', 'Yatırım', 'Kripto Para', 'Şiir',
  'Gönüllülük', 'Sürdürülebilirlik', 'Astroloji'
]

export default function OnboardingInterestsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { updateUser } = useAuthStore()
  const { photos, bio, occupation, city, district, reset } = useOnboardingStore()
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      setSelected(selected.filter(i => i !== interest))
    } else {
      if (selected.length < 5) {
        setSelected([...selected, interest])
      }
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      // Sadece secili fotograflari gonder (null olmayanlar)
      const validPhotos = photos.filter(Boolean) as string[]
      const photoObjects = validPhotos.map(url => ({ url, status: 'approved' }))

      // Tum onboarding verisini API'ye gonder
      await api.updateProfile({ 
        interests: selected,
        bio,
        occupation,
        city,
        district,
        photos: photoObjects as any
      })
      
      // Local state'i guncelle ve ana ekrana gec
      updateUser({ 
        photos: validPhotos.map((url, i) => ({ id: `temp-${i}`, url, moderationStatus: 'approved' })),
        profile: { interests: selected, bio, city, district } 
      } as any)
      reset()
      router.replace('/(onboarding)/liveness')
    } catch (e: any) {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0F0D12', '#1A0D15', '#0F0D12']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>3 / 3</Text>
          </View>
        </View>

        <Text style={styles.title}>İlgi alanların</Text>
        <Text style={styles.subtitle}>Sevdiğin en fazla 5 şeyi seç. Bu sana daha iyi eşleşmeler bulmamıza yardımcı olur.</Text>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {INTERESTS.map((interest) => {
              const isSelected = selected.includes(interest)
              return (
                <TouchableOpacity
                  key={interest}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleInterest(interest)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={[Colors.primary, Colors.primaryDark]}
                      style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.full }]}
                    />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Text style={styles.counterText}>{selected.length} / 5 seçildi</Text>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueBtnText}>Kaydırmaya Başla ✨</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.xl, marginBottom: Spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  stepIndicator: { backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  stepText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  title: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.8, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  scroll: { paddingBottom: Spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden' },
  chipSelected: { borderColor: Colors.primary, ...Shadows.sm },
  chipText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextSelected: { color: '#fff', fontWeight: FontWeight.bold },
  footer: { gap: Spacing.md, paddingTop: Spacing.sm },
  counterText: { textAlign: 'center', fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  continueBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow },
  gradBtn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
})
