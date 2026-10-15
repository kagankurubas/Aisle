# Aisle — mobil görünüm kontrolü · 15 Ekim 2026

Yerel geliştirme sürümü, tarayıcıda 320 × 740, 390 × 844 ve 430 × 932 görünüm boyutlarında kontrol edildi. Bu bir gerçek iOS/Android cihaz testi değildir.

## Düzeltilenler
- 320 pikselde üst menünün iki satıra bölünmesi: logo ve menü aralıkları düzenlendi.
- Mobil üst menü, ürün ekleme, adet ve kapatma düğmelerinin dokunma alanları 44 piksele çıkarıldı.
- Fiyat ve indirim bilgileri ayrı satırlara alındı; büyüyen ekleme düğmeleri kartı sıkıştırmıyor.
- Küçük ekranda hesap favorilerindeki işlem düğmelerinin yatay taşması düzeltildi.
- Sepet işlemleri alt satıra alındı; kaydet/kaldır metinleri büyütüldü.
- Mobil giriş, arama ve form alanları 16 piksele çıkarıldı. iOS alan odaklama yakınlaştırmasını önlemeye uygun boyut; gerçek Safari üzerinde ayrıca denenmeli.
- 320 pikselde ana başlık ve Pip tanıtım yerleşimi sadeleştirildi.
- Karşılaştırma tablosuna yana kaydırma ipucu ve klavyeyle odaklanabilen kaydırma alanı eklendi.
- İlk ziyaret varsayılan teması açık. Kaydedilmiş kullanıcı tercihi korunuyor.

## Kontrol edilenler
- Ana sayfa, kategori gezintisi, ürün kartları: açık ve koyu tema.
- Ürün hızlı görünümü ve tam ürün sayfası.
- Sepet, adet kontrolleri ve teslimat/ödeme önizlemesi.
- Boş isimle teslimat adımı ilerlemiyor; dolu form Review adımını açıyor.
- 2 ve 3 ürünlü karşılaştırma çubuğu; tablo kendi alanında yatay kayıyor.
- Giriş formu; alanlar 16 piksel, yatay taşma yok.
- Hesap genel bakış, liste ve favori bölümleri gerçek bileşen + kurgusal yerel veriyle görsel olarak kontrol edildi. Bu fixture canlı Firebase oturumu veya bulut yazma testi değildir.
- Pip gerçek bileşeniyle kurgusal kayıtlı sohbetler, geçmiş listesi ve öneri kartları kontrol edildi. Yeni model çağrısı yapılmadı.
- Son üretim derlemesi başarılı; 28 otomatik testin tamamı geçti.

## Yayından sonra kalanlar
- Gerçek telefonda Safari/Chrome, ekran klavyesi, kaydırma ve yön değiştirme kontrolü.
- Yayınlanan sürümde demo giriş ve aynı oturumda bulut verisi kalıcılığı.
- Yeni Pip ürün bağlamı ve ödeme dönüşü için canlı son kontrol. Bu turda ödeme başlatılmadı.

Bu değişiklikler henüz yayınlanmadı.
