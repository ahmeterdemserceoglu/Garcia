import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter, useGlobalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'

export default function ResetPasswordScreen() {
  const { token } = useGlobalSearchParams<{ token: string }>()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleReset = async () => {
    if (!token) return alert('Geçersiz veya eksik token. Lütfen linke tekrar tıklayın.')
    if (password.length < 8) return alert('Şifreniz en az 8 karakter olmalıdır.')
    setLoading(true)
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        alert(data.error || 'Şifre sıfırlanırken bir hata oluştu.')
      }
    } catch (e) {
      alert('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yeni Şifre Belirle</Text>
      <Text style={styles.subtitle}>
        Lütfen hesabınız için yeni bir şifre girin.
      </Text>

      {success ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
          <Text style={styles.successText}>Şifreniz başarıyla güncellendi!</Text>
          <TouchableOpacity style={[styles.btn, { marginTop: 20, width: '100%' }]} onPress={() => router.replace('/login')}>
            <Text style={styles.btnText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Yeni Şifre"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Şifreyi Güncelle</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xxl, paddingTop: 60, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxxl, lineHeight: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, height: 56, marginBottom: Spacing.xxl },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  btn: { height: 56, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  successBox: { alignItems: 'center', padding: Spacing.xl, backgroundColor: 'rgba(232,82,106,0.1)', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(232,82,106,0.3)' },
  successText: { color: Colors.textPrimary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 22, fontSize: FontSize.md }
})