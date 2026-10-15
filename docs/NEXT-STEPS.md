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

1. Yayınlanan sürümde aşağıdaki ayrı güvenlik taramasını yap; GitHub anahtar uyarısını incele ve bulguları düzelt. İnceleme bitmeden güvenli olduğumuzu veya uyarının çözüldüğünü söyleme.
2. Ödeme test araçlarını normal alışveriş akışından ayır: 1 TL tanılama ve çevrimdışı demo kontrolleri normal checkout'u karıştırmasın. Başarı, bekleme, reddetme ve yeniden deneme mesajlarını netleştir. Sağlayıcı hatasını doğrulamadan başarısız ödeme diye sınıflandırma.
3. Pip'i gerçek AI yardımcısına bağla. API anahtarı yalnızca sunucuda; yalnızca mevcut katalog ürünlerini önerir, fiyat/özellik uydurmaz. Kişisel bilgi veya ödeme bilgisi modele gönderilmez. Hata/zaman aşımında mevcut katalog yardımcısı kullanılabilir.
4. Mobil görünüm, klavye kullanımı, yüklenme/hata/boş durumları ve kullanıcıya gösterilen teknik metinleri son kez düzenle. Yeni özellik kapsamını büyütme.
5. Yeni değişiklikleri de kapsayan son güvenlik kontrolünü yap. Özellikle yeni AI anahtarının repo, geçmiş, log ve istemci paketlerine girmediğini doğrula.
6. Aşağıdaki kapsamlı bug taramasını yap, bulunan sorunları düzelt, etkilenen akışları tekrar test et.
7. Son sürümü yayınla. Oturum açmamış bir ziyaretçi olarak canlı bağlantıyı ve public repoyu kontrol et. Agent kayıtlarının düzenli commit edildiğini doğrula.
8. Videoları hazırlayıp teslim alanlarını doldur. Kullanıcının onayı olmadan teslim formunu gönderme.

## Bug taramasından önce ayrı güvenlik taraması

- GitHub: güncel dosyaları ve erişilebilir tüm branch/tag/commit geçmişini, `.agent-logs/`, Actions loglarını ve yayın artefaktlarını gizli anahtar/token/kişisel veri açısından tara. Secret scanning uyarılarının dosya, commit ve türlerini incele; anahtar değerlerini raporda tekrar etme.
- Yayınlanan istemci: GitHub Pages ve Vercel JavaScript paketleri, varsa kaynak haritaları ve ağ yanıtlarında iyzico Secret/API Key, ödeme oturum anahtarı, özel Firebase yönetici anahtarı, AI anahtarı veya kullanıcı tokenı bulunmadığını kontrol et. Herkese açık Firebase web yapılandırmasını gizli sunucu anahtarlarından ayrı değerlendir.
- Vercel: ödeme anahtarlarının yalnızca sunucu ortam değişkenlerinde olduğunu; `VITE_` önekiyle istemciye taşınmadığını, API hataları ve loglarda yazılmadığını kontrol et. Production/Preview kapsamlarını incele; gerçek canlı ödeme anahtarları ekleme.
- Firebase: web anahtarının uygulama/API kısıtlamalarını, yetkili domainleri, Authentication ayarlarını, Firestore kurallarını ve iki hesap arasında sepet/favori/liste izolasyonunu kontrol et. Firebase uyarısını sırf web anahtarı olduğu için incelemeden kapatma.
- API güvenliği: oturum doğrulama, e-posta doğrulaması, sahiplik, fiyat/adet doğrulaması, imza/para birimi/tutar eşleşmesi, CORS, callback yetkisi ve kötüye kullanım sınırlarını gözden geçir. Eksikleri bulgu olarak kaydet.
- Gerçek bir gizli anahtar sızıntısında önce sağlayıcıdan iptal et/yenile, sonra ortam değişkenlerini güncelle ve tekrar yayınla. Dosyadan silmek geçmişteki sızıntıyı düzeltmez. Gerekirse geçmiş temizliği planını ayrıca değerlendir; commit geçmişini kendiliğinden yeniden yazma.
- Bulguları önem derecesi, kanıt konumu, düzeltme ve tekrar test sonucu ile kaydet. Taramayı geçmeden tamamlandı diye işaretleme. Otomatik agent kayıtlarını gelişigüzel silme veya değiştirme.

Güncel sıra: son değişiklikleri yayınlama → güvenlik taraması ve düzeltmeler → kalan özellikler → son güvenlik kontrolü → geniş bug taraması → videolar ve teslim.

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
