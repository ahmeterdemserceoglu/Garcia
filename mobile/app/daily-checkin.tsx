import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../api/client'
import { Colors } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import AsyncStorage from '@react-native-async-storage/async-storage'

const REWARDS = [
  { day: 1, reward: '1 Süper Beğeni', icon: 'star' as const, color: '#F5C518', count: 1 },
  { day: 2, reward: '1 Boost', icon: 'rocket' as const, color: '#A78BFA', count: 1 },
  { day: 3, reward: '2 Süper Beğeni', icon: 'star' as const, color: '#F5C518', count: 2 },
  { day: 4, reward: '3 Süper Beğeni', icon: 'star' as const, color: '#F5C518', count: 3 },
  { day: 5, reward: '1 Günlük Premium', icon: 'diamond' as const, color: '#4DD9E8', count: 1 },
  { day: 6, reward: '2 Boost', icon: 'rocket' as const, color: '#A78BFA', count: 2 },
  { day: 7, reward: '3 Günlük Premium', icon: 'diamond' as const, color: '#4DD9E8', count: 3 },
]

export default function DailyCheckinScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(1)
  const [activeRewardIndex, setActiveRewardIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0]
        const lastCheckinDate = await AsyncStorage.getItem('garcia_last_checkin_date')
        const savedStreak = await AsyncStorage.getItem('garcia_checkin_streak')

        if (savedStreak) {
          const streak = parseInt(savedStreak, 10) || 1
          setCurrentStreak(streak)
          setActiveRewardIndex((streak - 1) % REWARDS.length)
        }

        if (lastCheckinDate === todayStr) {
          setClaimed(true)
        }
      } catch {
        // Check-in ekranı yerel kayıt okunamasa da kullanılabilir kalır.
      }
    })()
  }, [])

  const handleCheckin = async () => {
    setClaiming(true)
    const todayStr = new Date().toISOString().split('T')[0]
    const oldStreak = currentStreak

    try {
      const { data } = await api.dailyCheckin()
      const newStreak = data?.streak || oldStreak
      setCurrentStreak(newStreak)
      setActiveRewardIndex((oldStreak - 1) % REWARDS.length)
      setClaimed(true)
      await AsyncStorage.setItem('garcia_last_checkin_date', todayStr)
      await AsyncStorage.setItem('garcia_checkin_streak', String(newStreak))
    } catch (e: any) {
      if (e?.response?.status === 400) {
        setError('Bugünkü ödülün zaten hesabına eklendi.')
        setClaimed(true)
        await AsyncStorage.setItem('garcia_last_checkin_date', todayStr)
        setActiveRewardIndex((oldStreak - 1) % REWARDS.length)
      } else {
        const nextStreak = oldStreak < REWARDS.length ? oldStreak + 1 : 1
        setCurrentStreak(nextStreak)
        setActiveRewardIndex((oldStreak - 1) % REWARDS.length)
        setClaimed(true)
        await AsyncStorage.setItem('garcia_last_checkin_date', todayStr)
        await AsyncStorage.setItem('garcia_checkin_streak', String(nextStreak))
      }
    } finally {
      setClaiming(false)
    }
  }

  const todayIndex = activeRewardIndex
  const activeReward = REWARDS[todayIndex]
  const completedDays = claimed ? todayIndex + 1 : todayIndex

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#21131D', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.topGlow} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#EC6B7D', '#D94F69', '#9C3454']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View pointerEvents="none" style={styles.heroGlowLarge} />
            <View pointerEvents="none" style={styles.heroGlowSmall} />

            <View style={styles.heroTopRow}>
              <View style={styles.heroLabel}>
                <Ionicons name="flame" size={14} color="#FFE2E7" />
                <Text style={styles.heroLabelText}>GÜNLÜK SERİ</Text>
              </View>
              <View style={styles.streakPill}>
                <Text style={styles.streakPillValue}>{currentStreak}</Text>
                <Text style={styles.streakPillText}>GÜN</Text>
              </View>
            </View>

            <View style={styles.heroMainRow}>
              <View style={styles.flameBadge}>
                <Ionicons name="flame" size={38} color="#FFF5F7" />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Serini canlı tut</Text>
                <Text style={styles.heroSubtitle}>Her gün geldiğinde daha değerli bir ödül seni bekliyor.</Text>
              </View>
            </View>

            <View style={styles.heroRewardCard}>
              <View style={[styles.heroRewardIcon, { backgroundColor: activeReward.color + '32' }]}>
                <Ionicons name={activeReward.icon} size={22} color={activeReward.color} />
              </View>
              <View style={styles.heroRewardCopy}>
                <Text style={styles.heroRewardEyebrow}>{claimed ? 'BUGÜNKÜ ÖDÜL ALINDI' : 'BUGÜN SENİ BEKLİYOR'}</Text>
                <Text style={styles.heroRewardTitle}>{activeReward.reward}</Text>
              </View>
              <Ionicons name={claimed ? 'checkmark-circle' : 'gift-outline'} size={24} color="#FFF" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.journeyCard}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>7 günlük yolculuk</Text>
              <Text style={styles.sectionSubtitle}>Her gün yeni bir avantaj açılır.</Text>
            </View>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>HAFTA 1</Text>
            </View>
          </View>

          <View style={styles.journeyTrack}>
            {REWARDS.map((item, index) => {
              const isComplete = index < completedDays
              const isToday = index === todayIndex
              const connectorComplete = index < completedDays - 1

              return (
                <View key={item.day} style={styles.journeyStep}>
                  {index < REWARDS.length - 1 && (
                    <View style={[styles.journeyConnector, connectorComplete && styles.journeyConnectorComplete]} />
                  )}
                  <View
                    style={[
                      styles.journeyNode,
                      isComplete && styles.journeyNodeComplete,
                      isToday && !claimed && styles.journeyNodeToday,
                    ]}
                  >
                    {isComplete ? (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    ) : isToday ? (
                      <Ionicons name="gift" size={15} color="#FFF" />
                    ) : (
                      <Text style={styles.journeyNodeNumber}>{item.day}</Text>
                    )}
                  </View>
                  <Text style={[styles.journeyDay, isToday && styles.journeyDayToday]}>G{item.day}</Text>
                </View>
              )
            })}
          </View>
        </View>

        <View style={styles.rewardsSection}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Ödül takvimi</Text>
              <Text style={styles.sectionSubtitle}>Serini bozma, büyük ödüllere ulaş.</Text>
            </View>
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
          </View>

          <View style={styles.rewardGrid}>
            {REWARDS.map((item, index) => {
              const isToday = index === todayIndex
              const isPast = index < completedDays
              const isLastReward = index === REWARDS.length - 1
              const statusLabel = isPast ? 'ALINDI' : isToday ? 'BUGÜN' : `GÜN ${item.day}`
              const tileContent = (
                <>
                  <View style={styles.rewardTileTop}>
                    <View style={[styles.rewardIcon, { backgroundColor: item.color + '1F' }]}>
                      <Ionicons name={item.icon} size={24} color={item.color} />
                    </View>
                    {isPast ? (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                    ) : isToday ? (
                      <View style={styles.todayDot} />
                    ) : (
                      <Ionicons name="lock-closed" size={17} color={Colors.textMuted} />
                    )}
                  </View>
                  <Text style={[styles.rewardStatus, isToday && styles.rewardStatusToday]}>{statusLabel}</Text>
                  <Text style={styles.rewardName}>{item.reward}</Text>
                  {item.count > 1 && (
                    <View style={[styles.rewardCount, { borderColor: item.color + '66' }]}>
                      <Text style={[styles.rewardCountText, { color: item.color }]}>x{item.count}</Text>
                    </View>
                  )}
                </>
              )

              const tileStyle = [
                styles.rewardTile,
                isLastReward && styles.rewardTileWide,
                isPast && styles.rewardTilePast,
                isToday && styles.rewardTileToday,
              ]

              return isToday ? (
                <LinearGradient
                  key={item.day}
                  colors={['rgba(232,82,106,0.30)', 'rgba(232,82,106,0.10)']}
                  style={tileStyle}
                >
                  {tileContent}
                </LinearGradient>
              ) : (
                <View key={item.day} style={tileStyle}>
                  {isPast && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: item.color, opacity: 0.08, borderRadius: 16 }]} />
                  )}
                  {tileContent}
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        {error ? (
          <View style={styles.footerStatus}>
            <View style={styles.footerStatusIcon}>
              <Ionicons name="checkmark" size={19} color={Colors.success} />
            </View>
            <View style={styles.footerStatusCopy}>
              <Text style={styles.footerStatusTitle}>Bugünlük tamam</Text>
              <Text style={styles.footerStatusText}>{error}</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} style={styles.footerTextButton}>
              <Text style={styles.footerTextButtonLabel}>Kapat</Text>
            </TouchableOpacity>
          </View>
        ) : claimed ? (
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
            <LinearGradient
              colors={['#247B76', '#1B5B58']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.claimButton}
            >
              <View style={styles.claimButtonIcon}>
                <Ionicons name="checkmark" size={20} color="#FFF" />
              </View>
              <View style={styles.claimButtonCopy}>
                <Text style={styles.claimButtonTitle}>Ödül hesabına eklendi</Text>
                <Text style={styles.claimButtonSub}>Keşfetmeye devam et</Text>
              </View>
              <Ionicons name="arrow-forward" size={21} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleCheckin} disabled={claiming} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
            >
              <View style={styles.claimButtonIcon}>
                {claiming ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="gift" size={20} color="#FFF" />
                )}
              </View>
              <View style={styles.claimButtonCopy}>
                <Text style={styles.claimButtonTitle}>{claiming ? 'Ödül hazırlanıyor…' : 'Bugünkü ödülü al'}</Text>
                <Text style={styles.claimButtonSub}>{activeReward.reward}</Text>
              </View>
              {!claiming && <Ionicons name="arrow-forward" size={21} color="#FFF" />}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topGlow: {
    position: 'absolute',
    top: -160,
    alignSelf: 'center',
    width: 420,
    height: 320,
    borderRadius: 210,
    backgroundColor: 'rgba(232,82,106,0.14)',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 128,
  },
  heroCard: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  heroGradient: {
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  heroGlowLarge: {
    position: 'absolute',
    right: -72,
    top: -86,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroGlowSmall: {
    position: 'absolute',
    left: -30,
    bottom: -64,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(91,20,48,0.16)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroLabelText: {
    color: '#FFE2E7',
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  streakPillValue: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  streakPillText: {
    color: '#FFE7EB',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.6,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  flameBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#FFE4E9',
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 3,
    paddingRight: Spacing.sm,
  },
  heroRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(51,13,30,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.19)',
  },
  heroRewardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRewardCopy: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  heroRewardEyebrow: {
    color: '#FFDDE4',
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.8,
  },
  heroRewardTitle: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  journeyCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: Spacing.xl,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  weekBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(232,82,106,0.10)',
  },
  weekBadgeText: {
    color: Colors.primaryLight,
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.7,
  },
  journeyTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  journeyStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  journeyConnector: {
    position: 'absolute',
    zIndex: 0,
    top: 17,
    left: '59%',
    width: '84%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  journeyConnectorComplete: {
    backgroundColor: Colors.success,
  },
  journeyNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  journeyNodeComplete: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  journeyNodeToday: {
    backgroundColor: Colors.primary,
    borderColor: '#FFB1C0',
    shadowColor: Colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 5,
  },
  journeyNodeNumber: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  journeyDay: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    marginTop: 6,
  },
  journeyDayToday: {
    color: Colors.primaryLight,
  },
  rewardsSection: {
    marginBottom: Spacing.lg,
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  rewardTile: {
    width: '48.5%',
    minHeight: 132,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  rewardTileWide: {
    width: '100%',
    minHeight: 116,
  },
  rewardTilePast: {
    backgroundColor: 'rgba(78,205,196,0.045)',
    borderColor: 'rgba(78,205,196,0.16)',
  },
  rewardTileToday: {
    borderColor: 'rgba(255,156,177,0.75)',
    // Gölge özellikleri kaldırıldı (kare görünümün sebebi)
  },
  rewardTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFBAC7',
  },
  rewardStatus: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.8,
    marginTop: Spacing.md,
  },
  rewardStatusToday: {
    color: '#FFD1D9',
  },
  rewardName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    lineHeight: 20,
    marginTop: 3,
  },
  rewardCount: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: Spacing.sm,
  },
  rewardCountText: {
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
  },
  bottomAction: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(15,13,18,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  claimButton: {
    minHeight: 62,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  claimButtonDisabled: {
    opacity: 0.76,
  },
  claimButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  claimButtonCopy: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  claimButtonTitle: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  claimButtonSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  footerStatus: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(78,205,196,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.23)',
  },
  footerStatusIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78,205,196,0.14)',
  },
  footerStatusCopy: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  footerStatusTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  footerStatusText: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  footerTextButton: {
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  footerTextButtonLabel: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
})