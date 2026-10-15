# Aisle güvenlik incelemesi — 15 Ekim 2026

Durum: kaynak kodu, erişilebilir Git geçmişi, bağımlılıklar ve herkese açık yayınlar incelendi. Yönetim paneli/özel Actions logları kontrolleri bekliyor. Bu belge tam güvenlik garantisi veya tamamlanmış penetrasyon testi değildir. Anahtar değerleri rapora yazılmadı.

## Kapsam ve kanıt

- Yerel HEAD: `56f3ea14acf8e7fdab8e010118e0fd0a851d9232`; tarama başlangıcındaki GitHub main: `2a0e75ab3e7ec2639aae02d53685f492bc9650e6`. Yereldeki son plan commit'i henüz remote main'de değildi.
- Git fetch sonrası erişilebilir 35 commit ve 193 farklı Git dosya nesnesi; mevcut izlenen dosyalar ayrıca tarandı. Erişilemeyen/silinmiş remote commit'ler, başka fork'lar ve GitHub'ın gizli referansları bu sayıya dahil değildir.
- GitHub Pages ve Vercel'deki 24 JS/CSS dosyası indirildi, statik/dinamik Vite bağımlılıkları takip edildi ve örüntü taraması yapıldı. Bildirilen kaynak haritası bağlantıları da tarayıcıda erişilebilirlik açısından izleniyor; bu sayısal sonuç tüm olası kaynak haritalarının yokluğunu kanıtlamaz.
- Örüntüler: Google web API anahtarı, iyzico sandbox anahtarı, GitHub tokenı, özel anahtar bloğu, OpenAI anahtarı, AWS erişim kimliği, JWT ve belirli gizli ortam değişkeni atamaları. Rastgele biçimli her gizli değeri otomatik tanımak mümkün değildir.

## Bulgular

### 1. Firebase web anahtarı: bilinen, herkese açık istemci yapılandırması

Tek farklı Google anahtarı parmak izi bulundu. Konumlar: `.agent-logs/2026-10-14_22-19-05_01a13c7e-c00c-70b3-b321-8ab3140a3d59.md` içindeki kullanıcı yapılandırması ve GitHub Pages ana JS paketi. Aynı anahtarın tarihsel dosya sürümlerindeki tekrarları ayrı sızıntılar değildir. Firebase web anahtarları kimlik belirler; veriye erişimi Security Rules/IAM ve uygulama doğrulaması belirler.

Kullanıcının paylaştığı mevcut 25 API listesinde Generative Language API yok. Liste Firebase'in geniş otomatik allowlist'iyle uyumlu; yalnızca Authentication/Firestore kullanan Aisle için gereksiz API'ler de var. Güncel website kısıtlamaları ve kaydedilmiş proje ayarları hâlâ panelden doğrulanmalı. App Check şu an kodda uygulanmış değil. Google Cloud/Firebase anahtarını başka AI servisleri için kullanma.

GitHub uyarısı henüz kapatılmadı. Web yapılandırmasının kasıtlı görünürlüğü, tüm proje ayarlarının güvenli olduğuna tek başına kanıt değildir. Agent kayıtları değiştirilmedi, Git geçmişi yeniden yazılmadı.

### 2. Gizli anahtar örüntüleri: incelenen kapsamda eşleşme yok

iyzico sandbox anahtarı, GitHub tokenı, özel anahtar, OpenAI anahtarı, AWS erişim kimliği, JWT ve ödeme oturumu anahtarı literal ataması için eşleşme görülmedi. Yalnızca `.env.example` Git tarafından izleniyor; `.env.local`, `.capture-state` ve kaynak haritaları izlenen dosyalar arasında yok.

Bu sonuç Vercel ortam değişkenlerinin veya geçmiş Actions loglarının görüldüğü anlamına gelmez. Özel panel/log kontrolleri ayrıca bekliyor.

### 3. Bağımlılık güvenlik açığı: yerelde düzeltildi, yayın bekliyor

İlk `npm audit` raporunda 5 high paket kaydı vardı; bunlar `@grpc/grpc-js@1.9.16` kök bağımlılığından yayılıyordu. Danışma kayıtları GHSA-m9gg-hp2v-232j ve GHSA-f596-whhp-79r4. Browser Firestore Lite paketi ve ödeme API'si gRPC sunucusu çalıştırmıyor; bu yüzden paket önem derecesi doğrudan aynı uygulama sömürülebilirliği anlamına gelmez.

`package.json` override ile `@grpc/grpc-js` sürümü `1.14.6` olarak sabitlendi ve lockfile güncellendi. Firebase'i eski bir major sürüme zorla düşürme yapılmadı. Son `npm audit`: 0 bilinen açık. Güncelleme sonrası 15 uygulama testi, 7 emülatör erişim testi ve üretim derlemesi geçti.

### 4. Canlı yetkisiz erişim kontrolleri

