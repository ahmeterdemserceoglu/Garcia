import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Slider from '@react-native-community/slider'
import { useAuthStore } from '../../store/auth'
import { api } from '../../api/client'
import { useAlertStore } from '../../store/alertStore'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'

export default function AgeRangeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, loadSession } = useAuthStore()
  
  const [ageMin, setAgeMin] = useState(user?.profile?.ageMin || 18)
  const [ageMax, setAgeMax] = useState(user?.profile?.ageMax || 35)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    // Ensure min <= max
    const finalMin = Math.min(ageMin, ageMax)
    const finalMax = Math.max(ageMin, ageMax)

    setLoading(true)
    try {
      await api.updateProfile({ ageMin: Math.round(finalMin), ageMax: Math.round(finalMax) })
      await loadSession()
      useAlertStore.getState().showAlert('Başarılı', 'Yaş aralığı ayarınız güncellendi.')
      router.back()
    } catch (err) {
      useAlertStore.getState().showAlert('Hata', 'Ayarlar kaydedilirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yaş Aralığı</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Minimum Yaş</Text>
            <Text style={styles.value}>{Math.round(ageMin)}</Text>
          </View>
          
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={18}
            maximumValue={99}
            step={1}
            value={ageMin}
            onValueChange={(val) => {
              setAgeMin(val)
              if (val > ageMax) setAgeMax(val)
            }}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor={Colors.primary}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Maksimum Yaş</Text>
            <Text style={styles.value}>{Math.round(ageMax)}</Text>
          </View>
          
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={18}
            maximumValue={99}
            step={1}
            value={ageMax}
            onValueChange={(val) => {
              setAgeMax(val)
              if (val < ageMin) setAgeMin(val)
            }}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor={Colors.primary}
          />
        </View>

        <Text style={styles.hint}>
          Sadece seçtiğin yaş aralığındaki kişileri göreceksin.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { color: Colors.textPrimary, fontSize: 24 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  saveText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  
  content: { padding: Spacing.xl, flex: 1, gap: Spacing.xl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  value: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: FontWeight.bold },
  hint: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center' },
})
