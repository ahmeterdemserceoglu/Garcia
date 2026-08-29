import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch,
  Dimensions,
  ActivityIndicator,
  Animated,
  TextInput,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useGlobalSearchParams } from 'expo-router'
import { useAuthStore } from '../../store/auth'
import { useAlertStore } from '../../store/alertStore'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { AiCoachModal } from '../../components/AiCoachModal'

const { width: SCREEN_W } = Dimensions.get('window')

interface SettingRow {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  subtitle?: string
  value?: string | boolean
  onPress?: () => void
  isToggle?: boolean
  toggleValue?: boolean
  onToggle?: (val: boolean) => void
  onValueChange?: (val: boolean) => void
  danger?: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <View style={sStyles.sectionBody}>{children}</View>
    </View>
  )
}

function SettingItem({ icon, label, subtitle, value, onPress, isToggle, toggleValue, onToggle, onValueChange, danger }: SettingRow) {
  return (
    <TouchableOpacity style={sStyles.row} onPress={onPress} disabled={isToggle} activeOpacity={0.7}>
      <View style={sStyles.rowLeft}>
        <View style={[sStyles.iconWrapper, danger && { backgroundColor: 'rgba(235,87,87,0.1)' }, subtitle && { marginTop: 2 }]}>
          <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.primary} />
        </View>
        <View style={sStyles.rowTextWrapper}>
          <Text style={[sStyles.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
          {subtitle && <Text style={sStyles.rowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {isToggle ? (
        <View style={subtitle ? { marginTop: 4 } : undefined}>
          <Switch
            value={toggleValue}
            onValueChange={onValueChange || onToggle}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primaryDark }}
            thumbColor={toggleValue ? Colors.primary : "#f4f3f4"}
          />
        </View>
      ) : (
        <View style={[sStyles.rowRight, subtitle && { marginTop: 8 }]}>
          {value && typeof value === 'string' && <Text style={sStyles.rowValue}>{value}</Text>}
          {onPress && <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />}
        </View>
      )}
    </TouchableOpacity>
  )
}

const sStyles = StyleSheet.create({
  section: { marginBottom: Spacing.xxxl },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.md, paddingHorizontal: Spacing.xl },
  sectionBody: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, marginHorizontal: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)', minHeight: 60 },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, flex: 1, paddingRight: Spacing.md },
  iconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowTextWrapper: { flex: 1, paddingTop: 6 },
  rowLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  rowSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  rowRight: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  rowValue: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
})

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, logout, loadSession } = useAuthStore()
  const initialIsVisible = user?.profile?.isVisible ?? true
  const initialShowLocation = user?.profile?.showLocation ?? true

  const [isVisible, setIsVisible] = useState(initialIsVisible)
  const [showLocation, setShowLocation] = useState(initialShowLocation)
  const [stealthMode, setStealthMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')


  const { highlight } = useGlobalSearchParams()
  const highlightAnim = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (highlight === 'showLocation') {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 350, animated: true })
      }, 300)
      
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(highlightAnim, { toValue: 0, duration: 1500, delay: 1500, useNativeDriver: false })
      ]).start()
      
      // Clear the parameter so it doesn't re-trigger on subsequent re-renders
      router.setParams({ highlight: '' })
    }
  }, [highlight])

  const highlightColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(232,82,106,0.25)']
  })

  useEffect(() => {
    if (user?.profile) {
      setIsVisible(user.profile.isVisible ?? true)
      setShowLocation(user.profile.showLocation ?? true)
    }
  }, [user?.profile?.isVisible, user?.profile?.showLocation])

  const hasChanges = isVisible !== (user?.profile?.isVisible ?? true) || showLocation !== (user?.profile?.showLocation ?? true)

  const handleUndo = () => {
    setIsVisible(user?.profile?.isVisible ?? true)
    setShowLocation(user?.profile?.showLocation ?? true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateProfile({ isVisible, showLocation })
      await loadSession()
    } catch (e) {
      useAlertStore.getState().showAlert('Hata', 'Ayarlar kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }
  const [showCoach, setShowCoach] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const photos = (user?.photos || []).filter(p => p.moderationStatus === 'approved' || p.status === 'approved')
  const hasPhotos = photos.length > 0

  const age = user?.profile?.birthDate
    ? Math.floor((Date.now() - new Date(user.profile.birthDate).getTime()) / 31557600000)
    : null

  const handleLogout = () => {
    useAlertStore.getState().showAlert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome') } },
      ]
    )
  }

  const handleChangePassword = async () => {
    if (!user?.email) return
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      useAlertStore.getState().showAlert('E-posta Gönderildi!', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.')
    } catch (e) {
      useAlertStore.getState().showAlert('Hata', 'Şifre sıfırlama bağlantısı gönderilirken bir hata oluştu.')
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  const confirmDeleteAccount = async () => {
    if (deleteInput.trim().toUpperCase() !== 'SİL') {
      useAlertStore.getState().showAlert('Hata', 'Lütfen onaylamak için SİL yazın.')
      return
    }

    setShowDeleteModal(false)
    try {
      await api.deleteAccount()
    } catch (_) { /* silme isteği yollandı, devam et */ }
    await logout()
    router.replace('/(auth)/welcome')
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView ref={scrollViewRef} style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          {/* Cover gradient */}
          <LinearGradient colors={['#1A0D15', Colors.background]} style={styles.coverGradient} />

          {/* AI Coach Button */}
          <TouchableOpacity
            style={{ position: 'absolute', top: Spacing.md, right: Spacing.xl, height: 36, borderRadius: 18, backgroundColor: 'rgba(155,81,224,0.15)', borderWidth: 1, borderColor: 'rgba(155,81,224,0.4)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, zIndex: 10, ...Shadows.glow }}
            onPress={() => setShowCoach(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color="#9B51E0" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>AI Koç</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {hasPhotos ? (
              <View style={[styles.avatar, { overflow: 'hidden' }]}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) => {
                    const x = e.nativeEvent.contentOffset.x
                    setActivePhotoIndex(Math.round(x / 120))
                  }}
                  scrollEventThrottle={16}
                >
                  {photos.map((p, i) => (
                    <Image key={i} source={{ uri: p.url }} style={{ width: 120, height: 120 }} contentFit="cover" />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={[styles.avatar, { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 48 }}>👤</Text>
              </View>
            )}
            {/* Edit overlay */}
            <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8} onPress={() => router.push('/manage-photos')}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} />
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Dots Indicator */}
          {hasPhotos && photos.length > 1 && (
            <View style={styles.dotsContainer}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activePhotoIndex === i && styles.dotActive
                  ]}
                />
              ))}
            </View>
          )}

          {/* Name & info */}
          <Text style={styles.profileName}>{user?.profile?.name || 'İsminiz'}{age ? `, ${age}` : ''}</Text>
          {user?.profile?.occupation && <Text style={styles.profileOccupation}>{user.profile.occupation}</Text>}

          {/* Premium & Verified badges */}
          <View style={styles.badges}>
            {user?.isFaceVerified && (
              <View style={[styles.badge, { backgroundColor: 'rgba(108,142,245,0.15)', borderColor: Colors.info }]}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.info} />
                <Text style={[styles.badgeText, { color: Colors.info }]}>Doğrulandı</Text>
              </View>
            )}
            {user?.isPremium ? (
              <LinearGradient colors={['rgba(245,166,35,0.2)', 'rgba(245,166,35,0.05)']} style={[styles.badge, { borderColor: Colors.warning }]}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={[styles.badgeText, { color: Colors.warning }]}>Premium</Text>
              </LinearGradient>
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/premium')}>
                <LinearGradient colors={['rgba(232,82,106,0.2)', 'rgba(232,82,106,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.badge, { borderColor: Colors.primary }]}>
                  <Ionicons name="flash" size={14} color={Colors.primary} />
                  <Text style={[styles.badgeText, { color: Colors.primary }]}>{"Premium'a Yükselt"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Bio */}
          {user?.profile?.bio ? (
            <Text style={styles.bio}>{user.profile.bio}</Text>
          ) : (
            <TouchableOpacity style={styles.addBioBtn} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.addBio}>+ Biyografi ekle</Text>
            </TouchableOpacity>
          )}


        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Section title="Profil">
            <SettingItem icon="person-outline" label="Profili Düzenle" onPress={() => router.push('/edit-profile')} />
            <SettingItem icon="images-outline" label="Fotoğraflar" onPress={() => router.push('/manage-photos')} />
            <SettingItem icon="eye-outline" label="Profil Ziyaretçileri" onPress={() => router.push('/visitors' as any)} />
            <SettingItem icon="gift-outline" label="Günlük Ödül" subtitle="Her gün giriş yap, ödül kazan" onPress={() => router.push('/daily-checkin' as any)} />
          </Section>

          <Section title="Keşfet & Gizlilik Ayarları">
            <Animated.View style={{ backgroundColor: highlightColor, borderRadius: BorderRadius.lg }}>
              <SettingItem
                icon="map-outline"
                label="Profilim Haritada Görünsün"
                subtitle="Haritada ve radarda konumun gösterilsin"
                isToggle
                toggleValue={showLocation}
                onValueChange={async (val) => {
                  setShowLocation(val)
                  try {
                    await api.updateProfile({ showLocation: val })
                    await loadSession()
                  } catch (e) {}
                }}
              />
            </Animated.View>
            <SettingItem
              icon="eye-outline"
              label="Keşfet'te Görün"
              subtitle="Kartlar arasında profillere gösteril"
              isToggle
              toggleValue={isVisible}
              onValueChange={async (val) => {
                setIsVisible(val)
                try {
                  await api.updateProfile({ isVisible: val })
                  await loadSession()
                } catch (e) {}
              }}
            />
            <SettingItem
              icon="eye-off-outline"
              label="Gizli Mod"
              subtitle="Profilini sadece beğendiğin kişiler görsün"
              isToggle
              toggleValue={stealthMode}
              onValueChange={(val) => {
                if (val && !user?.isPremium) {
                  useAlertStore.getState().showAlert("Premium Gerekli", "Sadece beğendiğin kişilerin seni görebilmesi için Premium'a geç!", [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Premium Al', onPress: () => router.push('/premium') }
                  ])
                  return
                }
                setStealthMode(val)
                if (val) useAlertStore.getState().showAlert("Gizli Mod Aktif", "Artık sadece sağa kaydırdığın kişiler seni görebilir.")
              }}
            />
            <SettingItem
              icon="airplane-outline"
              label="Seyahat Modu (Passport)"
              subtitle="Konumunu değiştir, dünyayı keşfet"
              onPress={() => {
                if (!user?.isPremium) {
                  useAlertStore.getState().showAlert("Premium Gerekli", "Seyahat Modu ile konumunu değiştirip dünyayı gezmek için Premium'a geç!", [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Premium Al', onPress: () => router.push('/premium') }
                  ])
                } else {
                  useAlertStore.getState().showAlert("Seyahat Modu", "Hangi şehre uçmak istersin?", [
                    {
                      text: 'Tokyo 🇯🇵', onPress: async () => {
                        try { await api.updateLocation(35.6762, 139.6503); useAlertStore.getState().showAlert('Uçuş Başarılı', 'Konumunuz Tokyo olarak güncellendi.'); } catch (e) { }
                      }
                    },
                    {
                      text: 'Paris 🇫🇷', onPress: async () => {
                        try { await api.updateLocation(48.8566, 2.3522); useAlertStore.getState().showAlert('Uçuş Başarılı', 'Konumunuz Paris olarak güncellendi.'); } catch (e) { }
                      }
                    },
                    {
                      text: 'New York 🇺🇸', onPress: async () => {
                        try { await api.updateLocation(40.7128, -74.0060); useAlertStore.getState().showAlert('Uçuş Başarılı', 'Konumunuz New York olarak güncellendi.'); } catch (e) { }
                      }
                    },
                    { text: 'İptal', style: 'cancel' }
                  ])
                }
              }}
            />
          </Section>

          <Section title="Keşif">
            <SettingItem icon="calendar-outline" label="Yaş Aralığı" value={`${user?.profile?.ageMin || 18}–${user?.profile?.ageMax || 99}`} onPress={() => router.push('/settings/age-range')} />
            <SettingItem icon="location-outline" label="Maksimum Mesafe" value={`${user?.profile?.maxDistance || 50}km`} onPress={() => router.push('/settings/max-distance')} />
          </Section>

          <Section title="Gizlilik">
            <SettingItem icon="ban-outline" label="Engellenen Kullanıcılar" onPress={() => useAlertStore.getState().showAlert('Bilgi', 'Henüz engellenen kullanıcınız yok.')} />
          </Section>

          <Section title="Bildirimler">
            <SettingItem icon="notifications-outline" label="Anlık Bildirimler" isToggle toggleValue={true} onToggle={() => { }} />
          </Section>

          <Section title="Yasal">
            <SettingItem icon="document-text-outline" label="Kullanım Koşulları" onPress={() => router.push('/legal/terms')} />
            <SettingItem icon="shield-checkmark-outline" label="Gizlilik Politikası" onPress={() => router.push('/legal/privacy')} />
            <SettingItem icon="information-circle-outline" label="KVKK Aydınlatma Metni" onPress={() => router.push('/legal/kvkk')} />
          </Section>

          <Section title="Hesap">
            <SettingItem icon="key-outline" label="Şifreyi Değiştir" onPress={handleChangePassword} />
            <SettingItem icon="log-out-outline" label="Çıkış Yap" onPress={handleLogout} danger />
            <SettingItem icon="trash-outline" label="Hesabı Sil" onPress={handleDeleteAccount} danger />
          </Section>

          <Text style={styles.version}>© 2026 · Garcia</Text>
        </View>

        <AiCoachModal visible={showCoach} onClose={() => setShowCoach(false)} user={user} />
      </ScrollView>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <View style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          <View style={styles.modalCenter}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="warning" size={32} color={Colors.error} />
                <Text style={styles.modalTitle}>Hesabı Sil</Text>
              </View>
              <Text style={styles.modalText}>
                Hesabınız, tüm eşleşmeleriniz ve mesajlarınız kalıcı olarak silinecektir. Bu işlem geri alınamaz. 
                Onaylamak için aşağıya <Text style={{fontWeight: 'bold', color: Colors.error}}>SİL</Text> yazın.
              </Text>
              <View style={{ marginTop: Spacing.md, width: '100%' }}>
                <TextInput
                  style={styles.deleteInput}
                  placeholder="SİL"
                  placeholderTextColor={Colors.textMuted}
                  value={deleteInput}
                  onChangeText={setDeleteInput}
                  autoCapitalize="characters"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowDeleteModal(false); setDeleteInput(''); }}>
                    <Text style={styles.modalCancelText}>Vazgeç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalDeleteBtn, deleteInput.trim().toUpperCase() !== 'SİL' && { opacity: 0.5 }]} 
                    onPress={confirmDeleteAccount}
                    disabled={deleteInput.trim().toUpperCase() !== 'SİL'}
                  >
                    <Text style={styles.modalDeleteText}>Hesabı Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* FLOATING ACTION BAR */}

      {hasChanges && (
        <View style={styles.floatingAction}>
          <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
            <Text style={styles.undoBtnText}>Geri Al</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveActionBtn} onPress={handleSave}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveActionBtnText}>Kaydet</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileHeader: { alignItems: 'center', paddingBottom: Spacing.xl, overflow: 'hidden' },
  coverGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },
  avatarContainer: { marginTop: 40, marginBottom: Spacing.md, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: Colors.background, ...Shadows.glow },
  editAvatarBtn: { position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: Colors.background, zIndex: 10 },
  dotsContainer: { flexDirection: 'row', gap: 6, marginBottom: Spacing.md, alignItems: 'center', justifyContent: 'center', height: 10 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  profileName: { fontSize: 28, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  profileOccupation: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4, fontWeight: FontWeight.medium },
  badges: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderWidth: 1 },
  badgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  bio: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl, lineHeight: 24 },
  addBioBtn: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.full },
  addBio: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  statsContainer: { flexDirection: 'row', marginTop: Spacing.xxl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.xxl, marginHorizontal: Spacing.xl, backgroundColor: Colors.surface, ...Shadows.lg },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xl },
  statValue: { fontSize: 22, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: FontWeight.bold },

  settingsContainer: { paddingTop: Spacing.lg, paddingBottom: 100 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.md, fontWeight: FontWeight.bold, letterSpacing: 1 },

  floatingAction: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    flexDirection: 'row', backgroundColor: Colors.surface,
    padding: Spacing.sm, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: 'rgba(232,82,106,0.3)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
    gap: Spacing.sm
  },
  undoBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.full },
  undoBtnText: { color: Colors.textSecondary, fontWeight: 'bold' },
  saveActionBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  saveActionBtnText: { color: '#fff', fontWeight: 'bold' },

  modalCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(235,87,87,0.3)', ...Shadows.lg },
  modalHeader: { alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.error, marginTop: Spacing.sm },
  modalText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  deleteInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.lg, textAlign: 'center', fontWeight: 'bold', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  modalCancelBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.full },
  modalCancelText: { color: Colors.textPrimary, fontWeight: 'bold' },
  modalDeleteBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.error, borderRadius: BorderRadius.full },
  modalDeleteText: { color: '#fff', fontWeight: 'bold' },
})
