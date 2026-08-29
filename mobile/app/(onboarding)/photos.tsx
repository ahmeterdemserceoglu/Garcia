import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAlertStore } from '../../store/alertStore'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useOnboardingStore } from '../../store/onboarding'

const { width: SCREEN_W } = Dimensions.get('window')
const SLOT_SIZE = (SCREEN_W - Spacing.xl * 2 - Spacing.md * 2) / 3

export default function OnboardingPhotosScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { photos, setPhotos } = useOnboardingStore()
  const [loading, setLoading] = useState(false)

  const pickPhoto = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    })
    if (!result.canceled && result.assets[0].base64) {
      const updated = [...photos]
      const mimeType = result.assets[0].uri.endsWith('.png') ? 'image/png' : 'image/jpeg'
      updated[index] = `data:${mimeType};base64,${result.assets[0].base64}`
      setPhotos(updated)
    }
  }

  const handleContinue = () => {
    const filled = photos.filter(Boolean).length
    if (filled < 2) {
      useAlertStore.getState().showAlert('Daha Fazla Fotoğraf Ekle', 'Devam etmek için lütfen en az 2 fotoğraf ekleyin.')
      return
    }
    router.push('/(onboarding)/bio')
  }

  const filledCount = photos.filter(Boolean).length

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0F0D12', '#1A0D15', '#0F0D12']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>1 / 3</Text>
          </View>
          <Text style={styles.title}>Fotoğraflarını ekle</Text>
          <Text style={styles.subtitle}>En iyi halini göster. En az 2 fotoğraf ekle.</Text>
        </View>

        {/* Photo Grid */}
        <View style={styles.grid}>
          {photos.map((uri, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.photoSlot, i === 0 && styles.mainSlot, uri && styles.photoSlotFilled]}
              onPress={() => pickPhoto(i)}
              activeOpacity={0.85}
            >
              {uri ? (
                <>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Ana</Text>
                    </View>
                  )}
                  <View style={styles.photoOverlay}>
                    <Text style={styles.editPhotoText}>✎</Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.plusIcon}>+</Text>
                  {i === 0 && <Text style={styles.mainPhotoHint}>Ana fotoğraf</Text>}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Counter */}
        <View style={styles.counter}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.counterDot, i < filledCount && styles.counterDotFilled]} />
          ))}
        </View>

        <Text style={styles.hint}>
          4+ fotoğraflı profiller <Text style={{ color: Colors.primary }}>3 kat daha fazla eşleşme</Text> alıyor
        </Text>
      </View>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          disabled={filledCount < 2}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={filledCount >= 2 ? [Colors.primary, Colors.primaryDark] : [Colors.surface, Colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradBtn}
          >
            <Text style={[styles.continueBtnText, filledCount < 2 && { color: Colors.textMuted }]}>
              {filledCount < 2 ? `${2 - filledCount} fotoğraf daha ekle` : 'Devam Et →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  header: { paddingTop: Spacing.xxl, marginBottom: Spacing.xxl, gap: Spacing.sm },
  stepIndicator: { backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.border },
  stepText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  title: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.8 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center' },
  photoSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE * 1.35,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE * 1.35,
  },
  photoSlotFilled: { borderStyle: 'solid', borderColor: Colors.primary },
  emptySlot: { alignItems: 'center', gap: Spacing.xs },
  plusIcon: { fontSize: 28, color: Colors.textMuted },
  mainPhotoHint: { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  mainBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  mainBadgeText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  photoOverlay: { position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(15,13,18,0.7)', alignItems: 'center', justifyContent: 'center' },
  editPhotoText: { fontSize: 13, color: '#fff' },
  counter: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xl },
  counterDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  counterDotFilled: { backgroundColor: Colors.primary },
  hint: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.md },
  footer: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  continueBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow },
  gradBtn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.md },
})
