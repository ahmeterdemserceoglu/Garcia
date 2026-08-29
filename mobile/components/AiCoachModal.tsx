import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Shadows } from '../constants/Colors'
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing'

interface Insight {
  icon: string
  title: string
  desc: string
  isGood: boolean
}

interface AiCoachModalProps {
  visible: boolean
  onClose: () => void
  user: any
}

export function AiCoachModal({ visible, onClose, user }: AiCoachModalProps) {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (visible) {
      setLoading(true)
      
      setTimeout(() => {
        analyzeProfile(user)
        setLoading(false)
      }, 2000)
    }
  }, [visible])

  const analyzeProfile = (user: any) => {
    try {
      const photosCount = Array.isArray(user?.photos) ? user.photos.length : 0;
      const rawBio = user?.profile?.bio;
      const bio = typeof rawBio === 'string' ? rawBio.trim() : "";
      
      let promptsCount = 0;
      if (user?.profile?.prompts?.answers && typeof user.profile.prompts.answers === 'object') {
        Object.values(user.profile.prompts.answers).forEach((val: any) => {
          if (typeof val === 'string' && val.trim().length > 0) {
            promptsCount++;
          }
        });
      }

      const isVerified = !!user?.isFaceVerified;

    let currentScore = 100
    const newInsights: Insight[] = []

    if (photosCount === 0) {
      newInsights.push({ icon: '📸', title: 'Fotoğraf Yok', desc: 'Görünmez adam taklidi mi yapıyorsun? Eşleşmek için fotoğraf şart.', isGood: false })
      currentScore -= 40
    } else if (photosCount < 3) {
      newInsights.push({ icon: '📸', title: 'Daha Fazla Fotoğraf', desc: 'Gerçek biri olduğunu kanıtlamak için en az 3 fotoğraf eklemelisin.', isGood: false })
      currentScore -= 15
    } else {
      newInsights.push({ icon: '✨', title: 'Harika Fotoğraflar', desc: 'Profilin görsel olarak dikkat çekici duruyor.', isGood: true })
    }

    if (!bio) {
      newInsights.push({ icon: '📝', title: 'Biyografi Boş', desc: 'Parmakların klavyeye basamayacak kadar yorgun mu? İnsanlara konuşacak malzeme ver.', isGood: false })
      currentScore -= 20
    } else if (bio.length < 10) {
      newInsights.push({ icon: '📝', title: 'Çok Kısa Biyografi', desc: 'Biraz daha detay ekleyebilirsin, kendini daha iyi tanıt.', isGood: false })
      currentScore -= 10
    } else {
      newInsights.push({ icon: '🎯', title: 'Etkili Biyografi', desc: 'Kendini iyi ifade etmişsin, harika bir sohbet başlatıcı.', isGood: true })
    }

    if (!isVerified) {
      newInsights.push({ icon: '🛡️', title: 'Doğrulanmamış Hesap', desc: 'İnsanlar bot olmadığını bilmek istiyor. Hemen doğrulan!', isGood: false })
      currentScore -= 15
    } else {
      newInsights.push({ icon: '✅', title: 'Güvenilir Profil', desc: 'Hesabın doğrulanmış, bu sana ekstra güven kazandırıyor.', isGood: true })
    }
    
    if (promptsCount === 0) {
      newInsights.push({ icon: '💬', title: 'Soru-Cevap Eksik', desc: 'Esprili cevaplarla profilini öne çıkarabilirsin.', isGood: false })
      currentScore -= 10
    } else {
      newInsights.push({ icon: '🧠', title: 'İlginç Detaylar', desc: `Profilinde ${promptsCount} adet soru-cevap var, dikkat çekici!`, isGood: true })
    }

    setInsights(newInsights)
    setScore(Math.max(10, currentScore))
    } catch (err) {
      console.log('Error analyzing profile:', err)
      setInsights([{ icon: '⚠️', title: 'Analiz Hatası', desc: 'Profiliniz analiz edilirken bir sorun oluştu.', isGood: false }])
      setScore(0)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.container}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['rgba(155,81,224,0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
            
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="sparkles" size={32} color="#9B51E0" />
              </View>
              <Text style={styles.title}>AI Profil Koçu</Text>
              <Text style={styles.subtitle}>Profilini senin için analiz ettim</Text>
            </View>

            <View style={styles.body}>
              {loading ? (
                <View style={styles.loadingArea}>
                  <ActivityIndicator color="#9B51E0" size="large" />
                  <Text style={styles.loadingText}>Yapay zeka profilini tarıyor...</Text>
                </View>
              ) : (
                <View style={styles.resultArea}>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Profil Puanın</Text>
                    <Text style={[styles.scoreValue, { color: score > 70 ? Colors.success : (score > 40 ? Colors.warning : Colors.error) }]}>
                      {score}/100
                    </Text>
                  </View>

                  <View style={styles.insightsList}>
                    {insights.map((insight, idx) => (
                      <View key={idx} style={[styles.insightCard, { borderColor: insight.isGood ? 'rgba(78,205,196,0.3)' : 'rgba(255,107,107,0.3)', backgroundColor: insight.isGood ? 'rgba(78,205,196,0.05)' : 'rgba(255,107,107,0.05)' }]}>
                        <Text style={styles.insightIcon}>{insight.icon}</Text>
                        <View style={styles.insightTextContent}>
                          <Text style={styles.insightTitle}>{insight.title}</Text>
                          <Text style={styles.insightDesc}>{insight.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <LinearGradient colors={['#9B51E0', '#6A1B9A']} style={StyleSheet.absoluteFill} />
              <Text style={styles.closeText}>Tamam, Teşekkürler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(155,81,224,0.3)',
    overflow: 'hidden',
    ...Shadows.lg
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  iconContainer: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(155,81,224,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(155,81,224,0.3)',
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#9B51E0' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  
  body: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, minHeight: 200, justifyContent: 'center' },
  loadingArea: { alignItems: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  
  resultArea: { gap: Spacing.md },
  scoreContainer: { alignItems: 'center', marginBottom: Spacing.sm },
  scoreLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' },
  scoreValue: { fontSize: 42, fontWeight: FontWeight.extrabold, letterSpacing: -1 },

  insightsList: { gap: Spacing.sm },
  insightCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    alignItems: 'flex-start'
  },
  insightIcon: { fontSize: 24 },
  insightTextContent: { flex: 1 },
  insightTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: 'bold', marginBottom: 2 },
  insightDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  closeBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
})
