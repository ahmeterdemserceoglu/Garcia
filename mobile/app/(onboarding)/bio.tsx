import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  Keyboard, TouchableWithoutFeedback
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Shadows } from '../../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Spacing'
import { useOnboardingStore } from '../../store/onboarding'

export default function OnboardingBioScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { bio, setBio, occupation, setOccupation } = useOnboardingStore()
  const inputRef = useRef<TextInput>(null)

  const handleContinue = () => {
    router.push('/(onboarding)/location')
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0D12', '#1A0D15', '#0F0D12']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>2 / 3</Text>
          </View>
        </View>

        <Text style={styles.title}>Kendini ifade et</Text>
        <Text style={styles.subtitle}>Kısa bir biyografi yaz ve ne yaptığını anlat.</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hakkımda</Text>
            <View style={[styles.inputWrapper, { height: 120, alignItems: 'flex-start', paddingVertical: Spacing.md }]}>
              <TextInput
                style={styles.textArea}
                placeholder="Doğa yürüyüşünü, kahveyi ve yeni yerler keşfetmeyi severim..."
                placeholderTextColor={Colors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={500}
                selectionColor={Colors.primary}
              />
            </View>
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meslek / Okul (İsteğe Bağlı)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Yazılım Mühendisi, TechCorp"
                placeholderTextColor={Colors.textMuted}
                value={occupation}
                onChangeText={setOccupation}
                selectionColor={Colors.primary}
              />
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradBtn}
            >
              <Text style={styles.continueBtnText}>Devam Et →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleContinue} style={styles.skipBtn}>
            <Text style={styles.skipText}>Şimdilik atla</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.xl, marginBottom: Spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  stepIndicator: { backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  stepText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  title: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.8, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  form: { gap: Spacing.xl },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, height: 56 },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  textArea: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, textAlignVertical: 'top' },
  charCount: { alignSelf: 'flex-end', fontSize: FontSize.xs, color: Colors.textMuted },
  footer: { gap: Spacing.md, paddingTop: Spacing.xl },
  continueBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.glow },
  gradBtn: { height: 58, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.md },
})
