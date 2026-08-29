import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Modal, FlatList
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../store/auth'
import { useAlertStore } from '../store/alertStore'
import { api } from '../api/client'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'

export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, loadSession } = useAuthStore()

  const [bio, setBio] = useState(user?.profile?.bio || '')
  const [occupation, setOccupation] = useState(user?.profile?.occupation || '')
  const [city, setCity] = useState(user?.profile?.city || '')
  const [district, setDistrict] = useState(user?.profile?.district || '')
  const [gender, setGender] = useState(user?.profile?.gender || 'MALE')

  let initialShowMe = ['FEMALE', 'MALE'];
  if (user?.profile?.showMe) {
    if (Array.isArray(user.profile.showMe)) {
      initialShowMe = user.profile.showMe;
    } else if (typeof user.profile.showMe === 'string') {
      try {
        initialShowMe = JSON.parse(user.profile.showMe);
      } catch (e) {
        console.error("Failed to parse showMe", e);
      }
    }
  }

  const [showMe, setShowMe] = useState<string[]>(initialShowMe)
  const isPremium = user?.isPremium || false

  // Prompts and Song
  const existingPrompts = user?.profile?.prompts || {}
  const [q1, setQ1] = useState(existingPrompts.answers?.q1 || '')
  const [q2, setQ2] = useState(existingPrompts.answers?.q2 || '')
  const [q3, setQ3] = useState(existingPrompts.answers?.q3 || '')
  const [q4, setQ4] = useState(existingPrompts.answers?.q4 || '')
  const [q5, setQ5] = useState(existingPrompts.answers?.q5 || '')
  const [mySong, setMySong] = useState(existingPrompts.song || null)

  const [interests, setInterests] = useState(user?.profile?.interests?.join(', ') || '')
  const [loading, setLoading] = useState(false)

  // Song Search State
  const [songModalVisible, setSongModalVisible] = useState(false)
  const [songSearch, setSongSearch] = useState('')
  const [songResults, setSongResults] = useState([])
  const [searchingSong, setSearchingSong] = useState(false)
  const [updatingLocation, setUpdatingLocation] = useState(false)

  const handleUpdateLocation = async () => {
    setUpdatingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        useAlertStore.getState().showAlert('Hata', 'Konum izni reddedildi.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      })

      if (address) {
        setCity(address.region || address.city || address.subregion || '')
        setDistrict(address.subregion || address.city || address.district || '')
      }
    } catch (e) {
      useAlertStore.getState().showAlert('Hata', 'Konum alınamadı. Cihazının GPS ayarlarını kontrol et.')
    } finally {
      setUpdatingLocation(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const interestsArray = interests.split(',').map((i: string) => i.trim()).filter((i: string) => i.length > 0)

      const prompts = {
        song: mySong,
        answers: { q1, q2, q3, q4, q5 }
      }

      await api.updateProfile({
        bio,
        occupation,
        city,
        district,
        gender,
        showMe,
        interests: interestsArray,
        prompts
      })

      await loadSession() // refresh local user state
      router.back()
    } catch (err) {
      console.log('Error updating profile', err)
      useAlertStore.getState().showAlert('Hata', 'Güncelleme sırasında bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const searchItunes = async () => {
    if (!songSearch.trim()) return
    setSearchingSong(true)
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(songSearch)}&media=music&limit=15`)
      const data = await res.json()
      setSongResults(data.results || [])
    } catch (e) {
      console.error(e)
    } finally {
      setSearchingSong(false)
    }
  }

  const selectSong = (track: any) => {
    setMySong({
      id: track.trackId.toString(),
      title: track.trackName,
      artist: track.artistName,
      coverUrl: track.artworkUrl100,
      previewUrl: track.previewUrl
    })
    setSongModalVisible(false)
  }

  const handleShowMeSelect = (pref: string[]) => {
    // If MALE and selecting ONLY FEMALE
    if (gender === 'MALE' && pref.length === 1 && pref[0] === 'FEMALE') {
      if (!isPremium) {
        useAlertStore.getState().showAlert(
          "Premium Gerekli",
          "Sadece Kadınları görmek Premium üyelik gerektirir!",
          [{ text: "Vazgeç", style: "cancel" }, { text: "Premium'a Geç", onPress: () => router.push('/premium') }]
        )
        return
      }
    }
    // If FEMALE and selecting ONLY MALE
    if (gender === 'FEMALE' && pref.length === 1 && pref[0] === 'MALE') {
      if (!isPremium) {
        useAlertStore.getState().showAlert(
          "Premium Gerekli",
          "Sadece Erkekleri görmek Premium üyelik gerektirir!",
          [{ text: "Vazgeç", style: "cancel" }, { text: "Premium'a Geç", onPress: () => router.push('/premium') }]
        )
        return
      }
    }
    setShowMe(pref)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* GENDER & PREFERENCE */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.label}>Benim Cinsiyetim</Text>
            <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
          </View>
          <View style={[styles.buttonRow, { opacity: 0.7 }]}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'MALE' && styles.genderBtnActive]}
              activeOpacity={1}
            >
              <Text style={[styles.genderBtnText, gender === 'MALE' && styles.genderBtnTextActive]}>Erkek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'FEMALE' && styles.genderBtnActive]}
              activeOpacity={1}
            >
              <Text style={[styles.genderBtnText, gender === 'FEMALE' && styles.genderBtnTextActive]}>Kadın</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'OTHER' && styles.genderBtnActive]}
              activeOpacity={1}
            >
              <Text style={[styles.genderBtnText, gender === 'OTHER' && styles.genderBtnTextActive]}>Diğer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Görmek İstediğim (Tercih)</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.genderBtn, showMe.includes('MALE') && !showMe.includes('FEMALE') && styles.genderBtnActive]}
              onPress={() => handleShowMeSelect(['MALE'])}
            >
              <Text style={[styles.genderBtnText, showMe.includes('MALE') && !showMe.includes('FEMALE') && styles.genderBtnTextActive]}>Erkek</Text>
              {gender === 'FEMALE' && !isPremium && <Ionicons name="lock-closed" size={12} color={Colors.primary} style={{ position: 'absolute', top: 5, right: 5 }} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, showMe.includes('FEMALE') && !showMe.includes('MALE') && styles.genderBtnActive]}
              onPress={() => handleShowMeSelect(['FEMALE'])}
            >
              <Text style={[styles.genderBtnText, showMe.includes('FEMALE') && !showMe.includes('MALE') && styles.genderBtnTextActive]}>Kadın</Text>
              {gender === 'MALE' && !isPremium && <Ionicons name="lock-closed" size={12} color={Colors.primary} style={{ position: 'absolute', top: 5, right: 5 }} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, showMe.includes('MALE') && showMe.includes('FEMALE') && styles.genderBtnActive]}
              onPress={() => handleShowMeSelect(['MALE', 'FEMALE'])}
            >
              <Text style={[styles.genderBtnText, showMe.includes('MALE') && showMe.includes('FEMALE') && styles.genderBtnTextActive]}>Her İkisi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SONG SELECTION */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Benim Şarkım</Text>
          {mySong ? (
            <View style={styles.songCard}>
              <Image source={{ uri: mySong.coverUrl }} style={styles.songImage} />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{mySong.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{mySong.artist}</Text>
              </View>
              <TouchableOpacity onPress={() => setMySong(null)} style={{ padding: 10 }}>
                <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickSongBtn} onPress={() => setSongModalVisible(true)}>
              <Ionicons name="musical-notes" size={20} color={Colors.primary} />
              <Text style={styles.pickSongText}>Profiline Bir Şarkı Ekle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PROMPTS */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Profil Soruları</Text>
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestion}>Şu konuda çok iddialıyım...</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Cevabını yaz..."
              placeholderTextColor={Colors.textMuted}
              value={q1}
              onChangeText={setQ1}
              maxLength={100}
              selectionColor={Colors.primary}
            />
          </View>
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestion}>Hafta sonu ideal planım...</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Cevabını yaz..."
              placeholderTextColor={Colors.textMuted}
              value={q2}
              onChangeText={setQ2}
              maxLength={100}
              selectionColor={Colors.primary}
            />
          </View>
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestion}>Beni en çok güldüren şey...</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Cevabını yaz..."
              placeholderTextColor={Colors.textMuted}
              value={q3}
              onChangeText={setQ3}
              maxLength={100}
              selectionColor={Colors.primary}
            />
          </View>
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestion}>Gizli yeteneğim...</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Cevabını yaz..."
              placeholderTextColor={Colors.textMuted}
              value={q4}
              onChangeText={setQ4}
              maxLength={100}
              selectionColor={Colors.primary}
            />
          </View>
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestion}>İlk buluşmada asla yapmam dediğim şey...</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Cevabını yaz..."
              placeholderTextColor={Colors.textMuted}
              value={q5}
              onChangeText={setQ5}
              maxLength={100}
              selectionColor={Colors.primary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hakkında (Biyografi)</Text>
          <View style={[styles.inputWrapper, { height: 100 }]}>
            <TextInput
              style={[styles.input, { textAlignVertical: 'top' }]}
              placeholder="Kendinden bahset..."
              placeholderTextColor={Colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={500}
              selectionColor={Colors.primary}
            />
          </View>
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Konum</Text>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.input, { color: city ? Colors.textPrimary : Colors.textMuted }]}>
                {city || 'İl'}
              </Text>
            </View>
            <View style={[styles.inputWrapper, { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.input, { color: district ? Colors.textPrimary : Colors.textMuted }]}>
                {district || 'İlçe'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={handleUpdateLocation}
            disabled={updatingLocation}
          >
            {updatingLocation ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="location" size={18} color={Colors.primary} />
                <Text style={styles.locationBtnText}>Mevcut Konumumu Kullan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>İlgi Alanları (Virgülle ayırın)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Örn: Müzik, Kamp, Sinema"
              placeholderTextColor={Colors.textMuted}
              value={interests}
              onChangeText={setInterests}
            />
          </View>
        </View>
      </ScrollView>

      {/* SONG SEARCH MODAL */}
      <Modal visible={songModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSongModalVisible(false)}>
        <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Şarkı Ara</Text>
            <TouchableOpacity onPress={() => setSongModalVisible(false)}>
              <Text style={styles.saveText}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Şarkı veya sanatçı adı..."
              placeholderTextColor={Colors.textMuted}
              value={songSearch}
              onChangeText={setSongSearch}
              onSubmitEditing={searchItunes}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity onPress={searchItunes} style={styles.searchBtn}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {searchingSong ? (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={songResults}
              keyExtractor={(item: any) => item.trackId.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.songResultItem} onPress={() => selectSong(item)}>
                  <Image source={{ uri: item.artworkUrl100 }} style={styles.songResultImage} />
                  <View style={styles.songResultInfo}>
                    <Text style={styles.songTitle}>{item.trackName}</Text>
                    <Text style={styles.songArtist}>{item.artistName}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
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

  content: { padding: Spacing.xl, gap: Spacing.lg },
  inputGroup: { gap: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  inputWrapper: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: Spacing.lg, minHeight: 56, justifyContent: 'center' },
  input: { color: Colors.textPrimary, fontSize: FontSize.md },
  charCount: { alignSelf: 'flex-end', fontSize: FontSize.xs, color: Colors.textMuted, marginRight: 4 },

  buttonRow: { flexDirection: 'row', gap: Spacing.sm },
  genderBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  genderBtnActive: { backgroundColor: 'rgba(232,82,106,0.1)', borderColor: Colors.primary },
  genderBtnText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  genderBtnTextActive: { color: Colors.primary },


  pickSongBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,82,106,0.1)', padding: Spacing.md, borderRadius: BorderRadius.xl, gap: Spacing.sm },
  pickSongText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  songCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  songImage: { width: 60, height: 60, borderRadius: BorderRadius.lg, margin: Spacing.sm },
  songInfo: { flex: 1, justifyContent: 'center' },
  songTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  songArtist: { color: Colors.textSecondary, fontSize: FontSize.sm },

  locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,82,106,0.1)', padding: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm, marginTop: Spacing.xs },
  locationBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },

  promptContainer: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  promptQuestion: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  promptInput: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold, padding: 0 },

  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  searchBar: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  searchInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, color: Colors.textPrimary, height: 44 },
  searchBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  songResultItem: { flexDirection: 'row', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  songResultImage: { width: 50, height: 50, borderRadius: BorderRadius.sm, marginRight: Spacing.md },
  songResultInfo: { flex: 1 }
})
