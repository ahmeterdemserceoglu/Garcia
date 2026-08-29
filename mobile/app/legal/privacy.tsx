import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, FontSize, FontWeight } from '../../constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';

export default function PrivacyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString('tr-TR');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dynamicHeader}>
          <Text style={styles.dynamicLabel}>Veri Sorumlusu:</Text>
          <Text style={styles.dynamicValue}>Garcia App Teknolojileri A.Ş.</Text>
          
          <Text style={styles.dynamicLabel}>İlgili Kişi (Kullanıcı):</Text>
          <Text style={styles.dynamicValue}>{user?.name || 'Ziyaretçi'} {user?.email ? `(${user.email})` : ''}</Text>
          
          <Text style={styles.dynamicLabel}>Okunma Tarihi:</Text>
          <Text style={styles.dynamicValue}>{today}</Text>
        </View>

        <Text style={styles.text}>
          <Text style={styles.bold}>1. BİZE HANGİ BİLGİLERİ SAĞLIYORSUNUZ?</Text>{'\n'}
          Sayın {user?.name || 'Kullanıcı'}, Garcia'yı kullanırken; adınız, yaşınız, e-posta adresiniz ({user?.email || 'kayıtlı e-posta adresiniz'}), biyografiniz, konumunuz, yüklediğiniz fotoğraflar ve eşleşme tercihleriniz dahil olmak üzere kişisel bilgilerinizi topluyoruz. Premium abonelik satın almanız durumunda, finansal verileriniz ilgili ödeme altyapısı (App Store/Google Play) tarafından güvenle işlenir.{'\n\n'}
          <Text style={styles.bold}>2. BİLGİLERİ NASIL KULLANIYORUZ?</Text>{'\n'}
          Toplanan veriler, size uygun eşleşmeler sunmak, "Keşfet" ve "Harita" gibi konum bazlı özelliklerimizi iyileştirmek, AI Koç özelliğimizle profil önerileri sağlamak ve hesabınızın güvenliğini (yüz doğrulama vb.) garanti altına almak amacıyla kullanılmaktadır.{'\n\n'}
          <Text style={styles.bold}>3. KONUM VERİLERİ</Text>{'\n'}
          Garcia, "Yakındaki Kullanıcılar" ve "Maksimum Mesafe" ayarlarınızı çalıştırabilmek için arka planda ve ön planda konum verinize erişebilir. Seyahat Modu (Passport) kullandığınızda geçici olarak belirlediğiniz konum dikkate alınır.{'\n\n'}
          <Text style={styles.bold}>4. ÜÇÜNCÜ TARAFLARLA PAYLAŞIM</Text>{'\n'}
          Verileriniz (ad, yaş, fotoğraflar ve biyografi), uygulamanın işleyişi gereği diğer kullanıcılarla paylaşılır. E-posta adresiniz, konumunuzun tam koordinatları ve şifreleriniz kesinlikle diğer kullanıcılarla veya reklam amacıyla üçüncü taraflarla paylaşılmaz. Yalnızca hukuki süreçler (mahkeme kararları vb.) kapsamında yetkili mercilerle paylaşım yapılabilir.{'\n\n'}
          <Text style={styles.bold}>5. VERİ GÜVENLİĞİ</Text>{'\n'}
          Hesabınızı korumak için sektör standardı şifreleme yöntemleri (SSL/TLS) kullanıyoruz. Ancak, internet üzerinden yapılan hiçbir veri iletiminin %100 güvenli olmadığını hatırlatırız.{'\n\n'}
          <Text style={styles.bold}>6. HAKLARINIZ</Text>{'\n'}
          Hesap bilgilerinizi istediğiniz zaman düzenleyebilir, profilinizi silebilir veya bilgilerinize erişim talep edebilirsiniz.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backButton: { padding: Spacing.xs },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  content: { padding: Spacing.xl },
  dynamicHeader: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dynamicLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  dynamicValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  text: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  bold: { fontWeight: FontWeight.bold, color: Colors.textPrimary }
});
