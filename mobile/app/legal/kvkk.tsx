import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Spacing, FontSize, FontWeight } from '../../constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';

export default function KvkkScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString('tr-TR');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KVKK Aydınlatma Metni</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dynamicHeader}>
          <Text style={styles.dynamicLabel}>Veri Sorumlusu:</Text>
          <Text style={styles.dynamicValue}>Garcia App Teknolojileri A.Ş.</Text>
          
          <Text style={styles.dynamicLabel}>Veri Sahibi (İlgili Kişi):</Text>
          <Text style={styles.dynamicValue}>{user?.name || 'Ziyaretçi'} {user?.email ? `(${user.email})` : ''}</Text>
          
          <Text style={styles.dynamicLabel}>İşlem Tarihi:</Text>
          <Text style={styles.dynamicValue}>{today}</Text>
        </View>

        <Text style={styles.text}>
          <Text style={styles.bold}>1. VERİ SORUMLUSUNUN KİMLİĞİ</Text>{'\n'}
          Kişisel verileriniz, veri sorumlusu sıfatıyla Garcia ("Uygulama") tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca işlenmektedir.{'\n\n'}
          <Text style={styles.bold}>2. İŞLENEN KİŞİSEL VERİLERİNİZ</Text>{'\n'}
          Sayın {user?.name || 'Kullanıcı'}, kayıt ve kullanım aşamasında şu kişisel verileriniz işlenir: Kimlik bilgileri (Ad, soyad, doğum tarihi, cinsiyet), İletişim bilgileri (E-posta), Konum verileri, Görsel kayıtlar (Fotoğraflar, yüz doğrulama verileri) ve Uygulama içi etkileşim verileri (Beğeniler, mesajlar, tercihler).{'\n\n'}
          <Text style={styles.bold}>3. KİŞİSEL VERİLERİN İŞLENME AMACI</Text>{'\n'}
          Verileriniz; size uygun adaylarla eşleştirme sağlamak, harita bazlı keşif özelliklerini çalıştırmak (örn. Yakındaki Kullanıcılar, Hızlı Buluşma), yapay zeka (AI Koç) algoritmasını besleyerek profilinize özel flört tavsiyeleri oluşturmak ve güvenliğinizi sağlamak amacıyla işlenmektedir.{'\n\n'}
          <Text style={styles.bold}>4. KİŞİSEL VERİLERİN AKTARIMI</Text>{'\n'}
          Kişisel verileriniz, Garcia içerisindeki yapısı gereği diğer kullanıcılar tarafından görülebilir. Konum ve e-posta adresiniz hiçbir koşulda diğer kullanıcılarla açıkça paylaşılmaz. Verileriniz, uygulamanın teknik altyapısını sağlayan bulut hizmet sağlayıcıları ve yasal zorunluluklar halinde resmi kurumlar ile paylaşılabilir.{'\n\n'}
          <Text style={styles.bold}>5. KİŞİSEL VERİ TOPLAMA YÖNTEMİ VE HUKUKİ SEBEBİ</Text>{'\n'}
          Kişisel verileriniz, uygulamaya kaydınız ve kullanımınız sırasında otomatik (GPS) veya yarı otomatik yöntemlerle, KVKK madde 5/2 uyarınca "Sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması" ile açık rızanıza dayanarak toplanmaktadır.{'\n\n'}
          <Text style={styles.bold}>6. HAKLARINIZ (KVKK Madde 11)</Text>{'\n'}
          KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, amacına uygun kullanılıp kullanılmadığını sorma, eksik/yanlış verilerin düzeltilmesini ve silinmesini (unutulma hakkı) talep etme haklarına sahipsiniz. Başvurularınızı destek@garcia.app üzerinden yapabilirsiniz.
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
