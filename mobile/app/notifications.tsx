import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import { Image } from 'expo-image'
import { api } from '../api/client'

const { width } = Dimensions.get('window')

interface Notification {
  id: string
  type: 'LIKE' | 'SUPER_LIKE' | 'NEARBY' | 'SYSTEM' | 'MATCH'
  title: string
  message: string
  time: string
  isRead: boolean
  avatar?: string
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data } = await api.getNotifications()
      setNotifications(data.notifications || [])
    } catch (e) {
      console.log('Error fetching notifications', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllAsRead = async () => {
    try {
      await api.markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) {
      console.log('Error marking as read', e)
    }
  }

  const renderIcon = (type: Notification['type']) => {
    switch (type) {
      case 'LIKE':
        return <View style={[styles.iconWrapper, { backgroundColor: 'rgba(232,82,106,0.1)' }]}><Ionicons name="heart" size={20} color={Colors.like} /></View>
      case 'SUPER_LIKE':
        return <View style={[styles.iconWrapper, { backgroundColor: 'rgba(52,152,219,0.1)' }]}><Ionicons name="star" size={20} color={Colors.superLike} /></View>
      case 'NEARBY':
        return <View style={[styles.iconWrapper, { backgroundColor: 'rgba(155,81,224,0.1)' }]}><Ionicons name="location" size={20} color="#9B51E0" /></View>
      case 'MATCH':
        return <View style={[styles.iconWrapper, { backgroundColor: 'rgba(46,204,113,0.1)' }]}><Ionicons name="people" size={20} color="#2ecc71" /></View>
      case 'SYSTEM':
        return <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.05)' }]}><Ionicons name="information-circle" size={20} color={Colors.textMuted} /></View>
    }
  }

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={[styles.notificationCard, !item.isRead && styles.unreadCard]} activeOpacity={0.7}>
      {!item.isRead && <View style={styles.unreadDot} />}
      
      {item.avatar ? (
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
          <View style={styles.smallIconBadge}>{renderIcon(item.type)}</View>
        </View>
      ) : (
        renderIcon(item.type)
      )}

      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginLeft: -8 },
  actionBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end', marginRight: -8 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  
  listContent: { padding: Spacing.xl, gap: Spacing.md },
  
  notificationCard: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.xl, gap: Spacing.md, ...Shadows.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  unreadCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(232,82,106,0.2)' },
  
  unreadDot: { position: 'absolute', top: Spacing.md, right: Spacing.md, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  
  iconWrapper: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  
  avatarWrapper: { width: 48, height: 48, borderRadius: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  smallIconBadge: { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.surface },
  
  cardContent: { flex: 1, justifyContent: 'center' },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4, paddingRight: Spacing.xl },
  message: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  time: { fontSize: 11, color: Colors.textMuted, marginTop: 6, fontWeight: FontWeight.medium }
})
