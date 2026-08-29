import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';

import { api } from '../api/client';
import { useAlertStore } from '../store/alertStore';
import { usePurchasesStore } from '../store/usePurchasesStore';
import { Colors } from '../constants/Colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Spacing';

// Özellikler – basit liste
const FEATURES = [
  { icon: 'eye-outline', title: 'Seni Beğenenleri Gör' },
  { icon: 'star-outline', title: 'Günde 5 Süper Beğeni' },
  { icon: 'infinite-outline', title: 'Sınırsız Beğeni' },
  { icon: 'navigate-outline', title: 'Seyahat Modu' },
];

export default function PremiumScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const { offerings: packages = [], purchasePackage } = usePurchasesStore();

  // Paketler yüklendiğinde ilkini seç
  if (packages.length > 0 && !selectedPackageId) {
    setSelectedPackageId(packages[0].identifier);
  }

  const selectedPackage = packages.find((p) => p.identifier === selectedPackageId) || packages[0];

  const handleRealPurchase = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    try {
      const success = await purchasePackage(selectedPackage);
      if (success) {
        await api.upgradePremium();
        useAlertStore.getState().showAlert(
          'Hoş Geldin!',
          'Garcia Premium avantajlarına artık sahipsin.'
        );
        router.back();
      } else {
        useAlertStore.getState().showAlert(
          'İptal Edildi',
          'Ödeme işlemi tamamlanmadı.'
        );
      }
    } catch (e: any) {
      if (e?.code === 'PURCHASE_CANCELLED' || e?.userCancelled) {
        useAlertStore.getState().showAlert(
          'İptal Edildi',
          'Ödeme işlemi tamamlanmadı.'
        );
      } else {
        useAlertStore.getState().showAlert(
          'Hata',
          'Ödeme işlemi sırasında bir sorun oluştu.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(232,82,106,0.15)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Üst bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Başlık */}
        <View style={styles.titleSection}>
          <View style={styles.diamondIcon}>
            <Ionicons name="diamond" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.mainTitle}>Garcia Premium</Text>
          <Text style={styles.subtitle}>
            Tüm özelliklerin kilidini aç, eşleşmeni hızlandır.
          </Text>
        </View>

        {/* Özellik listesi – dikey ve kompakt */}
        <View style={styles.featuresList}>
          {FEATURES.map((feat, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feat.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{feat.title}</Text>
            </View>
          ))}
        </View>

        {/* Paket seçimi – dikey kartlar, tam genişlik */}
        <View style={styles.packageSection}>
          <Text style={styles.sectionLabel}>PLAN SEÇ</Text>
          {packages.map((pack) => {
            const isSelected = pack.identifier === selectedPackage?.identifier;
            const isPopular = pack.identifier.toLowerCase().includes('annual');
            return (
              <TouchableOpacity
                key={pack.identifier}
                style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                onPress={() => setSelectedPackageId(pack.identifier)}
                activeOpacity={0.8}
              >
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
                  </View>
                )}
                <View style={styles.packageInfo}>
                  <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>
                    {pack.product.title.replace(/\s*\(.*\)\s*$/, '').trim()}
                  </Text>
                  <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
                    {pack.product.priceString}
                  </Text>
                  <Text style={styles.packageDescription}>{pack.product.description}</Text>
                </View>
                <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
          {packages.length === 0 && (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Paketler Yükleniyor...</Text>
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 10 }} />
            </View>
          )}
        </View>

        {/* Satın alma butonu – altta sabit durmuyor ama içerik sonunda */}
        <TouchableOpacity
          style={styles.purchaseBtn}
          onPress={handleRealPurchase}
          disabled={loading || !selectedPackage}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseBtnText}>
              {selectedPackage
                ? `Premium'a Geç – ${selectedPackage.product.priceString}`
                : 'Paketler Yükleniyor...'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.secureNote}>
          <Ionicons name="shield-checkmark-outline" size={12} color={Colors.textSecondary} />
          {'  '}Güvenli ödeme · İstediğin zaman iptal et
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-start',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  diamondIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232,82,106,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  featuresList: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(232,82,106,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  featureTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  packageSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(232,82,106,0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    zIndex: 1,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  packageInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  packageTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  packageTitleSelected: {
    color: Colors.primary,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  packagePriceSelected: {
    color: Colors.primary,
  },
  packageDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  purchaseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  purchaseBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  secureNote: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});