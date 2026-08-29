# SSH Workflow Kuralı

Kullanıcının SSH erişimi olan bir Ubuntu sunucusu var.

## Kurallar

1. **SSH komutlarını asla otomatik çalıştırma.**  
   Sunucuda çalıştırılması gereken her komutu, kullanıcının terminale yapıştırıp çalıştırması için açıkça ver.  
   Format: numaralı adımlar halinde, her komut ayrı bir kod bloğunda.

2. **Hiçbir adımı atlama.**  
   Yeni bir özellik veya aşama kodlamadan önce, sunucuda yapılması gereken kurulum/ayar adımları varsa bunları önce kullanıcıya ver ve tamamlanmasını bekle.

3. **Adım sırası şöyle olsun:**  
   - Sunucu kurulum komutlarını ver → Kullanıcı çalıştırır → Onay bekle → Sonra kod yaz / özellik ekle.

4. **Her büyük adımdan önce kısa bir "Bu adımda ne yapıyoruz" özeti ver.**
