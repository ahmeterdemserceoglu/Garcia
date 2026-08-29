import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, PermissionsAndroid } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import * as Haptics from 'expo-haptics'
import { useDiscoverStore } from '../store/discover'
import { useAlertStore } from '../store/alertStore'
import { api } from '../api/client'

let createAgoraRtcEngine: any = null
let ChannelProfileType: any = {}
let ClientRoleType: any = {}
let RtcSurfaceView: any = View

try {
  const Agora = require('react-native-agora')
  createAgoraRtcEngine = Agora.createAgoraRtcEngine
  ChannelProfileType = Agora.ChannelProfileType
  ClientRoleType = Agora.ClientRoleType
  RtcSurfaceView = Agora.RtcSurfaceView
} catch (e) {
  console.log('Agora native module not linked (running in Expo Go)')
}

const { width, height } = Dimensions.get('window')

type GameState = 'LOBBY' | 'SEARCHING' | 'IN_CALL' | 'DECIDING' | 'MATCHED' | 'PASSED'

export default function SpeedDatingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [decision, setDecision] = useState<'LIKE' | 'PASS' | null>(null)
  const [partnerUid, setPartnerUid] = useState<number | null>(null)

  const agoraEngineRef = React.useRef<any>(null)
  const appId = 'da4209d67beb4bceaf306bbad440c0ff'

  const { users, swipeRight } = useDiscoverStore()
  const [profileIndex, setProfileIndex] = useState(0)
  const currentProfile = users[profileIndex] // Fallback

  useEffect(() => {
    return () => {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel()
        agoraEngineRef.current.release()
      }
    }
  }, [])

  const initAgora = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ])
    }
    if (!agoraEngineRef.current) {
      agoraEngineRef.current = createAgoraRtcEngine()
      const agoraEngine = agoraEngineRef.current
      agoraEngine.initialize({ appId })
      agoraEngine.enableVideo()
      agoraEngine.registerEventHandler({
        onUserJoined: (_c: any, uid: any) => setPartnerUid(uid),
        onUserOffline: () => {
          leaveAgora()
          // Eğer biz LIKE dediysek ama o çıktıysa, eşleşme başarısız.
          setGameState('PASSED')
        },
      })
    }
  }

  const leaveAgora = () => {
    setPartnerUid(null)
    if (agoraEngineRef.current) {
      agoraEngineRef.current.leaveChannel()
    }
  }

  useEffect(() => {
    let timer: any
    if (gameState === 'IN_CALL' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (gameState === 'IN_CALL' && timeLeft === 0) {
      leaveAgora()
      if (decision === 'LIKE') {
        setGameState('MATCHED')
      } else {
        setGameState('PASSED')
      }
    }
    return () => clearInterval(timer)
  }, [gameState, timeLeft, decision])

  const handleStart = async () => {
    if (!createAgoraRtcEngine) {
      useAlertStore.getState().showAlert('Yerel Derleme Gerekli', 'Hızlı flört görüntülü sohbet için uygulamanın yerel Android derlemesi (npx expo run:android) gereklidir.')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setGameState('SEARCHING')
    setDecision(null)

    try {
      await initAgora()
      const { data } = await api.startFastExpress()
      if (data.channelName) {
        agoraEngineRef.current?.joinChannel('', data.channelName, 0, {
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        })
        setGameState('IN_CALL')
        setTimeLeft(180)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        useAlertStore.getState().showAlert("Arama Sonucu", "Şu an Hızlı Flört arayan kimse yok.")
        setGameState('LOBBY')
      }
    } catch (e) {
      useAlertStore.getState().showAlert("Arama Sonucu", "Şu an Hızlı Flört arayan kimse yok.")
      setGameState('LOBBY')
    }
  }

  const handleDecision = async (choice: 'LIKE' | 'NEXT') => {
    if (choice === 'NEXT') {
      leaveAgora()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      setGameState('PASSED')
    } else if (choice === 'LIKE') {
      setDecision('LIKE')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // Call continues until timer ends!
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: Colors.background }} />
        <LinearGradient colors={['transparent', 'rgba(232,82,106,0.15)']} style={StyleSheet.absoluteFill} />
      </View>

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={Colors.textPrimary} />
      </TouchableOpacity>

      {gameState === 'LOBBY' && (
        <View style={styles.content}>
          <View style={[styles.iconRing, { borderWidth: 2, borderColor: Colors.primary, backgroundColor: 'rgba(232,82,106,0.05)' }]}>
            <Ionicons name="flame" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Hızlı Flört</Text>
          <Text style={styles.subtitle}>
            Sadece 3 dakikan var. Karşına rastgele biri çıkacak.
            3 dakika içinde onu etkile, yoksa sonsuza dek kaybolur!
            Kameralar açılıyor, cesaretin var mı?
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleStart} activeOpacity={0.8}>
            <LinearGradient colors={Colors.gradientHero} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            <Text style={styles.actionBtnText}>Aramaya Katıl</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'SEARCHING' && (
        <View style={styles.content}>
          <View style={[styles.iconRing, { borderWidth: 2, borderColor: Colors.primary, backgroundColor: 'transparent', overflow: 'hidden' }]}>
            <Ionicons name="search" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Bağlanıyor...</Text>
          <Text style={styles.subtitle}>Bölgedeki bekarlar taranıyor. Lütfen bekle.</Text>
        </View>
      )}

      {(gameState === 'IN_CALL' || gameState === 'DECIDING') && (
        <View style={StyleSheet.absoluteFill}>
          {partnerUid ? (
            <RtcSurfaceView canvas={{ uid: partnerUid }} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: Colors.textSecondary }}>Karşı taraf bağlanıyor...</Text>
            </View>
          )}

          <View style={styles.localVideoWrapper}>
            <RtcSurfaceView canvas={{ uid: 0 }} style={StyleSheet.absoluteFill} />
          </View>

          <LinearGradient
            colors={['rgba(15,13,18,0.7)', 'transparent', 'rgba(15,13,18,0.9)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.timerBubble, { top: insets.top + 20 }]}>
            <Ionicons name="time" size={20} color={Colors.textPrimary} />
            <Text style={[styles.timerText, timeLeft < 30 && { color: Colors.error }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>

          <View style={styles.callBottomArea}>
            <View style={styles.callControls}>
              <TouchableOpacity style={styles.nextBtn} onPress={() => handleDecision('NEXT')} activeOpacity={0.8}>
                <Ionicons name="play-skip-forward" size={32} color={Colors.textPrimary} />
                <Text style={styles.nextBtnText}>Geç</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.likeBtn, decision === 'LIKE' && { transform: [{scale: 1.1}] }]} 
                onPress={() => handleDecision('LIKE')} 
                activeOpacity={0.8}
                disabled={decision === 'LIKE'}
              >
                <LinearGradient 
                  colors={decision === 'LIKE' ? ['#fff', '#eee'] : Colors.gradientPrimary} 
                  style={StyleSheet.absoluteFill} 
                />
                <Ionicons name="heart" size={36} color={decision === 'LIKE' ? Colors.primary : "#fff"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {(gameState === 'MATCHED' || gameState === 'PASSED') && (
        <View style={styles.content}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>
            {gameState === 'MATCHED' ? '🎉' : '💨'}
          </Text>
          <Text style={styles.title}>
            {gameState === 'MATCHED' ? "Eşleştiniz!" : "Vakit Doldu"}
          </Text>
          <Text style={styles.subtitle}>
            {gameState === 'MATCHED'
              ? "3 dakikalık baskıya dayandınız ve birbirinizi beğendiniz! Mesajlar sekmesinden sohbete devam edebilirsiniz."
              : "Bazen o kıvılcım çakmaz. Hızlı flört dünyasında sıradaki maceraya yelken açma vakti!"}
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <LinearGradient colors={Colors.gradientPrimary} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            <Text style={styles.actionBtnText}>Keşfete Dön</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  closeBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  iconRing: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl, backgroundColor: 'rgba(232,82,106,0.1)', overflow: 'hidden', ...Shadows.glow },
  title: { fontSize: 36, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  actionBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadows.glow },
  actionBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: 'bold', position: 'relative', zIndex: 1, textAlign: 'center' },
  callContainer: { flex: 1 },
  timerBubble: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'rgba(15,13,18,0.7)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  timerText: { color: Colors.textPrimary, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  callBottomArea: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  callerName: { color: Colors.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  callerLocation: { color: '#ddd', fontSize: FontSize.md, marginBottom: Spacing.xl, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  callControls: { flexDirection: 'row', alignItems: 'center', gap: 40 },
  nextBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  nextBtnText: { color: Colors.textPrimary, fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  likeBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...Shadows.glow },
  localVideoWrapper: { position: 'absolute', bottom: 150, right: 20, width: 100, height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: Colors.primary },
})
