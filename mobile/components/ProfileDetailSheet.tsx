import { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Pressable,
  Linking,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import { api } from '../api/client'
import { useAlertStore } from '../store/alertStore'
import { useAuthStore } from '../store/auth'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

function calcInterestMatch(
  myInterests: string[],
  theirInterests: string[]
): number | null {
  if (!myInterests?.length || !theirInterests?.length) return null

  const mySet = new Set(myInterests.map(i => i.toLowerCase()))

  const common = theirInterests.filter(i =>
    mySet.has(i.toLowerCase())
  ).length

  const union = new Set([
    ...myInterests.map(i => i.toLowerCase()),
    ...theirInterests.map(i => i.toLowerCase()),
  ]).size

  return Math.round((common / union) * 100)
}

interface Photo {
  url: string
}

interface Profile {
  name?: string
  birthDate?: string
  bio?: string
  occupation?: string
  city?: string
  district?: string
  interests?: string[]
  gender?: string
  prompts?: any
}

interface User {
  id: string
  isFaceVerified?: boolean
  profile?: Profile
  photos?: Photo[]
}

interface Props {
  user: User | null
  visible: boolean
  onClose: () => void
  onLike?: () => Promise<void> | void
  isLiked?: boolean
  hasLikedMe?: boolean
}

export function ProfileDetailSheet({
  user,
  visible,
  onClose,
  onLike,
  isLiked,
  hasLikedMe,
}: Props) {
  const insets = useSafeAreaInsets()
  const authUser = useAuthStore(s => s.user)

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current
  const headerOpacity = useRef(new Animated.Value(0)).current

  const [activePhoto, setActivePhoto] = useState(0)
  const [fullUser, setFullUser] = useState<any>(null)

  useEffect(() => {
    if (visible && user?.id) {
      setFullUser(null)
      api.getProfile(user.id).then(res => {
         if (res.data?.user) setFullUser(res.data.user)
         else if (res.data) setFullUser(res.data)
      }).catch(() => {})
    }
  }, [visible, user?.id])
  const photoScrollRef = useRef<ScrollView>(null)
  const [autoSlideEnabled, setAutoSlideEnabled] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const handAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (showTutorial) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(handAnim, { toValue: 50, duration: 800, useNativeDriver: true }),
          Animated.timing(handAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start()
    }
  }, [showTutorial])

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem('profile_tutorial_seen').then(val => {
        if (!val) setShowTutorial(true)
      })
      setAutoSlideEnabled(true)
    }
  }, [visible])

  useEffect(() => {
    let timer: any
    if (visible && autoSlideEnabled && (fullUser?.photos?.length || user?.photos?.length || 0) > 1) {
      timer = setInterval(() => {
        setActivePhoto(prev => {
          const next = (prev + 1) % (fullUser?.photos?.length || user?.photos?.length || 1)
          photoScrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true })
          return next
        })
      }, 3000)
    }
    return () => clearInterval(timer)
  }, [visible, autoSlideEnabled, (fullUser?.photos?.length || user?.photos?.length || 0)])

  const stopAutoSlide = () => {
    if (autoSlideEnabled) setAutoSlideEnabled(false)
    if (showTutorial) {
      setShowTutorial(false)
      AsyncStorage.setItem('profile_tutorial_seen', 'true')
    }
  }

  const [showReportModal, setShowReportModal] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [liking, setLiking] = useState(false)
  const [reportImages, setReportImages] = useState<string[]>([])

  const pickReportImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled && result.assets[0]?.base64) {
      const mimeType = result.assets[0].uri.endsWith('.png')
        ? 'image/png'
        : 'image/jpeg'

      const base64Data = `data:${mimeType};base64,${result.assets[0].base64}`

      if (reportImages.length < 3) {
        setReportImages(prev => [...prev, base64Data])
      } else {
        useAlertStore
          .getState()
          .showAlert(
            'Uyarı',
            'En fazla 3 görsel ekleyebilirsiniz.'
          )
      }
    }
  }

  const removeReportImage = (index: number) => {
    setReportImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleReport = async (reason: string) => {
    if (!user) return

    setReporting(true)

    try {
      await api.reportUser(user.id, reason, '', reportImages)

      setShowReportModal(false)
      setReportImages([])

      useAlertStore
        .getState()
        .showAlert(
          'Teşekkürler',
          'Kullanıcı moderasyon ekibimize bildirildi.'
        )
    } catch {
      useAlertStore
        .getState()
        .showAlert(
          'Hata',
          'Kullanıcı bildirilemedi. Lütfen tekrar deneyin.'
        )
    } finally {
      setReporting(false)
    }
  }

  useEffect(() => {
    if (visible) {
      setActivePhoto(0)

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          stiffness: 180,
          mass: 0.8,
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  if (!user) return null

  const displayUser = fullUser || user
  const photos = displayUser.photos || []
  const profile = displayUser.profile

  const age = profile?.birthDate
    ? Math.floor(
        (Date.now() - new Date(profile.birthDate).getTime()) /
          31557600000
      )
    : null

  const location = [profile?.city, profile?.district]
    .filter(Boolean)
    .join(', ')

  const prompts = profile?.prompts || {}
  const song = prompts.song
  const answers = prompts.answers || {}

  const matchScore = calcInterestMatch(
    authUser?.profile?.interests || [],
    profile?.interests || []
  )

  const handleSongPress = () => {
    if (!song) return

    const query = encodeURIComponent(
      `${song.title} ${song.artist}`
    )

    Linking.openURL(
      `https://open.spotify.com/search/${query}`
    ).catch(() => {
      useAlertStore
        .getState()
        .showAlert('Hata', 'Bağlantı açılamadı.')
    })
  }

  const promptItems = [
    {
      question: 'Şu konuda biraz iddialıyım...',
      answer: answers.q1,
      icon: 'sparkles-outline',
    },
    {
      question: 'Beni en çok güldüren şey...',
      answer: answers.q2,
      icon: 'happy-outline',
    },
    {
      question: 'Birlikte yaparsak çok eğleniriz...',
      answer: answers.q3,
      icon: 'flame-outline',
    },
    {
      question: 'İlişkide en çok değer verdiğim şey...',
      answer: answers.q4,
      icon: 'heart-outline',
    },
    {
      question: 'Beni etkilemek istiyorsan...',
      answer: answers.q5,
      icon: 'flash-outline',
    },
  ]

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
        {/* INFINITY GLOW BACKGROUND */}
        {photos[activePhoto]?.url && (
          <View style={StyleSheet.absoluteFill}>
            <Image 
              source={{ uri: photos[activePhoto].url }}
              style={{ width: '100%', height: '100%', opacity: 0.6 }}
              contentFit="cover"
              blurRadius={85}
              transition={400}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,7,11,0.70)' }]} />
            <LinearGradient
              colors={['transparent', '#050408']}
              style={StyleSheet.absoluteFill}
              locations={[0.2, 1]}
            />
          </View>
        )}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{
          paddingBottom: insets.bottom + 130,
        }}
        scrollEventThrottle={16}
        onScrollBeginDrag={stopAutoSlide}
      >
        {/* HERO PHOTO */}
        <View style={styles.hero}>
          {photos.length > 0 ? (
            <ScrollView
              ref={photoScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScrollBeginDrag={stopAutoSlide}
              onScroll={e => {
                const x = e.nativeEvent.contentOffset.x
                setActivePhoto(
                  Math.round(x / SCREEN_W)
                )
              }}
              scrollEventThrottle={16}
              style={{ width: SCREEN_W, height: SCREEN_H * 0.72 }}
            >
              {photos.map((photo: any, index: number) => (
                <Image
                  key={`${photo.url}-${index}`}
                  source={{ uri: photo.url }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={250}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPhoto}>
              <Ionicons
                name="person"
                size={70}
                color="rgba(255,255,255,0.15)"
              />
            </View>
          )}

                    {/* TUTORIAL OVERLAY */}
          {showTutorial && (
            <View style={styles.tutorialOverlay} pointerEvents="none">
              <Animated.View style={[styles.tutorialHand, { transform: [{ translateY: handAnim }] }]}> 
                 <Text style={{fontSize: 60}}>👆</Text>
              </Animated.View>
              <Text style={styles.tutorialText}>Otomatik kaymayı durdurmak için kaydırın</Text>
            </View>
          )}

          {/* DARK CINEMATIC GRADIENT */}
          <LinearGradient
            colors={[
              'rgba(5,4,8,0.50)',
              'transparent',
              'rgba(5,4,8,0.3)',
              'rgba(5,4,8,1)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* TOP CONTROLS */}
          <Animated.View
            style={[
              styles.heroHeader,
              {
                opacity: headerOpacity,
                paddingTop: insets.top + 10,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chevron-down"
                size={25}
                color="#fff"
              />
            </TouchableOpacity>

            <View style={styles.heroHeaderRight}>
              {user.isFaceVerified && (
                <View style={styles.verifiedPill}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.verifiedText}>
                    Doğrulanmış
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.floatingButton}
                onPress={() =>
                  setShowReportModal(true)
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={23}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* PHOTO INDICATORS */}
          {(fullUser?.photos?.length || user?.photos?.length || 0) > 1 && (
            <View style={styles.photoIndicators}>
              {photos.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.photoIndicator,
                    index === activePhoto && styles.photoIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* HERO PROFILE INFO */}
          <View style={styles.heroInfo}>
            {matchScore !== null &&
              matchScore >= 20 && (
                <View style={styles.matchPill}>
                  <View style={styles.matchDot} />

                  <Text style={styles.matchPillText}>
                    %{matchScore} uyum
                  </Text>
                </View>
              )}

            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile?.name || 'İsimsiz'}
              </Text>

              {displayUser.isOnline && (
                <View style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.4)', marginLeft: 8 }}>
                  <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: 'bold' }}>Çevrimiçi</Text>
                </View>
              )}

              {age !== null && (
                <Text style={styles.age}>
                  {age}
                </Text>
              )}

              {user.isFaceVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={27}
                  color="#FF5C8A"
                />
              )}
            </View>

            {location ? (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />

                <Text style={styles.locationText}>
                  {location}
                </Text>
              </View>
            ) : null}

            {profile?.occupation ? (
              <View style={styles.occupationRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={15}
                  color="rgba(255,255,255,0.65)"
                />

                <Text style={styles.occupationText}>
                  {profile.occupation}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* SEAMLESS FADE TO GLOW */}
        <LinearGradient
          colors={['rgba(5,4,8,1)', 'transparent']}
          style={{ position: 'absolute', top: SCREEN_H * 0.72 - 1, left: 0, right: 0, height: 120 }}
          pointerEvents="none"
        />

        {/* MAIN CONTENT */}
        <View style={styles.content}>
          {/* QUICK STATS */}
          <View style={styles.quickStats}>
            <View style={styles.stat}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>

              <View>
                <Text style={styles.statTitle}>
                  Uyum
                </Text>

                <Text style={styles.statValue}>
                  {matchScore !== null
                    ? `%${matchScore}`
                    : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>

              <View>
                <Text style={styles.statTitle}>
                  İlgi
                </Text>

                <Text style={styles.statValue}>
                  {profile?.interests?.length || 0}
                </Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="images-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>

              <View>
                <Text style={styles.statTitle}>
                  Fotoğraf
                </Text>

                <Text style={styles.statValue}>
                  {photos.length}
                </Text>
              </View>
            </View>
          </View>

          {/* ABOUT */}
          {profile?.bio ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.titleAccent} />

                  <Text style={styles.sectionTitle}>
                    Hakkında
                  </Text>
                </View>
              </View>

              <Text style={styles.bio}>
                {profile.bio}
              </Text>
            </View>
          ) : null}

          {/* MUSIC */}
          {song ? (
            <Pressable
              onPress={handleSongPress}
              style={({ pressed }) => [
                styles.musicCard,
                pressed && styles.musicCardPressed,
              ]}
            >
              <View style={styles.musicTop}>
                <View style={styles.musicLabel}>
                  <Ionicons
                    name="musical-notes"
                    size={15}
                    color="#fff"
                  />

                  <Text style={styles.musicLabelText}>
                    BENİM ŞARKIM
                  </Text>
                </View>

                <Ionicons
                  name="open-outline"
                  size={17}
                  color="rgba(255,255,255,0.55)"
                />
              </View>

              <View style={styles.musicBody}>
                {song.coverUrl ? (
                  <Image
                    source={{ uri: song.coverUrl }}
                    style={styles.musicCover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.musicCoverEmpty}>
                    <Ionicons
                      name="musical-notes"
                      size={22}
                      color="rgba(255,255,255,0.45)"
                    />
                  </View>
                )}

                <View style={styles.musicInfo}>
                  <Text
                    style={styles.songTitle}
                    numberOfLines={1}
                  >
                    {song.title}
                  </Text>

                  <Text
                    style={styles.songArtist}
                    numberOfLines={1}
                  >
                    {song.artist}
                  </Text>
                </View>

                <View style={styles.playButton}>
                  <Ionicons
                    name="play"
                    size={17}
                    color="#fff"
                  />
                </View>
              </View>
            </Pressable>
          ) : null}

          {/* PROMPTS */}
          {promptItems.some(item => item.answer) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.titleAccent} />

                  <Text style={styles.sectionTitle}>
                    Biraz daha yakından
                  </Text>
                </View>

                <Text style={styles.sectionSubTitle}>
                  Onu tanı
                </Text>
              </View>

              <View style={styles.prompts}>
                {promptItems.map(
                  (item, index) =>
                    item.answer && (
                      <View
                        key={index}
                        style={styles.promptCard}
                      >
                        <View style={styles.promptIcon}>
                          <Ionicons
                            name={item.icon as any}
                            size={18}
                            color={Colors.primary}
                          />
                        </View>

                        <View style={styles.promptContent}>
                          <Text style={styles.promptQuestion}>
                            {item.question}
                          </Text>

                          <Text style={styles.promptAnswer}>
                            {item.answer}
                          </Text>
                        </View>
                      </View>
                    )
                )}
              </View>
            </View>
          )}

          {/* INTERESTS */}
          {profile?.interests &&
            profile.interests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.titleAccent} />

                    <Text style={styles.sectionTitle}>
                      İlgi alanları
                    </Text>
                  </View>
                </View>

                <View style={styles.interests}>
                  {profile.interests.map(
                    (interest: string, index: number) => {
                      const myInterests =
                        authUser?.profile?.interests ||
                        []

                      const isShared =
                        myInterests.some(
                          (i: string) =>
                            i.toLowerCase() ===
                            interest.toLowerCase()
                        )

                      return (
                        <View
                          key={`${interest}-${index}`}
                          style={[
                            styles.interestChip,
                            isShared &&
                              styles.interestChipShared,
                          ]}
                        >
                          {isShared && (
                            <Ionicons
                              name="heart"
                              size={12}
                              color="#fff"
                            />
                          )}

                          <Text
                            style={[
                              styles.interestText,
                              isShared &&
                                styles.interestTextShared,
                            ]}
                          >
                            {interest}
                          </Text>
                        </View>
                      )
                    }
                  )}
                </View>
              </View>
            )}

          {/* BOTTOM LIKE */}
          {onLike && (
            <View style={styles.actionArea}>
              <TouchableOpacity
                activeOpacity={0.88}
                disabled={isLiked || liking}
                onPress={async () => {
                  if (!isLiked && onLike) {
                    setLiking(true)
                    try {
                      await onLike()
                    } catch (e) {} finally {
                      setLiking(false)
                    }
                  }
                }}
                style={styles.likeOuter}
              >
                <LinearGradient
                  colors={
                    isLiked
                      ? [
                          'rgba(255,255,255,0.10)',
                          'rgba(255,255,255,0.05)',
                        ]
                      : [
                          Colors.primary,
                          Colors.primaryDark,
                        ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.likeButton}
                >
                  <View style={styles.likeIcon}>
                    <Ionicons
                      name={
                        (isLiked && hasLikedMe) ? 'chatbubbles'
                        : isLiked ? 'time'
                        : 'heart'
                      }
                      size={21}
                      color="#fff"
                    />
                  </View>

                  <Text style={styles.likeText}>
                    {(isLiked && hasLikedMe)
                      ? 'Eşleştiniz! 🎉'
                      : isLiked 
                        ? 'Cevap Bekleniyor...'
                        : hasLikedMe 
                          ? (liking ? 'Eşleşiliyor...' : 'Seni Beğendi! Eşleş')
                          : (liking ? 'Gönderiliyor...' : 'Beğeni Gönder')}
                  </Text>

                  {!isLiked && (
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#fff"
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.actionHint}>
                İkiniz de birbirinizi beğenirseniz
                eşleşirsiniz.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* REPORT MODAL */}
      {showReportModal && (
        <View style={styles.reportOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() =>
              !reporting &&
              setShowReportModal(false)
            }
          />

          <View
            style={[
              styles.reportModal,
              {
                paddingBottom:
                  insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.reportHeader}>
              <View>
                <Text style={styles.reportTitle}>
                  Profili bildir
                </Text>

                <Text style={styles.reportDescription}>
                  Neden bildirmek istediğini seç.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={() =>
                  !reporting &&
                  setShowReportModal(false)
                }
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.reportImages}>
              {reportImages.map((uri, index) => (
                <View
                  key={index}
                  style={styles.reportImageWrap}
                >
                  <Image
                    source={{ uri }}
                    style={styles.reportImage}
                  />

                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() =>
                      removeReportImage(index)
                    }
                  >
                    <Ionicons
                      name="close"
                      size={13}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {reportImages.length < 3 && (
                <TouchableOpacity
                  style={styles.addImage}
                  onPress={pickReportImage}
                >
                  <Ionicons
                    name="add"
                    size={25}
                    color="rgba(255,255,255,0.55)"
                  />

                  <Text style={styles.addImageText}>
                    Görsel
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.reportOptions}>
              <TouchableOpacity
                disabled={reporting}
                style={styles.reportOption}
                onPress={() =>
                  handleReport('FAKE_PROFILE')
                }
              >
                <View style={styles.reportOptionIcon}>
                  <Ionicons
                    name="person-remove-outline"
                    size={20}
                    color={Colors.primary}
                  />
                </View>

                <View style={styles.reportOptionText}>
                  <Text style={styles.reportOptionTitle}>
                    Sahte profil
                  </Text>

                  <Text style={styles.reportOptionDesc}>
                    Başkasını taklit ediyor veya sahte
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(255,255,255,0.25)"
                />
              </TouchableOpacity>

              <TouchableOpacity
                disabled={reporting}
                style={styles.reportOption}
                onPress={() =>
                  handleReport(
                    'INAPPROPRIATE_CONTENT'
                  )
                }
              >
                <View style={styles.reportOptionIcon}>
                  <Ionicons
                    name="warning-outline"
                    size={20}
                    color={Colors.primary}
                  />
                </View>

                <View style={styles.reportOptionText}>
                  <Text style={styles.reportOptionTitle}>
                    Uygunsuz içerik
                  </Text>

                  <Text style={styles.reportOptionDesc}>
                    Topluluk kurallarını ihlal ediyor
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(255,255,255,0.25)"
                />
              </TouchableOpacity>

              <TouchableOpacity
                disabled={reporting}
                style={styles.reportOption}
                onPress={() =>
                  handleReport('HARASSMENT')
                }
              >
                <View style={styles.reportOptionIcon}>
                  <Ionicons
                    name="hand-left-outline"
                    size={20}
                    color={Colors.primary}
                  />
                </View>

                <View style={styles.reportOptionText}>
                  <Text style={styles.reportOptionTitle}>
                    Taciz veya zorbalık
                  </Text>

                  <Text style={styles.reportOptionDesc}>
                    Rahatsız edici davranış
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(255,255,255,0.25)"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              disabled={reporting}
              onPress={() =>
                setShowReportModal(false)
              }
            >
              <Text style={styles.cancelText}>
                Vazgeç
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 100,
    elevation: 100,
  },

  scroll: {
    flex: 1,
  },

  /* ─────────────────────────
     HERO
  ───────────────────────── */

  hero: {
    width: SCREEN_W,
    height: SCREEN_H * 0.72,
    position: 'relative',
    overflow: 'hidden',
  },

  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tutorialHand: {
    marginBottom: 20,
  },
  tutorialText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.72,
  },

  emptyPhoto: {
    width: SCREEN_W,
    height: SCREEN_H * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111016',
  },

  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,8,13,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  verifiedPill: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,92,138,0.88)',
  },

  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  photoIndicators: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  photoIndicator: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  photoIndicatorActive: {
    width: 32,
    backgroundColor: '#fff',
  },

  heroInfo: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 30,
  },

  matchPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 11,
    backgroundColor: 'rgba(255,92,138,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,138,0.35)',
  },

  matchDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF5C8A',
  },

  matchPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },

  name: {
    color: '#fff',
    fontSize: 39,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.2,
  },

  age: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
  },

  locationRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  locationText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontWeight: '500',
  },

  occupationRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  occupationText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    fontWeight: '500',
  },

  /* ─────────────────────────
     CONTENT
  ───────────────────────── */

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  quickStats: {
    minHeight: 78,
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121016',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 28,
  },

  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  statIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,92,138,0.09)',
  },

  statTitle: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  /* SECTION */

  section: {
    marginBottom: 29,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  titleAccent: {
    width: 3,
    height: 19,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  sectionSubTitle: {
    marginTop: 4,
    marginLeft: 12,
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
  },

  bio: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: -0.1,
  },

  /* MUSIC */

  musicCard: {
    marginBottom: 30,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#111015',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  musicCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },

  musicTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  musicLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  musicLabelText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  musicBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  musicCover: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },

  musicCoverEmpty: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B1820',
  },

  musicInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },

  songTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },

  songArtist: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 13,
    fontWeight: '500',
  },

  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },

  /* PROMPTS */

  prompts: {
    gap: 11,
  },

  promptCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#111015',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.065)',
  },

  promptIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,92,138,0.09)',
    marginRight: 13,
  },

  promptContent: {
    flex: 1,
  },

  promptQuestion: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 5,
  },

  promptAnswer: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },

  /* INTERESTS */

  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  interestChip: {
    minHeight: 37,
    paddingHorizontal: 13,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#131118',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  interestChipShared: {
    backgroundColor: 'rgba(255,92,138,0.13)',
    borderColor: 'rgba(255,92,138,0.32)',
  },

  interestText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },

  interestTextShared: {
    color: '#fff',
  },

  /* ACTION */

  actionArea: {
    marginTop: 4,
    alignItems: 'center',
  },

  likeOuter: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },

  likeButton: {
    minHeight: 64,
    paddingHorizontal: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },

  likeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },

  likeText: {
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },

  actionHint: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },

  /* ─────────────────────────
     REPORT
  ───────────────────────── */

  reportOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  reportModal: {
    backgroundColor: '#111015',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 22,
  },

  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  reportTitle: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 4,
  },

  reportDescription: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  reportImages: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  reportImageWrap: {
    position: 'relative',
  },

  reportImage: {
    width: 67,
    height: 67,
    borderRadius: 14,
  },

  removeImage: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF456F',
  },

  addImage: {
    width: 67,
    height: 67,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
  },

  addImageText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    marginTop: 2,
  },

  reportOptions: {
    gap: 8,
  },

  reportOption: {
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18161D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
  },

  reportOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,92,138,0.08)',
    marginRight: 12,
  },

  reportOptionText: {
    flex: 1,
  },

  reportOptionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },

  reportOptionDesc: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 11,
  },

  cancelButton: {
    height: 52,
    marginTop: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },

  cancelText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '700',
  },
})