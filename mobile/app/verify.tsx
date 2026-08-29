import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'
import { useAuthStore } from '../store/auth'

export default function VerifyScreen() {
  const { token } = useGlobalSearchParams<{ token: string }>()
  const router = useRouter()
  const { loadSession } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Geçersiz link. Lütfen e-postanızdaki linke tekrar tıklayın.')
      return
    }
    verifyToken(token)
  }, [token])

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t })
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'E-posta doğrulandı!')
        await loadSession()
      } else {
        setStatus('error')
        setMessage(data.error || 'Doğrulama başarısız oldu.')
      }
    } catch (e) {
      setStatus('error')
      setMessage('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.')
    }
  }

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.text}>E-postanız doğrulanıyor...</Text>
        </>
      )}
      {status === 'success' && (
        <>
          <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
          <Text style={styles.title}>Başarılı!</Text>
          <Text style={styles.text}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
            <Text style={styles.btnText}>Devam Et</Text>
          </TouchableOpacity>
        </>
      )}
      {status === 'error' && (
        <>
          <Ionicons name="close-circle" size={80} color={Colors.error} />
          <Text style={styles.title}>Hata</Text>
          <Text style={styles.text}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
            <Text style={styles.btnText}>Geri Dön</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  text: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xxl },
  btn: { backgroundColor: Colors.surface, paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  btnText: { color: Colors.textPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.md }
})