import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useOnboardingStore } from '../../store/onboarding'

interface District {
  id: number
  name: string
}

interface City {
  id: number
  name: string
  districts: District[]
}

export default function OnboardingLocationScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setLocation } = useOnboardingStore()
  
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [city, setCity] = useState<City | null>(null)
  const [district, setDistrict] = useState<District | null>(null)
  
  const [showCityModal, setShowCityModal] = useState(false)
  const [showDistrictModal, setShowDistrictModal] = useState(false)

  // API'den illeri çek
  useEffect(() => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(json => {
        if (json.status === 'OK' && Array.isArray(json.data)) {
          // İlleri adına göre sırala
          const sorted = json.data.sort((a: City, b: City) => a.name.localeCompare(b.name, 'tr'))
          setCities(sorted)
        } else {
          setError('Şehirler yüklenemedi.')
        }
      })
      .catch(() => setError('Ağ hatası oluştu.'))
      .finally(() => setLoading(false))
  }, [])

  const handleContinue = () => {
    if (city && district) {
      setLocation(city.name, district.name)
      router.push('/(onboarding)/interests')
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0D12', '#1A0D15', '#0F0D12']} style={StyleSheet.absoluteFill} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Ekstra</Text>
          </View>
        </View>

        <Text style={styles.title}>Nerede yaşıyorsun?</Text>
        <Text style={styles.subtitle}>Sana en yakın ve en uygun eşleşmeleri bulmamız için konumun gerekiyor.</Text>

        <View style={styles.form}>
          {/* Şehir Seçimi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şehir</Text>
            <TouchableOpacity 
              style={styles.selectBox} 
              onPress={() => !loading && setShowCityModal(true)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={[styles.selectText, !city && { color: Colors.textMuted }]}>
                {loading ? 'Yükleniyor...' : city ? city.name : 'Şehir seçiniz'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* İlçe Seçimi */}
          <View style={[styles.inputGroup, { opacity: city ? 1 : 0.5 }]}>
            <Text style={styles.label}>İlçe</Text>
            <TouchableOpacity 
              style={styles.selectBox} 
              onPress={() => city && setShowDistrictModal(true)}
              disabled={!city}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectText, !district && { color: Colors.textMuted }]}>
                {district ? district.name : 'Önce şehir seçiniz'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            disabled={!city || !district}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={city && district ? [Colors.primary, Colors.primaryDark] : [Colors.surface, Colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradBtn}
            >
              <Text style={[styles.continueBtnText, (!city || !district) && { color: Colors.textMuted }]}>
                Devam Et →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Şehir Seçim Modalı */}
      <Modal visible={showCityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şehir Seç</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cities}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.listItem}
                  onPress={() => {
                    setCity(item)
                    setDistrict(null)
                    setShowCityModal(false)
                  }}
                >
                  <Text style={[styles.listItemText, city?.id === item.id && { color: Colors.primary, fontWeight: 'bold' }]}>
                    {item.name}
                  </Text>
                  {city?.id === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* İlçe Seçim Modalı */}
      <Modal visible={showDistrictModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{city?.name} - İlçe Seç</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={city?.districts ? [...city.districts].sort((a, b) => a.name.localeCompare(b.name, 'tr')) : []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.listItem}
                  onPress={() => {
                    setDistrict(item)
                    setShowDistrictModal(false)
                  }}
                >
                  <Text style={[styles.listItemText, district?.id === item.id && { color: Colors.primary, fontWeight: 'bold' }]}>
                    {item.name}
                  </Text>
                  {district?.id === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
  form: { gap: Spacing.xl },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  selectBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, height: 56 },
  selectText: { fontSize: FontSize.md, color: Colors.textPrimary },
  footer: { gap: Spacing.md, paddingTop: Spacing.xl },
  continueBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow },
  gradBtn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
  
  /* Modal Styles */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  listItemText: { fontSize: FontSize.md, color: Colors.textPrimary },
})
