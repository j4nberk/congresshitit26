# KayitPlugin

KayitPlugin, kongre kayıtlarında atölye tercihlerini işleyen, kontenjan bazlı yerleştirme yapan ve masaüstü operasyon araçlarına veri sağlayan WordPress eklentisidir. Sistem, `FormHitit` üzerinden gelen form verisini yakalar ve kongreye özel kayıt mantığını uygular.

## Temel Görevleri

- Form gönderiminden sonra atölye tercihlerini işlemek
- Kontenjana göre anlık yerleştirme yapmak
- Kayıt verisini kendi tablolarında tutmak
- Google Sheets veya operasyon ekranları için veriyi hazırlamak
- Doluluk durumunu public tarafta göstermek
- Mail kuyruğu işletmek
- Masaüstü uygulaması için REST API sağlamak

## Bağımlı Olduğu Eklenti

Bu eklenti, [FormHitit](../FormHitit) aktif olmadan beklenen şekilde çalışmaz.

## Kurulum

1. Bu klasörü `wp-content/plugins/` altına kopyalayın.
2. `FormHitit` eklentisinin aktif olduğundan emin olun.
3. `KayitPlugin` eklentisini etkinleştirin.
4. Admin panelinde hedef form, alan eşleşmeleri ve atölye ayarlarını tamamlayın.

## Aktivasyon Sırasında Neler Olur?

- Kayıt tabloları oluşturulur
- Varsayılan atölye verileri eklenir
- Mail kuyruğu için WP-Cron zamanlanır

## Admin Panelindeki Alanlar

Eklenti yönetim ekranında şu bölümler bulunur:

- Doluluk Durumu
- Kayıtlar
- Atölye Listeleri
- Atölyeler
- Kontenjan Yönetimi
- Mail Kuyruğu
- Ayarlar

## Public Tarafta Ne Sağlar?

Eklenti, kullanıcının göreceği doluluk verisini AJAX ile döndürebilir. Bunun için kendi JS ve CSS dosyalarını yükler.

## Masaüstü API

KayitPlugin, `KayitHitit` uygulamasının bağlandığı REST endpoint'lerini sağlar:

- `/wp-json/kongre-desktop/v1/bootstrap`
- `/wp-json/kongre-desktop/v1/live`
- `/wp-json/kongre-desktop/v1/participants`
- `/wp-json/kongre-desktop/v1/workshops`

Yetkilendirme, eklenti tarafında oluşturulan masaüstü API anahtarı ile yapılır.

## Masaüstü API Anahtarı Nasıl Kullanılır?

1. Eklentide API anahtarı oluşturulur.
2. Bu anahtar `KayitHitit` uygulamasına girilir.
3. Uygulama isteklerinde `X-Hitit-Desktop-Key` header'i ile gönderilir.

## Kayıt Akışı

1. Kullanıcı formu doldurur.
2. `FormHitit` veriyi kaydeder.
3. `KayitPlugin` hook ile formu yakalar.
4. Atölye ve kontenjan mantığı uygulanır.
5. Sonuç veritabanı ve ilgili operasyon akışlarına yazılır.
6. Gerekirse mail kuyruğu devreye girer.

## Dosya Yapısı

```text
KayitPlugin/
├── admin/
├── includes/
├── public/
├── tests/
├── kongre-kayit.php
└── README.md
```

## Notlar

- Bu eklenti doğrudan masaüstü panelle entegre olduğu için operasyonel olarak kritik parçadır.
- Hedef form seçimi ve alan eşleşmeleri yanlış yapılırsa desktop panelde veri beklenen biçimde görünmez.
