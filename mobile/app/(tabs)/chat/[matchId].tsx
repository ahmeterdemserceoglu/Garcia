import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Dimensions, Modal
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { api } from '../../../api/client'
import { useAuthStore } from '../../../store/auth'
import { useChatStore } from '../../../store/chat'
import { useMatchesStore } from '../../../store/matches'
import { useAlertStore } from '../../../store/alertStore'
import { Colors, Shadows } from '../../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../../constants/Spacing'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { ProfileDetailSheet } from '../../../components/ProfileDetailSheet'

const { width: SCREEN_W } = Dimensions.get('window')

interface Message {
  id: string
  senderId: string
  content?: string
  type: string
  isRead: boolean
  createdAt: string
  duration?: number
  mediaUrl?: string
  sender?: { profile?: { name: string } }
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()
  const { socket, setActiveMatch, startTyping, stopTyping, typingUsers, setOnReadCallback } = useChatStore()
  const { matches } = useMatchesStore()
  const flatListRef = useRef<FlatList>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [currentMatch, setCurrentMatch] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false)

  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const isBlind = currentMatch?.isBlindDate && messages.length < 10;
  const [playingSound, setPlayingSound] = useState<string | null>(null)

  const recordingRef = useRef<Audio.Recording | null>(null)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const soundRef = useRef<Audio.Sound | null>(null) // Aktif ses nesnesi

  // Kayıt süresi sayacı
  useEffect(() => {
    if (isRecording) {
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isRecording]);

  // Ekran kapanınca kaydı ve sesi temizle
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const match = matches.find((m) => m.id === matchId)
    if (match) {
      const other = match.user1Id === user?.id ? match.user2 : match.user1
      setOtherUser(other)
    } else {
      loadMatch()
    }
  }, [matchId, matches, user?.id])

  useEffect(() => {
    loadMessages()
    setActiveMatch(matchId as string)

    const matchesStore = useMatchesStore.getState()
    const updatedMatches = [...matchesStore.matches]
    const matchIndex = updatedMatches.findIndex(m => m.id === matchId)
    if (matchIndex >= 0 && updatedMatches[matchIndex].messages?.[0]) {
      updatedMatches[matchIndex].messages[0].isRead = true
      matchesStore.setMatches(updatedMatches)
    }

    if (socket) {
      socket.emit('message:read', { matchId })
    }

    setOnReadCallback((readMatchId: string) => {
      if (readMatchId === matchId) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })))
      }
    })

    const handleNewMessage = (message: Message) => {
      if (message.senderId !== user?.id) {
        setMessages(prev => [message, ...prev])
        if (socket) socket.emit('message:read', { matchId })
      }
    }

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId))
    }

    if (socket) {
      socket.on('message:new', handleNewMessage)
      socket.on('message_deleted', handleMessageDeleted)
    }

    return () => {
      setActiveMatch(null)
      setOnReadCallback(null)
      if (socket) {
        socket.off('message:new', handleNewMessage)
        socket.off('message_deleted', handleMessageDeleted)
      }
    }
  }, [matchId, socket])

  const loadMatch = async () => {
    try {
      const { data } = await api.getMatches()
      const match = data.matches.find((m: any) => m.id === matchId)
      if (match) {
        setCurrentMatch(match)
        const other = match.user1?.id === user?.id ? match.user2 : match.user1
        setOtherUser(other)
      }
    } catch { }
  }

  const loadMessages = async () => {
    if (!matchId) return
    try {
      const { data } = await api.getMessages(matchId as string)
      setMessages([...data.messages].reverse())
    } catch { } finally {
      setLoading(false)
    }
  }

  const sendMessage = useCallback(async () => {
    if (!text.trim() || sending || !matchId) return
    const content = text.trim()
    setText('')
    stopTyping(matchId as string)
    setSending(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      const { data } = await api.sendMessage(matchId as string, 'TEXT', content)
      setMessages((prev) => [data.message, ...prev])
      if (socket) {
        socket.emit('message:send', { matchId, message: data.message })
      }
    } catch {
      setText(content)
    } finally {
      setSending(false)
    }
  }, [text, matchId, sending, socket])

  const handleTextChange = (val: string) => {
    setText(val)
    if (val.length > 0) {
      startTyping(matchId as string)
    } else {
      stopTyping(matchId as string)
    }
  }

  // 🎙️ Kayıt başlat (tek dokunuşla)
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) {
        useAlertStore.getState().showAlert('İzin Gerekli', 'Mikrofon izni verilmedi.')
        return
      }
      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: true, 
        playsInSilentModeIOS: true 
      })
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      recordingRef.current = rec
      setRecording(rec)
      setIsRecording(true)
      setRecordingDuration(0)
    } catch (e) {
      console.log('Recording error', e)
    }
  }

  // ⏹️ Kayıt durdur ve gönder
  const stopRecording = async () => {
    try {
      const rec = recordingRef.current
      if (!rec) return

      setIsRecording(false)
      await rec.stopAndUnloadAsync()
      const uri = rec.getURI()
      const duration = recordingDuration

      recordingRef.current = null
      setRecording(null)
      setRecordingDuration(0)

      if (uri) await sendVoiceMessage(uri, duration)
    } catch (e) {
      console.log('Stop recording error', e)
    }
  }

  // 📤 Sesli mesajı gönder
  const sendVoiceMessage = async (uri: string, duration: number) => {
    try {
      let finalUri = uri;
      if (uri.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
        finalUri = `data:audio/m4a;base64,${base64}`;
      }
      const { data } = await api.sendMessage(matchId as string, 'VOICE', '', finalUri)
      const messageWithDuration = { ...data.message, duration }
      setMessages((prev) => [messageWithDuration, ...prev])
      if (socket) {
        socket.emit('message:send', { matchId, message: messageWithDuration })
      }
    } catch (e) {
      console.log('Send voice error', e)
    }
  }

  const handleLongPressMessage = (message: Message) => {
    if (message.senderId !== user?.id) return; // Sadece kendi mesajlarını silebilir
    useAlertStore.getState().showAlert(
      'Mesajı Sil',
      'Bu mesajı geri çekmek istediğine emin misin? (Karşı taraftan da silinir)',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteMessage(matchId as string, message.id)
              setMessages(prev => prev.filter(m => m.id !== message.id))
            } catch (e) {
              console.log('Delete message error', e)
            }
          } 
        }
      ]
    )
  }

  const handleClearChat = () => {
    useAlertStore.getState().showAlert(
      'Sohbeti Temizle',
      'Tüm sohbet geçmişini silmek istediğine emin misin? (Bu işlem geri alınamaz)',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.clearChat(matchId as string)
              setMessages([])
            } catch (e) {
              console.log('Clear chat error', e)
            }
          }
        }
      ]
    )
  }

  // ▶️ Sesli mesaj oynat / durdur
  const playVoiceMessage = async (messageId: string, uri: string) => {
    try {
      // Eğer aynı sese tıklanırsa ve çalıyorsa durdur
      if (playingSound === messageId && soundRef.current) {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
        setPlayingSound(null)
        return
      }

      // Önceki sesi durdur ve temizle
      if (soundRef.current) {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      // Yeni sesi oluştur ve çal
      const { sound } = await Audio.Sound.createAsync({ uri })
      soundRef.current = sound
      setPlayingSound(messageId)

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setPlayingSound((prev) => (prev === messageId ? null : prev))
          await sound.unloadAsync()
          if (soundRef.current === sound) soundRef.current = null
        }
      })

      await sound.playAsync()
    } catch (e) {
      console.log('Play voice error', e)
      useAlertStore.getState().showAlert('Hata', 'Ses dosyası çalınamadı.')
      setPlayingSound(null)
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }
    }
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const generateIcebreaker = async () => {
    if (!otherUser || isGenerating) return
    setIsGenerating(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    await new Promise(resolve => setTimeout(resolve, 600))

    const bio = otherUser.profile?.bio?.toLowerCase() || ''
    const interests = otherUser.profile?.interests || []

    const templates = [
      "Senin de [INTEREST] ilgini çekiyor sanki! En sevdiğin yönü ne?",
      "Biyografin harika 😂 En çok ne yapmaktan keyif alırsın?",
      "Şu an kahve içmeye çıksak ne ısmarlardın?",
      "Gülüşün çok samimi geldi, dayanamayıp mesaj attım 😊",
      "İki doğru bir yalan oynayalım mı? İlk sen başla!"
    ]

    let generated = templates[Math.floor(Math.random() * templates.length)]

    if (interests.length > 0) {
      generated = generated.replace('[INTEREST]', interests[0].toLowerCase())
    } else {
      generated = generated.replace('[INTEREST]', 'konusunun')
    }

    if (bio.includes('travel') || bio.includes('gezi')) generated = "Görüyorum ki seyahat etmeyi seviyorsun! En son neresini keşfettin? ✈️"
    if (bio.includes('coffee') || bio.includes('kahve')) generated = "Filtre kahve mi, Türk kahvesi mi? ☕️"
    if (bio.includes('dog') || bio.includes('köpek')) generated = "Sevimli dostunla tanışmak için sabırsızlanıyorum! 🐶"

    setText('')
    const chars = generated.split('')
    let currentText = ''

    for (let i = 0; i < chars.length; i++) {
      currentText += chars[i]
      setText(currentText)
      await new Promise(resolve => setTimeout(resolve, 25))
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setIsGenerating(false)
  }

  const sendGameIcebreaker = async () => {
    if (sending || !matchId) return
    const games = [
      "🎲 Oyun zamanı: İki doğru bir yanlış! Başlıyorum:\n1) Hiç kemiğimi kırmadım.\n2) Eskrim yapabiliyorum.\n3) Kahve içmem.\nHangisi yalan?",
      "🎲 Oyun zamanı: Hangisini tercih ederdin? Zaman yolculuğu mu, zihin okumak mı?",
      "🎲 Hızlı soru: Hayatının geri kalanında tek bir yemek yiyebilsen bu ne olurdu?",
      "🎲 Zıt kutuplar oyunu: Sabah insanı mısın gece baykuşu mu?",
      "🎲 Oyun zamanı: Issız bir adaya düştün, yanına alacağın 3 şey nedir?"
    ]
    const randomGame = games[Math.floor(Math.random() * games.length)]

    stopTyping(matchId as string)
    setSending(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const { data } = await api.sendMessage(matchId as string, 'TEXT', randomGame)
      setMessages((prev) => [data.message, ...prev])
      if (socket) {
        socket.emit('message:send', { matchId, message: data.message })
      }
    } catch { } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isMyMessage = (msg: Message) => msg.senderId === user?.id

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = isMyMessage(item)
    const prevMsgVisually = messages[index + 1]
    const showAvatar = !isMine && (!prevMsgVisually || prevMsgVisually.senderId !== item.senderId)

    return (
      <View style={{ transform: [{ scaleY: -1 }] }}>
        <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
          {!isMine && (
            <View style={styles.avatarSpace}>
              {showAvatar && (
                otherUser?.photos?.[0]?.url ? (
                  <Image source={{ uri: otherUser.photos[0].url }} style={styles.msgAvatar} contentFit="cover" blurRadius={isBlind ? 25 : 0} />
                ) : (
                  <View style={styles.msgAvatarPlaceholder}>
                    <Text style={{ fontSize: 12 }}>👤</Text>
                  </View>
                )
              )}
            </View>
          )}
          <View style={styles.msgContainer}>
            {item.type === 'VOICE' ? (
              <TouchableOpacity 
                onPress={() => playVoiceMessage(item.id, item.mediaUrl || item.content || '')}
                onLongPress={() => handleLongPressMessage(item)}
                style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther, styles.voiceBubble]}
                activeOpacity={0.7}
              >
                <View style={[styles.voicePlayButton, { backgroundColor: isMine ? 'rgba(255,255,255,0.25)' : 'rgba(232,82,106,0.15)' }]}>
                  <Ionicons 
                    name={playingSound === item.id ? 'pause' : 'play'} 
                    size={16} 
                    color={isMine ? '#fff' : Colors.primary} 
                    style={{ marginLeft: playingSound === item.id ? 0 : 2 }}
                  />
                </View>
                <View style={styles.voiceWaveContainer}>
                  <View style={styles.voiceWave}>
                    {[6, 12, 8, 16, 10, 14, 8, 12, 6].map((h, i) => (
                      <View key={i} style={{
                        width: 3,
                        height: h,
                        borderRadius: 2,
                        backgroundColor: isMine ? 'rgba(255,255,255,0.7)' : 'rgba(232,82,106,0.6)',
                        opacity: playingSound === item.id ? 1 : 0.4,
                      }} />
                    ))}
                  </View>
                  {item.duration ? (
                    <Text style={[styles.voiceDuration, { color: isMine ? 'rgba(255,255,255,0.8)' : Colors.textMuted }]}>
                      {formatDuration(item.duration)}
                    </Text>
                  ) : (
                    <Text style={[styles.voiceDuration, { color: isMine ? 'rgba(255,255,255,0.6)' : Colors.textMuted }]}>
                      Ses
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ) : isMine ? (
              <TouchableOpacity onLongPress={() => handleLongPressMessage(item)} activeOpacity={0.8}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bubble, styles.bubbleMine]}
                >
                  <Text style={styles.bubbleTextMine}>{item.content}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onLongPress={() => handleLongPressMessage(item)} activeOpacity={0.8}>
                <View style={[styles.bubble, styles.bubbleOther]}>
                  <Text style={styles.bubbleTextOther}>{item.content}</Text>
                </View>
              </TouchableOpacity>
            )}
            <View style={[styles.timeRow, isMine ? styles.timeRowRight : styles.timeRowLeft]}>
              <Text style={styles.msgTime}>{formatTime(item.createdAt)}</Text>
              {isMine && (
                <Ionicons
                  name={item.isRead ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={item.isRead ? Colors.primary : Colors.textMuted}
                  style={{ marginLeft: 2 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    )
  }

  const HEADER_HEIGHT = insets.top + 60

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(232,82,106,0.03)', '#0A0A0C', 'rgba(155,81,224,0.02)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.header, { height: HEADER_HEIGHT, paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#0A0A0C', '#0A0A0C', 'rgba(10,10,12,0.9)', 'transparent']}
          locations={[0, 0.45, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/matches')} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerInfo} 
          onPress={() => {
            if (isBlind) {
              useAlertStore.getState().showAlert('Gizem Sürüyor', 'Kör randevuda profil detaylarını görebilmek için en az 10 mesajlaşmanız gerekiyor.')
            } else {
              setShowProfileSheet(true)
            }
          }} 
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrapper}>
            {otherUser?.photos?.[0]?.url ? (
              <Image source={{ uri: otherUser.photos[0].url }} style={styles.headerAvatar} contentFit="cover" blurRadius={isBlind ? 25 : 0} />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                <Text style={{ fontSize: 16 }}>👤</Text>
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.headerTextCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.headerName} numberOfLines={1}>{otherUser?.profile?.name || 'Sohbet'}</Text>
              {otherUser?.isFaceVerified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
              )}
            </View>
            {typingUsers.has(otherUser?.id) ? (
              <Text style={styles.headerStatusTyping}>yazıyor...</Text>
            ) : (
              <Text style={styles.headerStatus}>Çevrimiçi</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              if (!user?.isPremium) {
                useAlertStore.getState().showAlert(
                  "Premium Gerekli",
                  "Görüntülü konuşma Premium bir özelliktir. Lütfen Premium'a geçin.",
                  [{ text: "Vazgeç", style: 'cancel' }, { text: "Premium Al", onPress: () => router.push('/premium') }]
                )
              } else {
                useAlertStore.getState().showAlert("Görüntülü Konuşma", "Bağlanıyor... (Demo)")
              }
            }}
          >
            <Ionicons name="videocam" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={() => setShowOptionsModal(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : HEADER_HEIGHT}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            style={{ transform: [{ scaleY: -1 }] }}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messageList,
              {
                paddingBottom: HEADER_HEIGHT + Spacing.lg,
                paddingTop: Spacing.sm
              }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={[styles.emptyChat, { transform: [{ scaleY: -1 }] }]}>
                <View style={styles.emptyChatAvatarWrapper}>
                  {otherUser?.photos?.[0]?.url ? (
                    <Image source={{ uri: otherUser.photos[0].url }} style={styles.emptyChatAvatar} contentFit="cover" blurRadius={isBlind ? 25 : 0} />
                  ) : (
                    <View style={[styles.emptyChatAvatar, styles.headerAvatarPlaceholder]}>
                      <Text style={{ fontSize: 36 }}>👤</Text>
                    </View>
                  )}
                  <View style={styles.emptyHeartBadge}>
                    <Text style={{ fontSize: 16 }}>💖</Text>
                  </View>
                </View>

                <Text style={styles.emptyTitle}>Eşleştiniz! 🎉</Text>
                <Text style={styles.emptySubtitle}>
                  {otherUser?.profile?.name || 'Partnerin'} ile eşleştin. İlk adımı sen at ve sohbeti başlat!
                </Text>

                <View style={styles.emptySuggestions}>
                  <TouchableOpacity style={styles.suggestionCard} onPress={generateIcebreaker}>
                    <LinearGradient colors={['rgba(232,82,106,0.15)', 'rgba(232,82,106,0.05)']} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
                    <Ionicons name="sparkles" size={24} color={Colors.primary} style={{ marginBottom: 8 }} />
                    <Text style={styles.suggestionCardTitle}>Yapay Zeka</Text>
                    <Text style={styles.suggestionCardSub}>Buz kırıcı mesaj</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.suggestionCard} onPress={sendGameIcebreaker}>
                    <LinearGradient colors={['rgba(155,81,224,0.15)', 'rgba(155,81,224,0.05)']} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
                    <Ionicons name="dice" size={24} color="#9B51E0" style={{ marginBottom: 8 }} />
                    <Text style={[styles.suggestionCardTitle, { color: '#9B51E0' }]}>Mini Oyun</Text>
                    <Text style={styles.suggestionCardSub}>Eğlenceli sorular</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          {messages.length > 0 && (
            <View style={styles.quickBar}>
              <TouchableOpacity style={styles.quickChip} onPress={sendGameIcebreaker} disabled={sending}>
                <Ionicons name="dice-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.quickChipText}>Oyun</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickChip, isGenerating && { opacity: 0.5 }]} onPress={generateIcebreaker} disabled={isGenerating}>
                {isGenerating ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.quickChipText, { color: Colors.primary }]}>AI Öneri</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <BlurView tint="dark" intensity={60} style={styles.pillInputWrapper}>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => useAlertStore.getState().showAlert('Fotoğraf', 'Medya gönderme seçeneği aktif.')}>
              <Ionicons name="add" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder={isRecording ? `Kaydediliyor... ${formatDuration(recordingDuration)}` : "Mesaj yazın..."}
              placeholderTextColor={isRecording ? Colors.error : Colors.textMuted}
              value={text}
              onChangeText={handleTextChange}
              multiline
              maxLength={2000}
              selectionColor={Colors.primary}
              editable={!isRecording}
            />

            {/* Kayıt butonu: tek dokunuşla başlar/durdurur */}
            <TouchableOpacity 
              onPress={() => {
                if (isRecording) {
                  stopRecording()
                } else {
                  startRecording()
                }
              }}
              style={{ padding: 8 }}
            >
              <Ionicons 
                name={isRecording ? 'stop-circle' : 'mic-outline'} 
                size={24} 
                color={isRecording ? Colors.error : Colors.textSecondary} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendBtn, text.trim() ? styles.sendBtnActive : {}]}
              onPress={sendMessage}
              disabled={!text.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <LinearGradient
                  colors={text.trim() ? [Colors.primary, Colors.primaryDark] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Ionicons name="paper-plane" size={16} color={text.trim() ? '#fff' : Colors.textMuted} style={{ marginLeft: text.trim() ? -2 : 0 }} />
            </TouchableOpacity>
          </BlurView>
        </View>
      </KeyboardAvoidingView>

      {showProfileSheet && (
        <ProfileDetailSheet
          user={otherUser}
          visible={showProfileSheet}
          onClose={() => setShowProfileSheet(false)}
        />
      )}

      <Modal visible={showOptionsModal} transparent animationType="slide" onRequestClose={() => setShowOptionsModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Seçenekler</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => {
                setShowOptionsModal(false)
                setTimeout(() => setShowProfileSheet(true), 300)
              }}
            >
              <View style={styles.modalOptionIconBg}>
                <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
              </View>
              <Text style={styles.modalOptionText}>Profili Gör</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => {
                setShowOptionsModal(false)
                setTimeout(handleClearChat, 300)
              }}
            >
              <View style={[styles.modalOptionIconBg, { backgroundColor: 'rgba(232,82,106,0.1)' }]}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </View>
              <Text style={[styles.modalOptionText, { color: Colors.error }]}>Sohbeti Temizle</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomWidth: 0 }]} 
              onPress={() => setShowOptionsModal(false)}
            >
              <View style={styles.modalOptionIconBg}>
                <Ionicons name="close-outline" size={20} color={Colors.textSecondary} />
              </View>
              <Text style={[styles.modalOptionText, { color: Colors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0C' },
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
  },
  headerAvatar: {
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  headerAvatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: '#0A0A0C',
  },
  headerTextCol: {
    gap: 1,
    flex: 1,
  },
  headerName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerStatus: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
  headerStatusTyping: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerIconBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  avatarSpace: { width: 30 },
  msgAvatar: { width: 30, height: 30, borderRadius: 15 },
  msgAvatarPlaceholder: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgContainer: {
    maxWidth: SCREEN_W * 0.72,
    gap: 3,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.sm,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  bubbleTextMine: { color: '#fff', fontSize: FontSize.md, lineHeight: 22, fontWeight: FontWeight.regular },
  bubbleTextOther: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22, fontWeight: FontWeight.regular },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeRowRight: { justifyContent: 'flex-end' },
  timeRowLeft: { justifyContent: 'flex-start' },
  msgTime: { fontSize: 10, color: Colors.textMuted },

  // Sesli mesaj stilleri
  voiceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    minWidth: 130,
  },
  voicePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  voiceDuration: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },

  // Empty State
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyChatAvatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  emptyChatAvatar: {
    width: 100, height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  emptyHeartBadge: {
    position: 'absolute',
    bottom: -4, right: -4,
    backgroundColor: '#1E1B24',
    borderRadius: 18,
    width: 36, height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A0A0C',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  emptySuggestions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  suggestionCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  suggestionCardTitle: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
    marginBottom: 2,
  },
  suggestionCardSub: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // Input Area
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    width: '100%',
    zIndex: 10,
  },
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    gap: 8,
    paddingLeft: 4,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quickChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  pillInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,27,36,0.6)',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  mediaBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 6,
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 40,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 2,
  },
  sendBtnActive: {
    ...Shadows.glow,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modalOptionText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  }
})