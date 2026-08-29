import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, FontSize, FontWeight } from '../../constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';

export default function TermsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString('tr-TR');
  const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanım Koşulları</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dynamicHeader}>
          <Text style={styles.dynamicLabel}>Sözleşme Tarihi:</Text>
          <Text style={styles.dynamicValue}>{today} - {time}</Text>
          
          <Text style={styles.dynamicLabel}>Kullanıcı (Taraf):</Text>
          <Text style={styles.dynamicValue}>{user?.name || 'Ziyaretçi'} {user?.email ? `(${user.email})` : ''}</Text>
          
          <Text style={styles.dynamicLabel}>Hizmet Sağlayıcı:</Text>
          <Text style={styles.dynamicValue}>Garcia App Teknolojileri A.Ş.</Text>
        </View>

        <Text style={styles.text}>
          <Text style={styles.bold}>1. KABUL VE ŞARTLAR</Text>{'\n'}
          Bu sözleşme, yukarıda bilgileri yer alan {user?.name || 'Kullanıcı'} ile Garcia App arasında {today} tarihinde dijital ortamda onaylanarak yürürlüğe girmiştir. Hesabınızı kullanarak bu Kullanım Koşullarını, Gizlilik Politikamızı ve Topluluk Kurallarımızı okuduğunuzu, anladığınızı ve bağlayıcı bir sözleşme olarak kabul ettiğinizi beyan edersiniz.{'\n\n'}
          <Text style={styles.bold}>2. UYGUNLUK VE KULLANICI BEYANI</Text>{'\n'}
          {user?.name || 'Kullanıcı'}, Garcia'yı kullanabilmek için en az on sekiz (18) yaşında olduğunu ve sağladığı profil bilgilerinin gerçeği yansıttığını garanti eder.{'\n\n'}
          <Text style={styles.bold}>3. HESABINIZ VE GÜVENLİK</Text>{'\n'}
          Hesap oluştururken kayıtlı olan {user?.email || 'e-posta'} adresi ve hesabın güvenliğinden {user?.name || 'Kullanıcı'} tamamen sorumludur. Hesap üzerinden yapılan tüm işlemler kendi rızasıyla yapılmış sayılır.{'\n\n'}
          <Text style={styles.bold}>4. TOPLULUK KURALLARI VE KULLANICI İÇERİĞİ</Text>{'\n'}
          Platformda paylaştığınız tüm fotoğraflar, metinler ve mesajlar ("İçerik") sizin sorumluluğunuzdadır. Nefret söylemi, müstehcenlik, şiddet, taciz veya başkalarının haklarını ihlal eden herhangi bir içerik paylaşmak kesinlikle yasaktır. Garcia, kuralları ihlal eden içerikleri kaldırma ve hesapları önceden bildirmeksizin kapatma hakkını saklı tutar.{'\n\n'}
          <Text style={styles.bold}>5. ÜCRETLİ HİZMETLER (PREMIUM)</Text>{'\n'}
          Garcia, bazı özellikleri ücretsiz sunarken, "Premium" abonelikler ve uygulama içi satın alımlar sunabilir. Satın alma işlemleri ilgili uygulama mağazası (Apple App Store veya Google Play Store) aracılığıyla yönetilir.{'\n\n'}
          <Text style={styles.bold}>6. HİZMET DEĞİŞİKLİKLERİ VE FESİH</Text>{'\n'}
          Garcia, hizmetleri herhangi bir zamanda geçici veya kalıcı olarak değiştirme, durdurma veya sonlandırma hakkını saklı tutar. Kullanım Koşullarını ihlal etmeniz durumunda, hesabınıza erişiminiz derhal iptal edilebilir.{'\n\n'}
          <Text style={styles.bold}>7. ONAY VE KABUL</Text>{'\n'}
          İşbu Kullanım Koşulları, {user?.name || 'Kullanıcı'} tarafından {today} saat {time}'da mobil cihaz üzerinden elektronik olarak onaylanmıştır.
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
