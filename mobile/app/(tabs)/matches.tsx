import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../store/auth'
import { useMatchesStore, Match } from '../../store/matches'
import { api } from '../../api/client'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { Ionicons } from '@expo/vector-icons'
import { ApprovalGuard } from '../../components/ApprovalGuard'

export default function MatchesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const { matches, setMatches } = useMatchesStore()
  const [loading, setLoading] = useState(matches.length === 0)
  const [refreshing, setRefreshing] = useState(false)

  const loadMatches = useCallback(async () => {
    try {
      const { data } = await api.getMatches()
      setMatches(data.matches || [])
    } catch (err) {
      console.error('Eşleşmeler yüklenemedi:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [setMatches])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMatches()
  }

  // Eşleşmeleri iki gruba ayıralım: Yeni eşleşmeler (mesajlaşılmamış) ve mesajlar
  const newMatches = matches.filter(m => !m.messages || m.messages.length === 0)
  
  // Mesajları son mesaj tarihine göre sıralayalım
  const messageMatches = matches
    .filter(m => m.messages && m.messages.length > 0)
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime()
      const dateB = new Date(b.updatedAt || 0).getTime()
      return dateB - dateA
    })

  const getOtherUser = (match: Match, currentId: string) => {
    return match.user1Id === currentId ? match.user2 : match.user1
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <ApprovalGuard>
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </ApprovalGuard>
    )
  }

  return (
    <ApprovalGuard>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mesajlar</Text>
          <View style={styles.matchCount}>
            <Text style={styles.matchCountText}>{matches.length}</Text>
          </View>
        </View>

        {/* Kör Randevu Banner */}
        <TouchableOpacity style={styles.blindDateBanner} onPress={() => router.push('/blind-date')} activeOpacity={0.9}>
          <LinearGradient colors={['#9B51E0', '#6A00F4']} style={styles.blindDateGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
            <View style={styles.blindDateContent}>
              <View>
                <Text style={styles.blindDateTitle}>🔮 Kör Randevu</Text>
                <Text style={styles.blindDateSubtitle}>Dış görünüşü bırak, ruha odaklan.</Text>
              </View>
              <View style={styles.blindDateIcon}>
                <Ionicons name="eye-off" size={24} color="#9B51E0" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {matches.length === 0 ? (
          <View style={styles.empty}>
            <LinearGradient
              colors={[Colors.surface, 'rgba(232,82,106,0.1)']}
              style={styles.emptyIconWrapper}
            >
              <Text style={styles.emptyIcon}>♥</Text>
            </LinearGradient>
            <Text style={styles.emptyTitle}>Sessizlik hakim...</Text>
            <Text style={styles.emptySubtitle}>{"Bağlantılarını bulmak ve eşleşmek için Keşfet'te kaydırmaya devam et!"}</Text>
          </View>
        ) : (
          <FlatList
            data={matches.filter(m => m.messages && m.messages.length > 0)}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMatches() }} tintColor={Colors.primary} />}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={() => {
              const newMatches = matches.filter(m => !m.messages || m.messages.length === 0)
              if (newMatches.length === 0) return null

              return (
                <View style={styles.newMatchesSection}>
                  <Text style={styles.sectionTitle}>Yeni Eşleşmeler</Text>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={newMatches}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.newMatchesList}
                    renderItem={({ item }) => {
                      const other = getOtherUser(item, currentUser?.id || '')
                      const photo = other?.photos?.[0]?.url
                      return (
                        <TouchableOpacity 
                          style={styles.newMatchItem}
                          onPress={() => router.push(`/(tabs)/chat/${item.id}`)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.newMatchAvatarWrapper}>
                            {photo ? (
                              <Image source={{ uri: photo }} style={styles.newMatchAvatar} contentFit="cover" />
                            ) : (
                              <View style={[styles.newMatchAvatar, styles.avatarPlaceholder]}>
                                <Text style={{ fontSize: 24 }}>👤</Text>
                              </View>
                            )}
                            <View style={styles.newMatchBadge} />
                          </View>
                          <Text style={styles.newMatchName} numberOfLines={1}>
                            {other?.profile?.name?.split(' ')[0] || 'Kullanıcı'}
                          </Text>
                        </TouchableOpacity>
                      )
                    }}
                  />
                </View>
              )
            }}
            renderItem={({ item }) => {
              const other = getOtherUser(item, currentUser?.id || '')
              const photo = other?.photos?.[0]?.url
              const lastMsg = item.messages?.[0]
              const hasUnread = lastMsg && !lastMsg.isRead && lastMsg.senderId !== currentUser?.id

              return (
                <TouchableOpacity
                  style={styles.matchItem}
                  onPress={() => router.push(`/(tabs)/chat/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarWrapper}>
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.avatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={{ fontSize: 24 }}>👤</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.matchInfo}>
                    <View style={styles.matchTopRow}>
                      <Text style={[styles.matchName, hasUnread && styles.matchNameUnread]}>
                        {other?.profile?.name || 'Kullanıcı'}
                      </Text>
                      {lastMsg && (
                        <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                          {formatTime(item.updatedAt)}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.matchBottomRow}>
                      <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
                        {lastMsg ? (lastMsg.senderId === currentUser?.id ? `Sen: ${lastMsg.content}` : lastMsg.content) : '✦ Yeni eşleşme! İlk adımı at 👋'}
                      </Text>
                      
                      {hasUnread && (
                        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>1</Text>
                        </LinearGradient>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>
    </ApprovalGuard>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  matchCount: { backgroundColor: 'rgba(232,82,106,0.1)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(232,82,106,0.3)' },
  matchCountText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  
  blindDateBanner: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow },
  blindDateGradient: { padding: Spacing.md },
  blindDateContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blindDateTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 4 },
  blindDateSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
  blindDateIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxxl, paddingBottom: 100 },
  emptyIconWrapper: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.glow
  },
  emptyIcon: { fontSize: 48, color: Colors.primary },
  emptyTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  
  list: { paddingVertical: Spacing.sm },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginLeft: 84 },
  
  matchItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.lg,
  },
  avatarWrapper: { position: 'relative', marginRight: Spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: Colors.border },
  avatarPlaceholder: { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  
  matchInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  matchTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  matchName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  matchNameUnread: { color: '#fff', fontWeight: FontWeight.extrabold },
  time: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  timeUnread: { color: Colors.primary, fontWeight: FontWeight.bold },
  
  matchBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, paddingRight: Spacing.md },
  lastMessageUnread: { color: '#fff', fontWeight: FontWeight.bold },
  
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  
  newMatchesSection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  newMatchesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  newMatchItem: {
    alignItems: 'center',
    width: 72,
  },
  newMatchAvatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  newMatchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  newMatchBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  newMatchName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  }
})
