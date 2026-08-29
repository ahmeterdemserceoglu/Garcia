import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../api/client'
import { useAlertStore } from '../../store/alertStore'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

interface Event {
  id: string
  title: string
  description: string
  city: string
  address: string
  startDate: string
  endDate: string
  maxAttendees: number | null
  _count: { attendees: number }
  creator: { profile: { name: string } }
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [attending, setAttending] = useState<Record<string, 'going' | 'interested' | 'not_going'>>({})

  const fetchEvents = async () => {
    try {
      const res = await api.getEvents()
      setEvents(res.data.events || [])
    } catch (e) {
      console.error('Failed to fetch events', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleAttend = async (eventId: string, status: 'going' | 'interested') => {
    setAttending(prev => ({ ...prev, [eventId]: status }))
    try {
      await api.attendEvent(eventId, status)
    } catch (e) {
      useAlertStore.getState().showAlert('Hata', 'Katılım durumu güncellenemedi.')
      setAttending(prev => {
        const next = { ...prev }
        delete next[eventId]
        return next
      })
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const renderHeader = () => (
    <TouchableOpacity style={styles.speedDatingBanner} onPress={() => router.push('/speed-dating')} activeOpacity={0.9}>
      <LinearGradient colors={['#FF0055', '#4A00E0']} style={styles.speedDatingGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.speedDatingContent}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>ŞU AN CANLI</Text>
            </View>
            <Text style={styles.speedDatingTitle}>Geceyarısı Ekspresi: Hızlı Flört</Text>
            <Text style={styles.speedDatingSubtitle}>3 dakikan var. Karşına rastgele biri çıkacak. Etkile ya da kaybet.</Text>
          </View>
          <View style={styles.speedDatingIconWrapper}>
            <Ionicons name="videocam" size={32} color="#FF0055" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  const renderItem = ({ item }: { item: Event }) => {
    const start = new Date(item.startDate)
    const month = start.toLocaleString('default', { month: 'short' }).toUpperCase()
    const day = start.getDate()
    const time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const isGoing = attending[item.id] === 'going'
    const isInterested = attending[item.id] === 'interested'

    return (
      <View style={styles.card}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.host}>Hosted by {item.creator?.profile?.name || 'Garcia'}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{time}</Text>
            <View style={styles.dot} />
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.city}</Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

          <View style={styles.footer}>
            <View style={styles.attendeesCount}>
              <Ionicons name="people" size={16} color={Colors.primary} />
              <Text style={styles.attendeesText}>
                {item._count.attendees + (isGoing || isInterested ? 1 : 0)} attending
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, isInterested && styles.actionBtnActive]}
                onPress={() => handleAttend(item.id, 'interested')}
              >
                <Ionicons name={isInterested ? "star" : "star-outline"} size={16} color={isInterested ? "#fff" : Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rsvpBtn, isGoing && styles.rsvpBtnActive]}
                onPress={() => handleAttend(item.id, 'going')}
              >
                <Text style={[styles.rsvpText, isGoing && styles.rsvpTextActive]}>
                  {isGoing ? "Going" : "RSVP"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IRL Etkinlikler</Text>
        <TouchableOpacity style={styles.createBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Yakında Etkinlik Yok</Text>
            <Text style={styles.emptySubtitle}>Daha sonra tekrar kontrol et veya konumunu değiştirerek daha fazla etkinlik gör.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  createBtn: { padding: Spacing.xs },
  list: { padding: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Shadows.md
  },
  dateBadge: {
    backgroundColor: 'rgba(232,82,106,0.1)',
    borderRadius: BorderRadius.lg,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateMonth: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  dateDay: { color: Colors.textPrimary, fontSize: 24, fontWeight: FontWeight.bold },
  cardContent: { flex: 1 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
  host: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, marginHorizontal: 4 },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendeesCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeesText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  actionBtnActive: { backgroundColor: Colors.primary },
  rsvpBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  rsvpBtnActive: { backgroundColor: Colors.primary },
  rsvpText: { color: Colors.textPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  rsvpTextActive: { color: '#fff' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  speedDatingBanner: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  speedDatingGradient: {
    padding: Spacing.lg,
  },
  speedDatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  speedDatingTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  speedDatingSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  speedDatingIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  }
})
