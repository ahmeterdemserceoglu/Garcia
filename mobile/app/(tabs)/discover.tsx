import { useEffect, useRef, useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, Dimensions,
  TouchableOpacity, ActivityIndicator, Alert,
  Animated, PanResponder, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useDiscoverStore } from '../../store/discover'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/auth'
import { useAlertStore } from '../../store/alertStore'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import { api } from '../../api/client'
import { ApprovalGuard } from '../../components/ApprovalGuard'
import { StoriesCarousel } from '../../components/StoriesCarousel'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_W - Spacing.md * 2
const CARD_HEIGHT = SCREEN_H * 0.63
const SWIPE_THRESHOLD = 120
import { useRouter } from 'expo-router'
import { usePurchasesStore } from '../../store/usePurchasesStore'
import { ProfileDetailSheet } from '../../components/ProfileDetailSheet'

function calcInterestMatch(myInterests: string[], theirInterests: string[]): number | null {
  if (!myInterests?.length || !theirInterests?.length) return null
  const mySet = new Set(myInterests.map(i => i.toLowerCase()))
  const common = theirInterests.filter(i => mySet.has(i.toLowerCase())).length
  const union = new Set([...myInterests.map(i=>i.toLowerCase()), ...theirInterests.map(i=>i.toLowerCase())]).size
  return Math.round((common / union) * 100)
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { users, currentIndex, setCurrentIndex, isLoading, fetch, swipeRight, swipeLeft } = useDiscoverStore()
  const { user } = useAuthStore()
  const [showDetail, setShowDetail] = useState(false)
  const [showBoostModal, setShowBoostModal] = useState(false)
  const [showSuperMessage, setShowSuperMessage] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [superMessageText, setSuperMessageText] = useState('')
  const [boosting, setBoosting] = useState(false)
  const { purchasePackage, offerings } = usePurchasesStore()

  const position = useRef(new Animated.ValueXY()).current

  useEffect(() => {
    fetch()

    // Request location
    const updateLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({})
          await api.updateLocation(location.coords.latitude, location.coords.longitude, location.coords.accuracy || undefined)
        }
      } catch (err) {
        console.log('Location update failed', err)
      }
    }
    updateLocation()
  }, [user?.profile?.ageMin, user?.profile?.ageMax, user?.profile?.maxDistance])

  const currentUser = users[currentIndex]
  const nextUser = users[currentIndex + 1]

  const onSwipeComplete = useCallback(async (direction: 'right' | 'left', isSuperLike = false, note?: string) => {
    if (!currentUser) return

    position.setValue({ x: 0, y: 0 })

    if (direction === 'right') {
      try {
        const { data } = await api.likeUser(currentUser.id, isSuperLike, note)

        if (data.isMatch) {
          useAlertStore.getState().showAlert(
            "🎉 Eşleşme!",
            `Sen ve ${currentUser.profile?.name} birbirinizi beğendiniz!`,
            [
              { text: 'Sohbet Et', onPress: () => router.push(`/chat/${data.match.id}`) },
              { text: 'Keşfe Devam Et', style: 'cancel' }
            ]
          )
        }
      } catch (e: any) {
        if (e.message === 'LIMIT_REACHED') {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
          useAlertStore.getState().showAlert(
            "Limit Doldu",
            isSuperLike ? "Günlük Süper Beğeni limitin doldu! Sınırsız kaydırma için Premium'a geç." : "Günlük beğeni limitin doldu! Sınırsız beğeni için Premium'a geç.",
            [
              { text: 'Şimdi Değil', style: 'cancel' },
              { text: 'Premium Al', onPress: () => router.push('/premium') }
            ]
          )
          return
        }
      }
    } else {
      swipeLeft()
    }

    if (currentIndex >= users.length - 3) fetch()
  }, [currentUser, currentIndex, position, swipeRight, swipeLeft, fetch, router])

  const handleRewind = () => {
    if (currentIndex === 0) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
    setCurrentIndex(currentIndex - 1)
    position.setValue({ x: 0, y: 0 })
  }

  const handleBoost = async () => {
    if (!user?.isPremium) {
      setShowBoostModal(false)
      useAlertStore.getState().showAlert("Premium Gerekli", "Profilini öne çıkarmak için Premium üyeliğe sahip olman gerekiyor!", [
        { text: "Vazgeç", style: 'cancel' },
        { text: "Premium Al", onPress: () => router.push('/premium') }
      ])
      return
    }

    setBoosting(true)
    try {
      await api.boostProfile()
      setShowBoostModal(false)
      useAlertStore.getState().showAlert('🚀 Boost Aktif!', 'Profilin 30 dakika boyunca bölgende ilk sırada gösterilecek.', [{ text: 'Harika!' }])
    } catch (e: any) {
      setShowBoostModal(false)
      if (e.response?.status === 429) {
        useAlertStore.getState().showAlert('Hata', 'Günde sadece 1 kez öne çıkabilirsin. Yarın tekrar dene!')
      } else {
        useAlertStore.getState().showAlert('Hata', 'Boost işlemi sırasında bir hata oluştu.')
      }
    } finally {
      setBoosting(false)
    }
  }

  const forceSwipe = useCallback((direction: 'right' | 'left', isSuperLike = false, note?: string) => {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? SCREEN_W : -SCREEN_W, y: direction === 'right' ? -100 : 50 },
      duration: 300,
      useNativeDriver: false
    }).start(() => {
      onSwipeComplete(direction, isSuperLike, note)
    })
  }, [position, onSwipeComplete])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5
      },
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          forceSwipe('right')
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          forceSwipe('left')
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false
          }).start()
        }
      }
    })
  ).current

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
      outputRange: ['-8deg', '0deg', '8deg'],
      extrapolate: 'clamp'
    })
    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    }
  }

  const getNextCardStyle = () => {
    const scale = position.x.interpolate({
      inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
      outputRange: [1, 0.95, 1],
      extrapolate: 'clamp'
    })
    return { transform: [{ scale }] }
  }

  const likeOpacity = position.x.interpolate({
    inputRange: [20, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  })

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  })

  if (isLoading && users.length === 0) {
    return (
      <ApprovalGuard>
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </ApprovalGuard>
    )
  }

  if (users.length === 0 || currentIndex >= users.length) {
    return (
      <ApprovalGuard>
        <View style={[styles.container, styles.center, { paddingHorizontal: Spacing.xxxl }]}>
          <Ionicons name="planet-outline" size={64} color={Colors.textMuted} style={{ marginBottom: Spacing.xl }} />
          <Text style={styles.emptyTitle}>Kimse Kalmadı</Text>
          <Text style={styles.emptySubtitle}>Bölgendeki tüm profilleri inceledin. Mesafe ayarını genişleterek yeni kişilere ulaşabilirsin.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetch}>
            <Text style={styles.refreshBtnText}>Yenile</Text>
          </TouchableOpacity>
        </View>
      </ApprovalGuard>
    )
  }

  const mainPhoto = currentUser.photos?.[0]?.url
  const age = currentUser.profile?.birthDate
    ? Math.floor((Date.now() - new Date(currentUser.profile.birthDate).getTime()) / 31557600000)
    : null

  const matchScore = calcInterestMatch(user?.profile?.interests || [], currentUser.profile?.interests || [])

  return (
    <ApprovalGuard>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>GARCIA</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.boostBtn} onPress={() => setShowBoostModal(true)}>
              <Text style={{ fontSize: 18 }}>🚀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilterModal(true)}>
              <Ionicons name="options-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <StoriesCarousel />

        <View style={styles.cardStack}>
          {nextUser && (
            <Animated.View style={[styles.card, styles.cardBack, getNextCardStyle()]}>
              {nextUser.photos?.[0]?.url && (
                <Image source={{ uri: nextUser.photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              )}
            </Animated.View>
          )}

          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.card, getCardStyle()]}
          >
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={64} color={Colors.textMuted} />
              </View>
            )}

            <LinearGradient
              colors={['transparent', 'rgba(15,13,18,0.5)', 'rgba(15,13,18,0.95)']}
              style={styles.cardGradient}
            />

            <Animated.View style={[styles.stampContainer, styles.likeStampContainer, { opacity: likeOpacity }]}>
              <Text style={styles.likeStampText}>BEĞEN</Text>
            </Animated.View>

            <Animated.View style={[styles.stampContainer, styles.nopeStampContainer, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeStampText}>GEÇ</Text>
            </Animated.View>

            <View style={styles.cardInfo}>
              {matchScore !== null && matchScore >= 20 && (
                <LinearGradient
                  colors={[Colors.primary, '#9B51E0']}
                  style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>💫 %{matchScore} uyum</Text>
                </LinearGradient>
              )}
              <View style={styles.nameRow}>
                <Text style={styles.name}>{currentUser.profile?.name}</Text>
                {currentUser.isOnline && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#121015' }} />
                )}
                {age && <Text style={styles.age}>{age}</Text>}
                {currentUser.isFaceVerified && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
              </View>

              {currentUser.profile?.occupation && (
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.infoText}>{currentUser.profile.occupation}</Text>
                </View>
              )}

              {currentUser.profile?.bio && (
                <Text style={styles.bio} numberOfLines={2}>{currentUser.profile.bio}</Text>
              )}

              <View style={styles.chipsRow}>
                {currentUser.profile?.interests?.slice(0, 3).map((interest: string, i: number) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{interest}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.detailBtn}
                onPress={() => setShowDetail(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.detailBtnText}>Profili Gör</Text>
                <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <View style={styles.actions}>
          {/* Geri Al */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.rewindBtn]}
            onPress={handleRewind}
            activeOpacity={0.75}
          >
            <Ionicons
              name="arrow-undo"
              size={22}
              color={Colors.warning}
            />
          </TouchableOpacity>

          {/* Geç */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              forceSwipe('left')
            }}
            activeOpacity={0.75}
          >
            <Ionicons
              name="close"
              size={34}
              color={Colors.nope}
            />
          </TouchableOpacity>

          {/* Süper Beğeni */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.superlikeBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              setShowSuperMessage(true)
            }}
            activeOpacity={0.75}
          >
            <Ionicons
              name="star"
              size={27}
              color={Colors.superLike}
            />
          </TouchableOpacity>

          {/* Beğen */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.likeBtn]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              forceSwipe('right')
            }}
            activeOpacity={0.75}
          >
            <Ionicons
              name="heart"
              size={34}
              color={Colors.like}
            />
          </TouchableOpacity>
        </View>

        <ProfileDetailSheet
          user={currentUser as any}
          visible={showDetail}
          onClose={() => setShowDetail(false)}
        />

        <Modal visible={showBoostModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.boostIconWrapper}>
                <Ionicons name="rocket" size={48} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Profilini Öne Çıkar!</Text>
              <Text style={styles.modalDesc}>
                30 dakika boyunca bölgende en üst sıralarda yer al ve eşleşme şansını 10 kata kadar artır.
              </Text>
              <TouchableOpacity style={styles.modalBtn} onPress={handleBoost} disabled={boosting}>
                {boosting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Şimdi Öne Çık</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowBoostModal(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showSuperMessage} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderColor: Colors.superLike, borderWidth: 1, backgroundColor: '#1A1820' }]}>
              <View style={[styles.boostIconWrapper, { backgroundColor: 'rgba(52,152,219,0.2)' }]}>
                <Ionicons name="mail" size={40} color={Colors.superLike} />
              </View>
              <Text style={styles.modalTitle}>Süper Mesaj Gönder</Text>
              <Text style={styles.modalDesc}>
                Eşleşmeden önce direkt mesaj atarak dikkatini çek! Süper Mesajlar normal Beğenilere göre %400 daha fazla geri dönüş alır.
              </Text>

              <TextInput
                style={styles.superMessageInput}
                placeholder="Örn: O fotoğraftaki kahveci neresi?"
                placeholderTextColor={Colors.textMuted}
                value={superMessageText}
                onChangeText={setSuperMessageText}
                maxLength={140}
                multiline
              />

              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.superLike }]} onPress={() => {
                setShowSuperMessage(false)
                if (superMessageText.trim()) {
                  forceSwipe('right', true, superMessageText.trim())
                } else {
                  forceSwipe('right', true)
                }
                setSuperMessageText('')
              }}>
                <Text style={styles.modalBtnText}>Süper Beğeni Gönder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => {
                setShowSuperMessage(false)
                setSuperMessageText('')
              }}>
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Filter Modal */}
        <Modal visible={showFilterModal} transparent animationType="slide">
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0, backgroundColor: 'transparent' }]}>
            <View style={[styles.modalContent, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: Spacing.xl }} />
              <Text style={styles.modalTitle}>Filtreleme</Text>
              <Text style={styles.modalDesc}>Arama tercihlerini profil sayfandan yönetebilirsin.</Text>

              <TouchableOpacity style={styles.modalBtn} onPress={() => {
                setShowFilterModal(false)
                router.push('/settings/age-range')
              }}>
                <Text style={styles.modalBtnText}>Yaş Aralığını Değiştir</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => {
                setShowFilterModal(false)
                router.push('/settings/max-distance')
              }}>
                <Text style={styles.modalBtnText}>Maksimum Mesafeyi Ayarla</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCancelText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </ApprovalGuard>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 2 },
  headerRight: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  boostBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,166,35,0.1)', borderWidth: 1, borderColor: 'rgba(245,166,35,0.3)', alignItems: 'center', justifyContent: 'center', ...Shadows.glow },

  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    position: 'absolute',
    ...Shadows.lg,
  },
  cardBack: {
    opacity: 0.8,
  },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: CARD_HEIGHT * 0.5 },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.xl, gap: Spacing.sm },

  stampContainer: {
    position: 'absolute',
    top: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 4,
    transform: [{ rotate: '-15deg' }],
  },
  likeStampContainer: {
    left: Spacing.xl,
    borderColor: Colors.like,
    transform: [{ rotate: '-15deg' }],
  },
  likeStampText: {
    color: Colors.like,
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 2,
  },
  nopeStampContainer: {
    right: Spacing.xl,
    borderColor: Colors.nope,
    transform: [{ rotate: '15deg' }],
  },
  nopeStampText: {
    color: Colors.nope,
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 2,
  },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  chip: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  chipText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: 36, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5 },
  age: { fontSize: 28, fontWeight: FontWeight.medium, color: '#fff' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  infoText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.medium },

  bio: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.65)', lineHeight: 22, marginTop: Spacing.xs },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },

  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },

  rewindBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderColor: 'rgba(245,166,35,0.25)',
  },

  passBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,75,105,0.08)',
    borderColor: 'rgba(255,75,105,0.28)',
  },

  superlikeBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(52,152,219,0.09)',
    borderColor: 'rgba(52,152,219,0.28)',
  },

  likeBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,45,120,0.13)',
    borderColor: 'rgba(255,45,120,0.40)',
    shadowColor: Colors.like,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center' },
  boostIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(155,81,224,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  modalDesc: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  superMessageInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: Colors.textPrimary, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, minHeight: 80, textAlignVertical: 'top', marginBottom: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalBtn: { width: '100%', height: 50, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  modalBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  modalCancel: { padding: Spacing.md },
  modalCancelText: { color: Colors.textMuted, fontWeight: 'bold' },

  emptyTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  refreshBtn: { marginTop: Spacing.xxl, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, ...Shadows.glow },
  refreshBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.md, letterSpacing: 1 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  detailBtnText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
})
