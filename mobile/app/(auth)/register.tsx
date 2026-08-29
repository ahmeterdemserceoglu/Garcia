import { useState, useRef } from 'react'
import { api } from '../../api/client'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
  Modal, ImageBackground, Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useAuthStore } from '../../store/auth'
import { useAlertStore } from '../../store/alertStore'

const GENDERS = [
  { key: 'MALE', label: 'Erkek' },
  { key: 'FEMALE', label: 'Kadın' },
  { key: 'NON_BINARY', label: 'Belirtmek İstemiyorum' },
  { key: 'OTHER', label: 'Diğer' },
]

export default function RegisterScreen() {
  const router = useRouter()
  const { register } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Date Picker Modal State
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [d, setD] = useState('')
  const [m, setM] = useState('')
  const [y, setY] = useState('')
  const monthRef = useRef<TextInput>(null)
  const yearRef = useRef<TextInput>(null)

  const validateStep1 = () => {
    if (!name.trim() || name.length < 2) {
      useAlertStore.getState().showAlert('İsim Gerekli', 'Lütfen isminizi girin (en az 2 karakter).'); return false
    }
    if (!email.trim() || !email.includes('@')) {
      useAlertStore.getState().showAlert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi girin.'); return false
    }
    if (password.length < 8) {
      useAlertStore.getState().showAlert('Zayıf Şifre', 'Şifre en az 8 karakter olmalıdır.'); return false
    }
    return true
  }

  const handleNextStep = async () => {
    if (!validateStep1()) return
    setLoading(true)
    try {
      const res = await api.checkEmail(email.trim().toLowerCase())
      if (res.data?.exists) {
        useAlertStore.getState().showAlert('E-posta Kullanımda', 'Bu e-posta adresi ile kayıtlı bir hesap zaten var. Lütfen giriş yapmayı deneyin.')
        return
      }
      setStep(2)
    } catch {
      useAlertStore.getState().showAlert('Hata', 'Sunucuya bağlanılamadı. Lütfen internetinizi kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const validateStep2 = () => {
    if (!birthDate) {
      useAlertStore.getState().showAlert('Geçersiz Tarih', 'Lütfen doğum tarihinizi seçin.'); return false
    }
    if (!gender) { useAlertStore.getState().showAlert('Cinsiyet Gerekli', 'Lütfen cinsiyetinizi seçin.'); return false }

    const parts = birthDate.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1
      const day = parseInt(parts[2])
      const birth = new Date(year, month, day)
      const now = new Date()
      let age = now.getFullYear() - birth.getFullYear()
      const m = now.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--
      }
      if (age < 18) {
        useAlertStore.getState().showAlert('Yaş Sınırı', 'Kayıt olmak için en az 18 yaşında olmanız gerekmektedir.')
        return false
      }
    } else {
      useAlertStore.getState().showAlert('Geçersiz Tarih', 'Lütfen girişlerinizi kontrol edin.')
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateStep2()) return
    if (!agreed) {
      useAlertStore.getState().showAlert('Onay Gerekli', 'Kayıt olabilmek için kullanım koşullarını, gizlilik politikasını ve KVKK metnini onaylamanız gerekmektedir.')
      return
    }
    setLoading(true)
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        birthDate: new Date(birthDate).toISOString(),
        gender,
      })
      router.replace('/(onboarding)/photos')
    } catch (err: any) {
      console.error('KAYIT HATASI:', err?.response?.data || err.message || err)
      const msg = err?.response?.data?.error || 'Kayıt başarısız. Lütfen tekrar deneyin.'
      useAlertStore.getState().showAlert('Hata', msg)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDate = () => {
    const day = parseInt(d)
    const month = parseInt(m)
    const year = parseInt(y)
    if (!day || !month || !year || day > 31 || month > 12 || year < 1900 || year > new Date().getFullYear() - 10) {
      useAlertStore.getState().showAlert('Geçersiz Tarih', 'Lütfen girişlerinizi kontrol edin.')
      return
    }
    const dateObj = new Date(year, month - 1, day)
    const age = Math.floor((Date.now() - dateObj.getTime()) / 31557600000)

    if (age < 18) {
      useAlertStore.getState().showAlert('Yaş Sınırı', 'Kayıt olmak için en az 18 yaşında olmanız gerekmektedir.')
      return
    }

    setBirthDate(`${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`)
    setShowDatePicker(false)
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../assets/register/register_bg.png')} style={StyleSheet.absoluteFill} resizeMode="cover" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => step === 1 ? router.back() : setStep(1)}>
            <Ionicons name="arrow-back" size={24} color="#1A0D15" />
          </TouchableOpacity>

          {/* Progress */}
          <View style={styles.progress}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
            </View>
            <Text style={styles.progressLabel}>Adım {step} / 2</Text>
          </View>

          {step === 1 ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Hesap oluştur</Text>
                <Text style={styles.subtitle}>Hadi başlayalım</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>İsminiz</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} placeholder="Sana nasıl hitap edelim?" placeholderTextColor="rgba(26,13,21,0.5)" value={name} onChangeText={setName} autoCapitalize="words" selectionColor={Colors.primary} />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} placeholder="sen@ornek.com" placeholderTextColor="rgba(26,13,21,0.5)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" selectionColor={Colors.primary} />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min. 8 karakter" placeholderTextColor="rgba(26,13,21,0.5)" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} selectionColor={Colors.primary} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="rgba(26,13,21,0.5)" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={handleNextStep} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Devam Et</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Senin hakkında</Text>
                <Text style={styles.subtitle}>Deneyimini kişiselleştirmemize yardımcı ol</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Doğum Tarihi</Text>
                  <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                    <Text style={[styles.input, !birthDate && { color: 'rgba(26,13,21,0.5)' }]}>
                      {birthDate ? birthDate : 'Doğum tarihini seç'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.hint}>Garcia&apos;yı kullanmak için 18 yaşında veya daha büyük olmalısın</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ben bir...</Text>
                  <View style={styles.genderGrid}>
                    {GENDERS.map((g) => (
                      <TouchableOpacity
                        key={g.key}
                        style={[styles.genderBtn, gender === g.key && styles.genderBtnActive]}
                        onPress={() => setGender(g.key)}
                        activeOpacity={0.8}
                      >
                        {gender === g.key && (
                          <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
                          />
                        )}
                        <Text style={[styles.genderText, gender === g.key && styles.genderTextActive]}>{g.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.agreementRow}>
                  <TouchableOpacity onPress={() => setAgreed(!agreed)} style={styles.checkbox}>
                    {agreed && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                  <Text style={styles.agreementText}>
                    <Text onPress={() => router.push('/legal/terms')} style={styles.linkText}>Kullanım Koşulları</Text>,{' '}
                    <Text onPress={() => router.push('/legal/privacy')} style={styles.linkText}>Gizlilik Politikası</Text> ve{' '}
                    <Text onPress={() => router.push('/legal/kvkk')} style={styles.linkText}>KVKK Metnini</Text> okudum ve onaylıyorum.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Hesap Oluştur</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* Spacer to push signup row to the bottom */}
          <View style={{ flex: 1 }} />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.signupLink}>Giriş yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Birthday Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} activeOpacity={1} />

            <View style={styles.modalContent}>
              <View style={styles.modalPill} />

              <Text style={styles.modalTitle}>Ne zaman doğdun?</Text>
              <Text style={styles.modalSub}>Bu, senin yaşlarındaki insanları bulmamıza yardımcı olur.</Text>

              <View style={styles.dateInputRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Gün</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="GG"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={d}
                    onChangeText={(val) => { setD(val); if (val.length === 2) monthRef.current?.focus() }}
                    selectionColor={Colors.primary}
                  />
                </View>

                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Ay</Text>
                  <TextInput
                    ref={monthRef}
                    style={styles.dateInput}
                    placeholder="AA"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={m}
                    onChangeText={(val) => { setM(val); if (val.length === 2) yearRef.current?.focus() }}
                    selectionColor={Colors.primary}
                  />
                </View>

                <View style={[styles.dateInputContainer, { flex: 1.5 }]}>
                  <Text style={styles.dateLabel}>Yıl</Text>
                  <TextInput
                    ref={yearRef}
                    style={styles.dateInput}
                    placeholder="YYYY"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={y}
                    onChangeText={setY}
                    selectionColor={Colors.primary}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmDate} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                  <Text style={styles.nextButtonText}>Onayla</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.xxxl },
  backButton: { marginBottom: Spacing.xl },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  progress: { marginBottom: Spacing.xxl, gap: Spacing.sm },
  progressTrack: { height: 3, backgroundColor: Colors.border, borderRadius: 99 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 99 },
  progressLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  header: { marginBottom: Spacing.xxl, gap: Spacing.sm },
  title: { fontSize: 36, fontWeight: FontWeight.extrabold, color: '#1A0D15', letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: 'rgba(26,13,21,0.7)' },
  form: { gap: Spacing.xl, marginBottom: Spacing.xl },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: '#1A0D15', letterSpacing: 0.8, textTransform: 'uppercase' },
  hint: { fontSize: FontSize.xs, color: 'rgba(26,13,21,0.7)' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1.5, borderColor: 'rgba(26, 13, 21, 0.1)', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, height: 56 },
  input: { flex: 1, fontSize: FontSize.md, color: '#1A0D15', paddingVertical: 14 },
  eyeBtn: { padding: Spacing.sm },
  eyeText: { fontSize: 18 },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  genderBtn: { flex: 1, minWidth: '45%', height: 52, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: 'rgba(26,13,21,0.2)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 4 },
  genderBtnActive: { borderColor: Colors.primary },
  genderText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: 'rgba(26,13,21,0.6)', textAlign: 'center' },
  genderTextActive: { color: '#fff' },
  actionBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow, marginBottom: Spacing.xl },
  actionBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { color: '#1A0D15', fontSize: FontSize.md },
  signupLink: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold, textDecorationLine: 'underline' },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(26,13,21,0.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', marginTop: 2 },
  agreementText: { flex: 1, fontSize: FontSize.xs, color: 'rgba(26,13,21,0.7)', lineHeight: 18 },
  linkText: { color: Colors.primary, fontWeight: FontWeight.bold },

  /* Modal Styles */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, paddingBottom: 40, borderWidth: 1, borderColor: Colors.border },
  modalPill: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: 24, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
  dateInputRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  dateInputContainer: { flex: 1, gap: Spacing.xs },
  dateLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: FontWeight.bold },
  dateInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, height: 60, fontSize: 22, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  modalConfirmBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow },
  gradientBtn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  nextButtonText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
})