- Ödeme API'si izinli origin için OPTIONS: 204; oturumsuz POST: 401; izin verilmeyen origin: 403. Kontroller ödeme oturumu oluşturmadı ve anahtar kullanılarak gerçek ödeme yapılmadı.
- Sentetik ve var olmayan UID ile oturumsuz Firestore liste sorgusu: 403.
- Her iki sitede `.env`, `.env.local`, `server/payment.js`, `server/catalog.json`: 404. Sunucu kaynağı veya ortam dosyası bu yollardan açılmadı.
- API sonuçları `Cache-Control: no-store` taşıyor. Callback ödemeyi onaylamıyor; gerçek sonuç sunucudan provider sorgusu, imza, tutar, para birimi ve sahiplik kontrolüyle doğrulanıyor.
- Ödeme kimlik doğrulaması imzalı Firebase JWT + doğrulanmış e-posta gerektiriyor. Token iptali/hesap devre dışı bırakılmasını anlık doğrulayan ayrı Admin sorgusu yok; geçerli token son kullanma süresine kadar geçerli kalabilir.

### 5. Ek sertleştirmeler: yerelde hazır, yayın bekliyor

- API artık bozuk JSON/array/null gövdeleri 400 ve büyük gövdeleri 413 ile reddediyor. Oturumsuz istek, ödeme ortam değişkenleri incelenmeden 401 alıyor.
- Vercel yapılandırmasına nosniff, referrer policy, frame engeli ve kamera/mikrofon/konum izin kısıtları eklendi. Ödeme callback'i ayrıca kendi daha sıkı politikasını tutuyor. Yayından sonra tarayıcı giriş/ödeme akışı ve yanıt başlıkları yeniden doğrulanmalı.
- CI'da setup-java değişken `v4` etiketi yerine resmî tag'in çözümlenen commit'ine sabitlendi.
- GitHub Pages'te mevcut statik yayın uygulamaya özel CSP/frame başlıkları sunmuyor; Vercel başlık değişikliği GitHub Pages yanıtını değiştirmez.

## Açık kontroller ve sınırlar

1. Kullanıcının kendi terminalinden `scripts/audit-github-private.ps1` çalıştırması: son 5 workflow'un log örüntüleri ve secret scanning uyarı metaverisi. Betik gizli değerleri/log satırlarını yazdırmaz; yalnızca sayaçlar ve uyarı türlerini raporlar. Tüm tarihsel workflow logları henüz incelenmedi; gerekirse kapsam genişletilecek.
2. Firebase Browser key website kısıtlamalarının kaydedilmiş listesini doğrula. Yetkili Authentication domainlerini ve e-posta ayarlarını panelden kontrol et. Kullanıcıya ait olmayan domainler eklenmemeli.
3. Vercel'de üç ödeme değişkeninin doğru scope ve gizli değer alanlarında bulunduğunu, `VITE_` ile kopyalanmadığını, Functions loglarında anahtar/bearer token bulunmadığını panelden doğrula. Değerleri sohbete taşıma.
4. Firebase App Check ve global API rate limiting henüz yok. CORS güvenlik duvarı veya kötü niyetli yetkili kullanıcıya karşı kota değildir. Sandbox kapsamında kayıtlı bir kötüye kullanım sınırı olarak açık bırakıldı; canlı para tahsilatı/yoğun kullanım öncesi çözülmeli.
5. Listelerde doküman içeriği sınırlandırılıyor ancak kullanıcı başına toplam liste sayısına global kota yok. Bir doğrulanmış kullanıcı kotayı tüketebilir. Gerçek kullanım öncesi toplam kota/uygulama doğrulaması değerlendirilmeli.
6. Ortak CI logları ve özel paneller doğrulanmadan veya güncelleme yayınlanmadan uyarı tamamen çözüldü/güvenlik taraması tamamen geçti denmemeli. Gerçek sunucu sırrı bulunursa önce iptal/yenile, ardından dağıtımı düzelt; sadece Git'ten silmek yeterli olmaz.

## Kaynaklar

- https://firebase.google.com/docs/projects/api-keys
- https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-secret-scanning-alerts/resolving-alerts
- https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j
- https://github.com/grpc/grpc-node/security/advisories/GHSA-f596-whhp-79r4

Tekrar tarama: `python scripts/security-audit.py`. Ham kamuya açık paketler ve JSON kanıtları yalnızca ignore edilen `.capture-state/security-audit/` içinde saklanır. Rapor ve paylaşılan sonuçlar gizli değer içermez.

## Yayın sonrası doğrulama

GitHub run 38704130933, commit 39d31e9 başarılı. Vercel güvenlik başlıkları canlıda görüldü. İzinli origin ile oturumsuz API isteği 401; izinsiz origin 403. Kullanıcı üç ödeme değişkeninin Production scope'ta bulunduğunu ve website listesinin yalnızca Firebase auth domaini, aisle-roan.vercel.app ve kagankurubas.github.io olduğunu ekran görüntüleriyle doğruladı. Son beş Actions işinin örüntü taramasında sunucu sırrı/token bulunmadı; üç logda public Firebase web anahtarı vardı. Secret scanning API metaverisi erişimi reddedildi; uyarı sayısı/çözümü API'den doğrulanamadı. Vercel özel Functions logları ve Shared/Preview değişken kapsamı henüz incelenmedi.

Canlı bozuk JSON denemesi 502 döndü: Vercel'in tembel req.body okuyucusunun kendisi SyntaxError atabiliyor. Bu getter erişimi de JSON yakalama bloğuna taşındı; özel regresyon denemesi dahil 15 test geçti. Ek düzeltme yeniden yayınlanıp 400 yanıtı doğrulanmalı. Yeni başlıklar sonrasında kullanıcı Google girişini ayrıca deneyecek.

