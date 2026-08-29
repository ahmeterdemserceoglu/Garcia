import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Dimensions, Alert
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '../api/client'
import { useAlertStore } from '../store/alertStore'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_W } = Dimensions.get('window')

interface Message {
  id: string
  isAi: boolean
  text?: string
  users?: any[]
  isTyping?: boolean
}

import { useAuthStore } from '../store/auth'

export default function AiCupidScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()
  const flatListRef = useRef<FlatList>(null)

  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Initial profile audit message
    const profile = user?.profile
    const photosCount = user?.photos?.length || 0
    const bioLength = profile?.bio?.length || 0
    const interestsCount = profile?.interests?.length || 0
    const promptsCount = profile?.prompts ? Object.keys(profile.prompts).length : 0

    let auditTips = []
    if (photosCount < 3) {
      auditTips.push("📸 **Fotoğraflar:** En az 3-4 kaliteli fotoğraf ekleyerek çekiciliğini artırabilirsin (şu an: " + photosCount + ").")
    }
    if (bioLength < 15) {
      auditTips.push("✏️ **Biyografi:** Biyografin çok kısa ya da boş! Kendini tanıtan birkaç eğlenceli cümle ekle.")
    }
    if (interestsCount < 3) {
      auditTips.push("🎯 **İlgi Alanları:** İlgi alanlarını seçerek ortak noktası olan kişilerle eşleşme şansını katla.")
    }
    if (promptsCount === 0) {
      auditTips.push("❓ **Profil Soruları:** Profil sorularını henüz cevaplamadın! Soruları yanıtlayan profiller %85 daha fazla eşleşme alıyor.")
    }

    const auditMessage = auditTips.length > 0
      ? `Selam ${profile?.name || ''}! 💘 Ben senin AI Profil Koçunum.\n\nProfilini analiz ettim ve eksikler buldum:\n\n` + auditTips.join('\n\n') + `\n\nBu eksikleri tamamlamak ister misin? Ya da bana hayalindeki eşleşmeyi tarif et!`
      : `Selam ${profile?.name || ''}! 💘 Profilin harika görünüyor! Mükemmel bir profil skoruna sahipsin 🔥.\n\nŞimdi bana nasıl birini aradığını tarif et (Örn: 'Spor yapan ve kahve seven biri'), sana nokta atışı kişileri getireyim!`

    setMessages([
      {
        id: 'welcome',
        isAi: true,
        text: auditMessage
      }
    ])
  }, [user])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!inputText.trim() || loading) return
    const query = inputText.trim()
    setInputText('')

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), isAi: false, text: query }
    setMessages(prev => [...prev, userMsg])
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    
    setLoading(true)

    // Add AI typing indicator
    const typingId = 'typing_' + Date.now()
    setMessages(prev => [...prev, { id: typingId, isAi: true, isTyping: true }])
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      // Simulate AI thinking time
      await new Promise(r => setTimeout(r, 1500))
      
      const { data } = await api.searchUsers(query)
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId))

      if (data.users && data.users.length > 0) {
        setMessages(prev => [
          ...prev, 
          { id: Date.now().toString() + '_text', isAi: true, text: `Senin için ${data.users.length} harika eşleşme buldum! Göz at:` },
          { id: Date.now().toString() + '_cards', isAi: true, users: data.users }
        ])
      } else {
        setMessages(prev => [
          ...prev, 
          { id: Date.now().toString(), isAi: true, text: "Şu an bu kriterlere tam uyan birini bulamadım. Biraz daha genel aramayı dene! (Örn: 'gezi', 'spor', 'müzik')" }
        ])
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      setMessages(prev => [...prev, { id: Date.now().toString(), isAi: true, text: "Hoppala, oklarım birbirine karıştı. Lütfen daha sonra tekrar dene!" }])
    } finally {
      setLoading(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const handleLike = async (userId: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    try {
      const { data } = await api.likeUser(userId, true) // Super like from AI
      if (data.isMatch) {
        useAlertStore.getState().showAlert("🎉 Eşleştiniz!", `Sen ve ${name} birbirinizi beğendiniz!`, [
          { text: 'Sohbet Et', onPress: () => router.push(`/chat/${data.match.id}`) },
          { text: 'Keşfe Devam Et', style: 'cancel' }
        ])
      } else {
        useAlertStore.getState().showAlert('Süper Beğenildi! ⭐', `Süper beğenin ${name} kişisine gönderildi.`)
      }
    } catch (e: any) {
      if (e.response?.status === 429) {
        useAlertStore.getState().showAlert('Limit Doldu', 'Sınırsız beğeni için Premium\'a geç!', [
          { text: 'Şimdi Değil', style: 'cancel' },
          { text: 'Premium Al', onPress: () => router.push('/premium') }
        ])
      }
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isTyping) {
      return (
        <View style={[styles.msgRow, styles.msgRowLeft]}>
          <View style={styles.aiAvatar}><Text style={{fontSize:18}}>🤖</Text></View>
          <View style={[styles.bubble, styles.bubbleOther]}>
             <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        </View>
      )
    }

    if (item.users) {
      return (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={item.users}
          keyExtractor={u => u.id}
          contentContainerStyle={styles.cardsScroll}
          renderItem={({item: u}) => (
            <View style={styles.miniCard}>
              <Image source={{ uri: u.photos?.[0]?.url }} style={styles.miniCardImage} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
              <View style={styles.miniCardInfo}>
                <Text style={styles.miniCardName}>{u.profile?.name}</Text>
                {u.profile?.bio && <Text style={styles.miniCardBio} numberOfLines={2}>{u.profile.bio}</Text>}
                <TouchableOpacity style={styles.miniCardBtn} onPress={() => handleLike(u.id, u.profile?.name)}>
                  <Ionicons name="star" size={16} color="#fff" />
                  <Text style={styles.miniCardBtnText}>Süper Beğeni</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )
    }

    return (
      <View style={[styles.msgRow, item.isAi ? styles.msgRowLeft : styles.msgRowRight]}>
        {item.isAi && <View style={styles.aiAvatar}><Text style={{fontSize:18}}>🤖</Text></View>}
        <View style={styles.msgContainer}>
          {item.isAi ? (
            <View style={[styles.bubble, styles.bubbleOther]}>
              <Text style={styles.bubbleTextOther}>{item.text}</Text>
              {item.id === 'welcome' && (
                <TouchableOpacity
                  style={styles.editProfileBanner}
                  onPress={() => router.push('/edit-profile')}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.editProfileBannerGrad}>
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={styles.editProfileBannerText}>Profilini / Soruları Düzenle</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.bubbleMine]}
            >
              <Text style={styles.bubbleTextMine}>{item.text}</Text>
            </LinearGradient>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>AI Profil Koçu 💘</Text>
          <Text style={styles.headerStatus}>● Çevrimiçi</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Hayalindeki eşleşmeyi tarif et..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : {}]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Text style={[styles.sendBtnText, inputText.trim() && { color: '#fff' }]}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { color: Colors.textPrimary, fontSize: FontSize.lg },
  headerInfo: { flex: 1 },
  headerName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerStatus: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  
  messageList: { padding: Spacing.lg, gap: Spacing.md, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginVertical: 2, alignItems: 'flex-end', gap: Spacing.sm },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(232,82,106,0.1)', alignItems: 'center', justifyContent: 'center' },
  msgContainer: { maxWidth: SCREEN_W * 0.75 },
  bubble: { borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  bubbleMine: { borderBottomRightRadius: 6 },
  bubbleOther: { backgroundColor: Colors.surfaceElevated, borderBottomLeftRadius: 6 },
  bubbleTextMine: { color: '#fff', fontSize: FontSize.md, lineHeight: 22 },
  bubbleTextOther: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22 },
  editProfileBanner: { marginTop: Spacing.md, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  editProfileBannerGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, gap: Spacing.xs },
  editProfileBannerText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  
  cardsScroll: { paddingVertical: Spacing.md, paddingLeft: 44, gap: Spacing.md },
  miniCard: { width: 160, height: 220, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.surface },
  miniCardImage: { width: '100%', height: '100%', position: 'absolute' },
  miniCardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.sm },
  miniCardName: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  miniCardBio: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2, marginBottom: Spacing.sm },
  miniCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.superLike, paddingVertical: 6, borderRadius: BorderRadius.md, gap: 4 },
  miniCardBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  inputWrapper: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 44, maxHeight: 120, justifyContent: 'center' },
  textInput: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  sendBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sendBtnText: { fontSize: 18, color: Colors.textMuted, fontWeight: FontWeight.bold },
})
