import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import { useAuthStore } from '../store/auth'
import { useAlertStore } from '../store/alertStore'
import { api } from '../api/client'

const { width: SCREEN_W } = Dimensions.get('window')
const SLOT_SIZE = (SCREEN_W - Spacing.xl * 2 - Spacing.md * 2) / 3

type PhotoData = { url: string; status: 'pending' | 'approved' | 'rejected' }

export default function ManagePhotosScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, loadSession } = useAuthStore()
  const [photos, setPhotos] = useState<(PhotoData | null)[]>([null, null, null, null, null, null])
  const [loading, setLoading] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadSession()
    }, [loadSession])
  )

  useEffect(() => {
    if (user?.photos) {
      const currentPhotos: (PhotoData | null)[] = [null, null, null, null, null, null]
      user.photos.forEach((p, i) => {
        if (i < 6) currentPhotos[i] = { url: p.url, status: p.moderationStatus || 'approved' }
      })
      setPhotos(currentPhotos)
    }
  }, [user?.photos])

  const hasChanges = useMemo(() => {
    if (!user?.photos) return false
    const current = photos.filter(Boolean) as PhotoData[]
    if (current.length !== Math.min(user.photos.length, 6)) return true
    
    for (let i = 0; i < current.length; i++) {
      if (current[i].url !== user.photos[i].url) return true
    }
    return false
  }, [photos, user?.photos])

  const pickPhoto = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    })
    if (!result.canceled && result.assets[0].base64) {
      const updated = [...photos]
      const mimeType = result.assets[0].uri.endsWith('.png') ? 'image/png' : 'image/jpeg'
      updated[index] = { url: `data:${mimeType};base64,${result.assets[0].base64}`, status: 'pending' }
      setPhotos(updated)
    }
  }

  const removePhoto = (index: number) => {
    const updated = [...photos]
    updated[index] = null
    
    // Shift empty slots to the end
    const filtered = updated.filter(Boolean)
    if (filtered.length < 1) {
      useAlertStore.getState().showAlert('Hata', 'En az 1 fotoğrafınız olmalı.')
      return
    }
    const newPhotos = [...filtered, ...Array(6 - filtered.length).fill(null)]
    setPhotos(newPhotos)
  }

  const makeMain = (index: number) => {
    const updated = [...photos]
    const temp = updated[0]
    updated[0] = updated[index]
    updated[index] = temp
    setPhotos(updated)
  }

  const handleSave = async () => {
    const filledPhotos = photos.filter(Boolean)
    if (filledPhotos.length < 1) {
      useAlertStore.getState().showAlert('Hata', 'En az 1 fotoğrafınız olmalı.')
      return
    }

    setLoading(true)
    try {
      const photoData = filledPhotos.map(p => ({ url: p!.url, status: p!.status }))
      await api.updateProfile({ photos: photoData as any })
      await loadSession()
      router.back()
    } catch (err) {
      console.log('Error updating photos', err)
      useAlertStore.getState().showAlert('Hata', 'Fotoğraflar güncellenirken bir hata oluştu.')
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
        <Text style={styles.headerTitle}>Fotoğraflar</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading || !hasChanges}>
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={[styles.saveText, !hasChanges && { opacity: 0.5 }]}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.hintText}>
          En iyi fotoğraflarını seç. İnsanlar ilk olarak ana fotoğrafını görecek.
        </Text>

        <View style={styles.grid}>
          {photos.map((photo, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.photoSlot, i === 0 && styles.mainSlot, photo && styles.photoSlotFilled]}
              onPress={() => pickPhoto(i)}
              activeOpacity={0.8}
            >
              {photo ? (
                <>
                  <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  
                  {photo.status === 'pending' && (
                    <View style={styles.pendingOverlay}>
                      <Ionicons name="time-outline" size={32} color="#fff" />
                      <Text style={styles.pendingText}>Onay Bekliyor</Text>
                    </View>
                  )}

                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Ana Fotoğraf</Text>
                    </View>
                  )}
                  
                  {i > 0 && photo.status === 'approved' && (
                    <TouchableOpacity
                      style={styles.makeMainBtn}
                      onPress={() => makeMain(i)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="star" size={14} color="#fff" />
                      <Text style={styles.makeMainText}>Ana Yap</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removePhoto(i)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.plusIcon}>+</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
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
  
  content: { padding: Spacing.xl },
  hintText: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  photoSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE * 1.35,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSlot: {
    width: SLOT_SIZE * 2 + Spacing.md,
    height: (SLOT_SIZE * 2 + Spacing.md) * 1.35,
  },
  photoSlotFilled: { borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)' },
  emptySlot: { alignItems: 'center', justifyContent: 'center' },
  plusIcon: { fontSize: 32, color: Colors.textMuted },
  
  mainBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  mainBadgeText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  
  makeMainBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  makeMainText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },

  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pendingText: { color: '#fff', fontSize: FontSize.sm, fontWeight: 'bold' },

  deleteBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(235,87,87,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  }
})
