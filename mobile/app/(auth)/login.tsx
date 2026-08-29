import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, ImageBackground
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useAuthStore } from '../../store/auth'
import ErrorModal from '../../components/ui/ErrorModal'
// @ts-ignore
import * as Device from 'expo-device'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [errorVisible, setErrorVisible] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  // Forgot Password States
  const [forgotModalVisible, setForgotModalVisible] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setErrorVisible(true)
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      showError('Lütfen e-posta adresinizi girin.')
      return
    }
    setForgotLoading(true)
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
      })
      const data = await res.json()
      if (res.ok) {
        setForgotModalVisible(false)
        setTimeout(() => alert('Şifre sıfırlama bağlantısı gönderildi! Lütfen e-postanızı (veya konsolu) kontrol edin.'), 500)
      } else {
        showError(data.error || 'E-posta kaydı bulunamadı.')
      }
    } catch (e) {
      showError('Sunucuya bağlanılamadı.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showError('Lütfen tüm alanları doldurun.')
      return
    }
    setLoading(true)
    try {
      const deviceId = Device.osBuildId || Device.osInternalBuildId || 'unknown'
      const deviceName = Device.modelName || 'unknown'
      await login(email.trim().toLowerCase(), password, deviceId, deviceName)
      router.replace('/(tabs)/discover')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Giriş başarısız. Lütfen tekrar deneyin.'
      showError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../assets/register/register_bg.png')} style={StyleSheet.absoluteFill} resizeMode="cover" />

      <ErrorModal 
        visible={errorVisible} 
        message={errorMsg} 
        onClose={() => setErrorVisible(false)} 
      />

      {/* Forgot Password Modal */}
      <Modal visible={forgotModalVisible} transparent animationType="fade" onRequestClose={() => setForgotModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(232,82,106,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md }}>
                  <Ionicons name="lock-closed" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Şifremi Unuttum</Text>
                <Text style={styles.modalSubtitle}>Kayıtlı e-posta adresinizi girin, size bir sıfırlama linki gönderelim.</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-posta</Text>
                <View style={[styles.inputWrapper, { marginBottom: Spacing.xl }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="sen@ornek.com"
                    placeholderTextColor="rgba(26,13,21,0.5)"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    selectionColor={Colors.primary}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(26,13,21,0.1)' }]} 
                  onPress={() => setForgotModalVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: '#1A0D15' }]}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.primary }]} 
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff' }]}>Gönder</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A0D15" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tekrar hoş geldin</Text>
          <Text style={styles.subtitle}>Yolculuğuna devam etmek için giriş yap</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="sen@ornek.com"
                placeholderTextColor="rgba(26,13,21,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={Colors.primary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 8 karakter"
                placeholderTextColor="rgba(26,13,21,0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                selectionColor={Colors.primary}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setKeepSignedIn(!keepSignedIn)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, keepSignedIn && styles.checkboxActive]}>
                {keepSignedIn && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Oturumu açık tut</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7} onPress={() => setForgotModalVisible(true)}>
              <Text style={styles.forgotText}>Şifreni mi unuttun?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginButtonText}>Giriş Yap</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Spacer to push signup row to the bottom */}
        <View style={{ flex: 1 }} />

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Hesabın yok mu? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.signupLink}>Hesap oluştur</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.xxxl,
  },
  backButton: { marginBottom: Spacing.xxl },
  backText: { color: '#1A0D15', fontSize: FontSize.md, fontWeight: FontWeight.medium },
  header: { marginBottom: Spacing.xxxl, gap: Spacing.sm },
  title: { fontSize: 36, fontWeight: FontWeight.extrabold, color: '#1A0D15', letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: 'rgba(26,13,21,0.7)' },
  form: { gap: Spacing.xl, marginBottom: Spacing.xl },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#1A0D15', letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(26, 13, 21, 0.1)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 56,
  },
  input: { flex: 1, fontSize: FontSize.md, color: '#1A0D15' },
  eyeBtn: { padding: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(26,13,21,0.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxLabel: { color: '#1A0D15', fontSize: FontSize.sm },
  forgotBtn: {},
  forgotText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  loginButton: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow, marginBottom: Spacing.xl },
  gradientBtn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { color: '#1A0D15', fontSize: FontSize.md },
  signupLink: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,13,21,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', backgroundColor: '#FDF7FA', borderRadius: BorderRadius.xxl, padding: Spacing.xxl, ...Shadows.lg },
  modalTitle: { fontSize: 24, fontWeight: FontWeight.extrabold, color: '#1A0D15', marginBottom: Spacing.xs, textAlign: 'center' },
  modalSubtitle: { fontSize: FontSize.sm, color: 'rgba(26,13,21,0.7)', textAlign: 'center', lineHeight: 20 },
  modalBtn: { flex: 1, height: 56, borderRadius: BorderRadius.xl, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold }
})
