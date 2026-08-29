import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Dimensions, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { api } from '../../api/client'
import { Colors } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useAlertStore } from '../../store/alertStore'

interface Liker {
  id: string
  isSuperLike: boolean
  createdAt: string
  name: string
  age: number | null
  photo: string | null
  isBlurred: boolean
}

export default function LikesScreen() {
  const router = useRouter()
  const [likes, setLikes] = useState<Liker[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchLikes = async () => {
    try {
      const res = await api.getWhoLikedMe()
      setLikes(res.data.likes || [])
      setIsPremium(res.data.isPremium)
    } catch (e) {
      console.error('Failed to fetch likes', e)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchLikes()
    }, [])
  )

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const handleAccept = async (userId: string) => {
    try {
      setLikes(prev => prev.filter(l => l.id !== userId))
      await api.likeUser(userId)
      useAlertStore.getState().showAlert('Eşleşme!', 'Harika, onunla eşleştin. Mesaj kutuna bakabilirsin.', [{ text: 'Tamam' }])
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async (userId: string) => {
    try {
      setLikes(prev => prev.filter(l => l.id !== userId))
      await api.passUser(userId)
    } catch (e) {
      console.error(e)
    }
  }

  const renderItem = ({ item }: { item: Liker }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.photo || '' }}
            style={styles.cardImage as any}
            resizeMode="cover"
            blurRadius={item.isBlurred ? 20 : 0}
          />
          {item.isSuperLike && (
            <View style={styles.superLikeBadge}>
              <Ionicons name="star" size={12} color="#fff" />
            </View>
          )}

          {!item.isBlurred && (
            <View style={styles.cardActionsOverlay}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                <Ionicons name="heart" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.cardInfoSolid}>
          <Text style={styles.cardNameSolid}>{item.name}</Text>
          {item.age && <Text style={styles.cardAgeSolid}>{item.age}</Text>}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seni Beğenenler</Text>
        <Text style={styles.headerSubtitle}>
          Seni beğenen tüm kullanıcıları burada görebilirsin.
        </Text>
      </View>

      {likes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="heart-dislike-outline" size={48} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Henüz beğeni yok</Text>
          <Text style={styles.emptySubtitle}>Daha fazla beğeni almak için profilini güncelle ve kaydırmaya devam et!</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={renderItem}
        />
      )}


    </View>
  )
}

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - Spacing.md * 2 - Spacing.sm * 2) / 2

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg },
  headerTitle: { fontSize: 32, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  grid: { padding: Spacing.md },
  card: {
    width: CARD_WIDTH,
    margin: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  cardImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative'
  },
  cardImage: { width: '100%', height: '100%' },
  cardInfoSolid: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs
  },
  cardNameSolid: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  cardAgeSolid: { color: Colors.textSecondary, fontSize: FontSize.md },
  superLikeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: '#3b82f6',
    width: 24, height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  cardActionsOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 3
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  emptyTitle: { fontSize: 22, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  paywallOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: Spacing.xl,
    paddingBottom: 40,
    backgroundColor: 'rgba(15,13,18,0.85)',
  },
  paywallContent: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,82,106,0.3)',
  },
  paywallIcon: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232,82,106,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md
  },
  paywallTitle: { fontSize: 24, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  paywallSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  upgradeBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  upgradeBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold }
})
