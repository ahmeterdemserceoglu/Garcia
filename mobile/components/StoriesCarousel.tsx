import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '../api/client'
import { Colors } from '../constants/Colors'
import { FontSize, FontWeight, Spacing } from '../constants/Spacing'

export function StoriesCarousel() {
  const router = useRouter()
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    try {
      const { data } = await api.getStories()
      setStories(data)
    } catch (e) {
      console.log('Failed to load stories', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="small" />
      </View>
    )
  }

  if (stories.length === 0) return null

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={stories}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.storyItem} 
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/story-viewer', params: { userId: item.user.id }})}
          >
            <LinearGradient
              colors={[Colors.primary, '#F5A623']}
              style={styles.ring}
              start={{x:0, y:0}}
              end={{x:1, y:1}}
            >
              <View style={styles.imageContainer}>
                {item.user.avatar ? (
                  <Image source={{ uri: item.user.avatar }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text>👤</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
            <Text style={styles.name} numberOfLines={1}>{item.user.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  loadingContainer: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  imageContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  name: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  }
})
