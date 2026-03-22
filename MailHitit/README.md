# MailHitit

![MailHitit Screenshot](../assets/mail-hitit.png)

MailHitit, Excel listeleri üzerinden kişiselleştirilmiş toplu e-posta göndermek için hazırlanmış bir Electron uygulamasıdır. Kongre duyuruları, bilgilendirme mailleri, ödeme hatırlatmaları ve sonuç paylaşımları gibi tekrar eden iletişim işlerini hızlandırmak için kullanılır.

## Başlıca Özellikler

- SMTP bağlantı ayarları ve test ekranı
- HTML mail içeriği hazırlama
- Konu satırı ve içerikte placeholder kullanımı
- Excel dosyası yükleme (`.xlsx`, `.xls`, `.csv`)
- E-posta sütunu seçme ve geçerli adresleri sayma
- Satır aralığı seçerek parçalı gönderim yapma
- Gönderim hızı / saatlik limit tanımlama
- Ek dosya ile gönderim
- Canlı log ve gönderim özeti
- Log'ları dışa aktarma

## Adımlar

Uygulama 4 aşamalı çalışır:

1. `Ayarlar`
   SMTP bilgilerini tanımlama ve bağlantı testi
2. `Mail Editor`
   Konu, HTML içerik ve ek dosyaları hazırlama
3. `Alıcılar`
   Excel dosyası yükleme, email sütunu ve placeholder eşleştirmesi
4. `Gönderim`
   Toplu gönderimi başlatma, durdurma ve logları takip etme

## Gereksinimler

- Node.js 18+
- npm 9+
- SMTP gönderimine izin veren bir e-posta hesabı

## Kurulum

```bash
npm install
```

## Geliştirme Modunda Çalıştırma

```bash
npm run dev
```

## Üretim Paketi Alma

```bash
npm run build
```

## Nasıl Kullanılır?

1. `Ayarlar` ekranında SMTP host, port, gönderici maili, şifre ve ad bilgisini girin.
2. SMTP testini çalıştırın.
3. `Mail Editor` ekranında konu satırı ve HTML gövdesini hazırlayın.
4. Gerekirse ek dosya ekleyin.
5. `Alıcılar` ekranında Excel dosyasını yükleyin.
6. E-posta sütununu seçin.
7. Kullandığınız placeholder'ları Excel sütunlarıyla eşleştirin.
8. Gönderilecek satır aralığını belirleyin.
9. `Gönderim` ekranından işlemi başlatın.

## Placeholder Mantığı

Mail içeriğinde veya konu satırında şu tarz alanlar kullanabilirsiniz:

```text
{ad_soyad}
{universite}
{kayit_durumu}
```

Uygulama, bu alanları Excel'deki seçilen sütunlarla eşleştirerek her alıcı için farklı içerik oluşturur.

## Excel Yükleme Sonrası Yapılan İşlemler

- Sütun isimleri okunur
- İlk satırların önizlemesi gösterilir
- Olası e-posta sütunu otomatik tespit edilmeye çalışılır
- `mailto:` ile başlayan adresler temizlenir
- Geçerli mail sayısı hesaplanır

## Gönderim Sırasında

Uygulama şu durumları ayrı ayrı raporlar:

- Gönderildi
- Başarısız
- Atlandı
- Rate limit algılandı
- Tamamlandı
- İptal edildi

## Script'ler

- `npm run dev` -> Geliştirme modu
- `npm run build` -> Üretim paketi
- `npm run dev:vite` -> Sadece Vite
- `npm run dev:electron` -> Sadece Electron

## Dosya Yapısı

```text
MailHitit/
├── electron/
├── src/components/
├── src/utils.js
├── public/
└── package.json
```

## Notlar

- Ayarlar yerel olarak saklanır.
- Gönderim hızı düşük tutulursa hesap limiti ve spam riski daha iyi yönetilir.
- Toplu gönderimlerde önce küçük bir test listesiyle deneme yapmak iyi olur.
