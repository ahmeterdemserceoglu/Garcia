import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { api } from '../api/client'
import { Colors } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

interface Visitor {
  id: string
  name: string
  age?: number
  photo?: string
  visitedAt: string
}

export default function VisitorsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVisitors()
  }, [])

  const loadVisitors = async () => {
    try {
      const { data } = await api.getProfileVisitors()
      setVisitors(data.visitors || [])
    } catch (e: any) {
      // Endpoint may not exist yet - show friendly message
      setError('Bu özellik yakında aktif olacak!')
    } finally {
      setLoading(false)
    }
  }

  const formatVisitTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diff < 60) return `${diff}dk önce`
    if (diff < 1440) return `${Math.floor(diff/60)}sa önce`
    return `${Math.floor(diff/1440)}g önce`
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Ziyaretçileri</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{error}</Text>
          <Text style={styles.emptySubtitle}>Yakında profilinizi kimin ziyaret ettiğini görebileceksiniz.</Text>
        </View>
      ) : visitors.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="eye-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Henüz ziyaretçi yok</Text>
          <Text style={styles.emptySubtitle}>Profilinizi inceleyen kişiler burada görünecek.</Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.xl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.visitorCard}>
              <View style={styles.avatarContainer}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={{ fontSize: 24 }}>👤</Text>
                  </View>
                )}
              </View>
              <View style={styles.visitorInfo}>
                <Text style={styles.visitorName}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
                <Text style={styles.visitTime}>{formatVisitTime(item.visitedAt)}</Text>
              </View>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.viewBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.viewBtnText}>Profili Gör</Text>
              </LinearGradient>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.xl, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center', lineHeight: 22 },
  visitorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  avatarContainer: {},
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  visitorInfo: { flex: 1 },
  visitorName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  visitTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  viewBtn: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  viewBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
})
