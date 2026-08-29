import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../api/client'
import { Colors } from '../constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  
  const [stories, setStories] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const progress = useState(new Animated.Value(0))[0]

  useEffect(() => {
    loadUserStories()
  }, [])

  useEffect(() => {
    if (stories.length > 0) {
      startProgress()
    }
  }, [currentIndex, stories])

  const loadUserStories = async () => {
    try {
      const { data } = await api.getStories()
      const userGroup = data.find((g: any) => g.user.id === userId)
      if (userGroup) {
        setUser(userGroup.user)
        setStories(userGroup.stories)
      } else {
        router.back()
      }
    } catch (e) {
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const startProgress = () => {
    progress.setValue(0)
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished) {
        goToNext()
      }
    })
  }

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      router.back()
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
      // Re-start current
      progress.setValue(0)
      startProgress()
    }
  }

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX
    if (x < SCREEN_W / 2) {
      goToPrev()
    } else {
      goToNext()
    }
  }

  if (loading) return <View style={styles.container} />
  if (!stories.length) return <View style={styles.container} />

  const currentStory = stories[currentIndex]

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handlePress}>
        <Image source={{ uri: currentStory.mediaUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </TouchableOpacity>

      {/* Progress Bars */}
      <View style={[styles.progressContainer, { top: insets.top || 10 }]}>
        {stories.map((s, i) => (
          <View key={s.id} style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFg, {
              width: i === currentIndex 
                ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                : i < currentIndex ? '100%' : '0%'
            }]} />
          </View>
        ))}
      </View>

      {/* Header Info */}
      <View style={[styles.header, { top: (insets.top || 10) + 10 }]}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.time}>{new Date(currentStory.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progressContainer: { flexDirection: 'row', position: 'absolute', left: 10, right: 10, gap: 4, zIndex: 10 },
  progressBarBg: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 },
  progressBarFg: { height: '100%', backgroundColor: '#fff', borderRadius: 1 },
  
  header: { position: 'absolute', left: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
  time: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  closeBtn: { padding: 4 }
})
