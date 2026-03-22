# KayitHitit

![KayitHitit Screenshot](../assets/kayit-hitit.png)

KayitHitit, kongre kayıtlarını WordPress üzerinden canlı takip etmek için geliştirilmiş Electron masaüstü panelidir. Katılımcıları listeler, canlı akış üzerinden yeni kayıtları gösterir, atölye doluluklarını takip eder ve seçilen listeleri PDF olarak dışa aktarır.

## Ne İşe Yarar?

- WordPress'teki kayıtları tek ekranda toplar
- Yeni gelen başvuruları canlı polling ile izler
- Bilimsel ve sosyal atölyeleri ayrı ayrı listeler
- Katılımcı listesini veya seçili atölye listesini PDF çıktısı olarak oluşturur
- Başvuru numarasına göre veya farklı sıralama tiplerine göre veri görüntüler

## Bağımlı Olduğu Bileşen

Bu uygulama tek başına çalışmaz. Veri kaynağı olarak şu eklentiye bağlanır:

- [KayitPlugin](../Wordpress/Plugins/KayitPlugin)

KayitPlugin de kendi içinde [FormHitit](../Wordpress/Plugins/FormHitit) ile entegre çalışır.

## Gereksinimler

- Node.js 18+
- npm 9+
- Çalışan bir WordPress sitesi
- Etkin `Kongre Atölye Yerleştirme` eklentisi
- WordPress tarafında oluşturulmuş masaüstü API anahtarı

## Kurulum

```bash
npm install
```

## Geliştirme Modunda Çalıştırma

```bash
npm run dev
```

Bu komut:

- Vite geliştirme sunucusunu başlatır
- Electron penceresini açar

## Üretim Paketi Alma

```bash
npm run build
```

Oluşan masaüstü paketleri `dist-app/` altına yazılır.

## Uygulama İçinde İlk Kurulum

Uygulama açıldığında sizden iki temel bilgi ister:

1. `Site Adresi`
   Örnek: `https://siteadresiniz.com`
2. `Masaüstü API Anahtarı`
   Örnek: `kh_...`

Bu bilgiler, WordPress tarafındaki `kongre-desktop/v1` endpoint'lerine bağlanmak için kullanılır.

## Nasıl Kullanılır?

1. WordPress tarafında hedef formu ve masaüstü API ayarlarını hazırlayın.
2. KayitHitit uygulamasını açın.
3. Site adresini ve API anahtarını girin.
4. `Bağlantı Testi` yapın.
5. Başarılıysa dashboard verilerini çekin.
6. İstiyorsanız canlı polling'i aktif edip yeni kayıtların anlık düşmesini izleyin.
7. Katılımcı veya atölye listesi seçip PDF export alın.

## Uygulamanın Gösterdiği Veriler

- Toplam katılımcı sayısı
- Son senkronizasyon zamanı
- Canlı akışa düşen son kayıtlar
- Tüm katılımcı listesi
- Bilimsel ve sosyal atölye oturumları
- Seçili oturuma ait öğrenci listesi

## PDF Çıktıları

Uygulama iki farklı PDF üretebilir:

- Toplam katılımcı listesi
- Seçili atölye / oturum listesi

PDF çıktıları kongre logosu ve düzenli tablo biçimi ile oluşturulur.

## WordPress Tarafında Gerekli API'ler

KayitHitit şu endpoint'lerle haberleşir:

- `/wp-json/kongre-desktop/v1/bootstrap`
- `/wp-json/kongre-desktop/v1/live`
- `/wp-json/kongre-desktop/v1/participants`
- `/wp-json/kongre-desktop/v1/workshops`

Yetkilendirme `X-Hitit-Desktop-Key` header'i ile yapılır.

## Script'ler

- `npm run dev` -> Vite + Electron geliştirme modu
- `npm run build` -> Web bundle + Electron paketleme
- `npm run dev:vite` -> Sadece Vite
- `npm run dev:electron` -> Sadece Electron

## Dosya Yapısı

```text
KayitHitit/
├── electron/
├── src/
├── public/
├── electron-icons/
└── package.json
```

## Notlar

- Ayarlar yerel olarak saklanır.
- API anahtarı olmadan uygulama veri çekmez.
- Bu araç, operasyon ekranıdır; esas veri yönetimi WordPress tarafındadır.
