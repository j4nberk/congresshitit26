# BildiriHitit

![BildiriHitit Screenshot](../assets/bildiri-hitit.png)

BildiriHitit, kongre bildirilerinin toplanması, hakemlere dağıtılması, puanlanması ve sonuç maillerinin gönderilmesi için hazırlanmış Electron tabanlı yönetim uygulamasıdır. Uygulama tek pencere içinde dashboard, hoca yönetimi, öğrenci/bildiri kayıtları, puanlama ve mail akışını bir arada sunar.

## Başlıca Özellikler

- Hakem / hoca listesi tutma
- Hoca başı bildiri kapasitesi tanımlama
- Öğrenci ve bildiri kayıtlarını oluşturma
- DOCX dosyası seçme, kopyalama ve yerel dosya yönetimi
- Bildirilere puan girme ve ortalama takibi
- Hocalara ve öğrencilere toplu mail gönderimi
- SMTP bağlantı testi
- PDF ve Excel dışa aktarma

## Ekranlar

- `Anasayfa`
  Genel istatistikleri ve hızlı işlemleri gösterir.
- `Hocalar`
  Hakem kaydı, e-posta bilgisi ve kapasite yönetimi.
- `Öğrenciler & Bildiriler`
  Öğrenci, bildiri başlığı, iletişim ve dosya yönetimi.
- `Puanlama`
  Bildiri puanlarının girildiği ve takip edildiği alan.
- `Hoca Gönderim`
  Hakemlere bildiri gönderimi için ayrılan alan.
- `Ayarlar & Şablonlar`
  Tema, SMTP ve e-posta şablonları.
- `Öğrenci Gönderim`
  Kabul / ret benzeri sonuç gönderimleri.

## Gereksinimler

- Node.js 18+
- npm 9+
- SMTP erişimi olan bir e-posta hesabı

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

Mac DMG varyantı için ayrıca:

```bash
npm run build:electron:dmg
```

## Nasıl Kullanılır?

1. Uygulamayı açın.
2. `Hocalar` ekranından hakemleri ekleyin.
3. `Öğrenciler & Bildiriler` ekranından bildirileri ve öğrenci kayıtlarını girin veya içe alın.
4. Gerekirse bildiri dosyalarını sisteme bağlayın.
5. `Puanlama` ekranından değerlendirmeleri tamamlayın.
6. `Ayarlar & Şablonlar` ekranında SMTP ve mail içeriklerini ayarlayın.
7. `Hoca Gönderim` veya `Öğrenci Gönderim` ekranından toplu gönderimi başlatın.

## Veri Modeli Olarak Neler Tutulur?

Yerel olarak şu veriler tutulur:

- Hoca listesi
- Öğrenci / bildiri kayıtları
- SMTP ayarları
- Mail şablonları
- Tema seçimi

Bu sayede uygulama tekrar açıldığında son durum korunur.

## Mail Akışı

BildiriHitit, Nodemailer üzerinden SMTP ile gönderim yapar. Uygulamada:

- SMTP host
- Port
- Gönderici e-postası
- Şifre
- Gönderici adı

bilgileri kaydedilebilir ve test edilebilir.

## Dışa Aktarma

Uygulama aşağıdaki çıktıları destekler:

- Excel olarak bildiri listesi
- PDF olarak rapor / liste
- Gönderim logları

## Script'ler

- `npm run dev` -> Geliştirme modu
- `npm run build` -> Üretim paketi
- `npm run build:electron:dmg` -> Mac için DMG oluşturma
- `npm run dev:vite` -> Sadece Vite
- `npm run dev:electron` -> Sadece Electron

## Dosya Yapısı

```text
BildiriHitit/
├── electron/
├── src/components/
├── src/theme.js
├── public/
└── package.json
```

## Notlar

- Uygulama merkezi bir web servise bağlı değildir; iş akışının ana verisi yerel olarak tutulur.
- SMTP bilgileri olmadan toplu gönderim ekranları kullanılamaz.
- Hakem kapasitesi ve puanlama mantığı kongre operasyonuna göre özelleştirilmiştir.
