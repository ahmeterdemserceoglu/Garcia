import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import * as Haptics from 'expo-haptics'
import { api } from '../api/client'
import { useAlertStore } from '../store/alertStore'

export default function BlindDateScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [searching, setSearching] = useState(false)
  const [matched, setMatched] = useState<any>(null)

  const handleStartSearch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    setSearching(true)
    try {
      const { data } = await api.startBlindDate()
      if (data.match) {
        setMatched(data.match)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        useAlertStore.getState().showAlert("Arama Sonucu", "Kimse bulunamadı. Lütfen daha sonra tekrar deneyin.")
      }
    } catch (e) {
      useAlertStore.getState().showAlert("Arama Sonucu", "Kimse bulunamadı. Lütfen daha sonra tekrar deneyin.")
    } finally {
      setSearching(false)
    }
  }

  const handleStartChat = () => {
    if (matched) {
      router.replace(`/chat/${matched.id}`)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#100B1A', '#000000']} style={StyleSheet.absoluteFill} />
      
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="eye-off" size={64} color="#fff" />
        </View>

        <Text style={styles.title}>Kör Randevu</Text>
        <Text style={styles.subtitle}>
          Dış görünüşü bir kenara bırak, ruha odaklan. 
          Kim olduğunu bilmediğin biriyle eşleş, sohbet et. 
          10 mesaj sonra birbirinizin fotoğraflarını görebileceksiniz.
        </Text>

        {!searching && !matched && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStartSearch} activeOpacity={0.8}>
            <LinearGradient colors={['#9B51E0', '#6A00F4']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.startBtnText}>Ruh Eşini Bul</Text>
              <Ionicons name="search" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {searching && (
          <View style={styles.searchingBox}>
            <ActivityIndicator size="large" color="#9B51E0" />
            <Text style={styles.searchingText}>Senin frekansında biri aranıyor...</Text>
          </View>
        )}

        {matched && (
          <View style={styles.matchedBox}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🔮</Text>
            <Text style={styles.matchedTitle}>Biri Bulundu!</Text>
            <Text style={styles.matchedSubtitle}>Ortak ilgi alanınız: {matched.commonText || 'Gizemli ortaklıklar...'}</Text>
            
            <TouchableOpacity style={styles.chatBtn} onPress={handleStartChat} activeOpacity={0.8}>
              <Text style={styles.chatBtnText}>Sohbete Başla</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  iconWrapper: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(155,81,224,0.2)', borderWidth: 2, borderColor: '#9B51E0', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl, ...Shadows.glow },
  title: { fontSize: 32, fontWeight: FontWeight.extrabold, color: '#fff', marginBottom: Spacing.md },
  subtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  startBtn: { width: '100%', height: 60, borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadows.glow },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  searchingBox: { alignItems: 'center', marginTop: Spacing.xl },
  searchingText: { color: '#9B51E0', fontSize: FontSize.md, marginTop: Spacing.md, fontWeight: '600' },
  matchedBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: Spacing.xl, borderRadius: BorderRadius.xl, width: '100%', borderWidth: 1, borderColor: 'rgba(155,81,224,0.3)' },
  matchedTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: Spacing.sm },
  matchedSubtitle: { color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  chatBtn: { width: '100%', height: 50, borderRadius: BorderRadius.full, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  chatBtnText: { color: '#000', fontSize: FontSize.md, fontWeight: 'bold' }
})
