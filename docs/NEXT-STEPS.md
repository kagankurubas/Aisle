# Aisle — devam planı

## Şimdi tamamlananlar

- USD sepet ödemesi sunucudan doğrulandığında, ödeme oturumundaki satın alınan adetler sepetten düşer. Sonradan eklenen adetler ve farklı ürünler kalır. Aynı referans mevcut uygulama oturumunda iki kez uygulanmaz.
- Ayrı 1 TL hata testi, başarısız ve bekleyen ödeme sepeti değiştirmez.
- Favorilerden ayrı isimli alışveriş listeleri: oluşturma, yeniden adlandırma, silme, ürün ekleme/çıkarma ve listeden sepete ekleme.
- Listeler doğrulanmış kullanıcıya ait Firestore yolunda tutulur; başka kullanıcıların erişimi engellenir.
- 14 uygulama testi, 7 Firestore emülatör testi ve üretim derlemesi geçti. Bu sürümün canlı tarayıcı testi henüz yapılmadı.

## Bir sonraki oturumda ilk iş: bu sürümü yayınlama

1. Aynı çıktılar klasöründeki `firestore.rules` dosyasının tamamını Firebase → Firestore Database → Rules alanına yapıştır ve Publish seç. Bu güncelleme olmadan yeni liste özelliğine erişim reddedilir.
2. PowerShell:

   ```powershell
   powershell -NoProfile -File "D:\Codex\aisle\scripts\publish-github.ps1"
   ```

3. En yeni GitHub Pages çalışması ve Vercel yayını başarılı olduğunda Ctrl+F5 yap.
4. Yeni bir USD ödeme oturumu açıp doğrula: satın alınan adetlerin sepetten düştüğünü, yenileme ve yeniden giriş sonrasında da doğru kaldığını kontrol et. Önceki sürümden açık ödeme oturumunu kullanma.
5. Hesap → Shopping lists bölümünde liste oluştur; ürün detayından o listeye ekle; yeniden adlandır, ürün çıkar ve liste sil. Yenileme/yeniden girişle kalıcılığı kontrol et.

## Ürünü bitirme sırası

1. Ödeme test araçlarını normal alışveriş akışından ayır: 1 TL tanılama ve çevrimdışı demo kontrolleri normal checkout'u karıştırmasın. Başarı, bekleme, reddetme ve yeniden deneme mesajlarını netleştir. Sağlayıcı hatasını doğrulamadan başarısız ödeme diye sınıflandırma.
2. Pip'i gerçek AI yardımcısına bağla. API anahtarı yalnızca sunucuda; yalnızca mevcut katalog ürünlerini önerir, fiyat/özellik uydurmaz. Kişisel bilgi veya ödeme bilgisi modele gönderilmez. Hata/zaman aşımında mevcut katalog yardımcısı kullanılabilir.
3. Mobil görünüm, klavye kullanımı, yüklenme/hata/boş durumları ve kullanıcıya gösterilen teknik metinleri son kez düzenle. Yeni özellik kapsamını büyütme.
4. Aşağıdaki kapsamlı bug taramasını yap, bulunan sorunları düzelt, etkilenen akışları tekrar test et.
5. Son sürümü yayınla. Oturum açmamış bir ziyaretçi olarak canlı bağlantıyı ve public repoyu kontrol et. Agent kayıtlarının düzenli commit edildiğini ve gizli sunucu anahtarlarının repoda bulunmadığını doğrula.
6. Videoları hazırlayıp teslim alanlarını doldur. Kullanıcının onayı olmadan teslim formunu gönderme.

## Son geniş kapsamlı bug taraması

- Kimlik: Google, e-posta kayıt/giriş, doğrulama, parola sıfırlama, çıkış, hesap değiştirme, yetkisiz/boş oturum. İki farklı hesabın sepet/favori/liste verilerinin karışmaması.
- Katalog: arama, kategoriler, bütçe/sıralama, sonuç yok, ürün modalı, stok sınırı, görseller, uzun metinler.
- Favoriler/listeler: tekrar ekleme, boş liste, uzun/boş isim, ürün çıkarma, silme onayı, bağlantı hatası, kalıcılık ve erişim kuralları.
- Sepet: adet artır/azalt/sil, stok, teslimat eşiği, farklı ve sonradan eklenen ürünleri koruma, ödeme sonrası doğru adetlerin düşmesi.
- Ödeme: USD başarı, gerçek sağlayıcı hata testi, ödeme tamamlanmadan sorgulama, pencereyi kapatma, tekrar sorgulama, tekrar deneme, oturum süresi, hesap değişimi, popup engeli, ağ hatası. TRY tanılamanın USD sepetini tamamlamaması veya temizlememesi.
- Karşılaştırma: aynı tür şartı, en fazla üç ürün, yalnızca farklar, çıkarma ve mobil yatay kaydırma.
- Pip: bütçe/ürün türü, yalnızca geçerli ürün önerileri, ilgisiz istek, model hatası ve zaman aşımı, anahtarın ön yüze sızmaması.
- Gezinme: hesap sayfası bölüm bağlantıları, tarayıcı geri/ileri, yenileme/doğrudan bağlantı, modal aç/kapat, bildirimlerin üstte görünmesi.
- Erişilebilirlik: klavye, odak yönetimi, etiketler, hata/başarı duyuruları, kontrast ve azaltılmış hareket.
- Performans: mobil/masaüstü, yavaş bağlantı, lazy loading, görsel boyutları, konsol/ağ hataları, değişiklikten sonra eski önbellek.
- Güvenlik: kullanıcılar arası erişim, doğrulanmamış hesap, hatalı veri, fiyat/adet manipülasyonu, provider imzası ve para birimi, CORS, repoda/bundle'da sunucu anahtarı, loglarda token/kişisel veri.

## Video ve teslim

- Walkthrough: en fazla 5 dakika, kamera açık ve sesli anlatım. Ürün fikri → keşif/karşılaştırma → liste/hesap → başarılı Sandbox ödeme → önemli ürün kararları ve dürüst sınırlamalar.
- Formdaki ayrı 1 dakikalık intro: CV'de bulunmayan kişisel motivasyon/çalışma yaklaşımı. Walkthrough'dan ayrı alan.
- Linkler etiketli: canlı site ve public GitHub repo. Videoların bağlantıları değerlendirici tarafından erişilebilir olmalı.
- Demo/test ödemeleri gerçek ödeme veya gerçek sipariş işleme olarak anlatılmamalı. Kalıcı sağlayıcı onaylı sipariş geçmişi/fulfilment henüz yok.

Bu plan kaydedildi. Otomatik alarm veya sabah çalışması planlanmadı; kullanıcı döndüğünde devam edilecek.
