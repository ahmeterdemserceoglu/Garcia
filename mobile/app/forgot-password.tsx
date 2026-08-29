import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSend = async () => {
    if (!email) return alert('Lütfen e-posta adresinizi girin.')
    setLoading(true)
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })
      setSuccess(true)
    } catch (e) {
      alert('Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      
      <Text style={styles.title}>Şifremi Unuttum</Text>
      <Text style={styles.subtitle}>
        Hesabınıza kayıtlı e-posta adresini girin. Şifrenizi sıfırlamanız için size bir bağlantı göndereceğiz.
      </Text>

      {success ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
          <Text style={styles.successText}>
            Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir. Lütfen gelen kutunuzu (veya backend konsolunu) kontrol edin.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta Adresi"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sıfırlama Linki Gönder</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xxl, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
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