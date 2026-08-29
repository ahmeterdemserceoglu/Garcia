# Kod Kalitesi & Tasarım Standartları

## Kod Yazım Kuralları

1. **Daima production-grade kod yaz.**
   - Skeleton/placeholder kod kabul edilmez — her fonksiyon gerçekten çalışır olmalı.
   - Hata yönetimi (try/catch, error boundaries) her zaman ekle.
   - Input validation, rate limiting, güvenlik kontrolleri başından dahil et.
   - Logging, graceful shutdown, health check gibi production gereksinimleri varsayılan olsun.

2. **Kapsamlı ve eksiksiz yaz.**
   - "TODO: implement later" veya "simplified for now" gibi geçiştirmeler yapma.
   - Her endpoint, bileşen veya servis tam olarak implemente edilmiş olmalı.
   - Veritabanı sorguları optimize edilmiş, index'ler düşünülmüş olmalı.

3. **Best practices zorunlu.**
   - TypeScript için strict mode, tip güvenliği tam.
   - Ayrıştırılmış, single-responsibility modüller.
   - Dependency injection, testability gözetilmeli.

## Tasarım Kuralları (UI/UX)

1. **Premium ve modern tasarım yap.**
   - Renk paletleri: harmonious, curated — jenerik kırmızı/mavi/yeşil asla.
   - Typography: Google Fonts (Inter, Plus Jakarta Sans, DM Sans, Outfit gibi).
   - Spacing sistemi tutarlı olsun (4px/8px grid).

2. **Animasyon & mikro-etkileşim ekle.**
   - Hover efektleri, geçiş animasyonları, loading state'leri.
   - Framer Motion veya CSS transitions ile hayat ver.

3. **Yasaklı estetikler:**
   - ❌ Cheesy "cyber/hacker" tarzı (neon yeşil, matrix efektleri vs.)
   - ❌ Jenerik Bootstrap/Material default görünümleri
   - ❌ Placeholder içerik ("Lorem ipsum", gri kutular)
   - ❌ Aşırı gölge/gradient yığını

4. **İzin verilen & tercih edilen:**
   - ✅ Glassmorphism (ölçülü kullanım)
   - ✅ Dark mode with warm tones
   - ✅ Subtle gradients
   - ✅ Clean whitespace / breathing room
   - ✅ İnce border'lar, soft shadows
   - ✅ Consistent icon system (Lucide, Phosphor)
