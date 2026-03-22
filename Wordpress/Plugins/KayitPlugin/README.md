# KayitPlugin

KayitPlugin, kongre kayitlarinda atolye tercihlerini isleyen, kontenjan bazli yerlestirme yapan ve masaustu operasyon araclarina veri saglayan WordPress eklentisidir. Sistem, `FormHitit` uzerinden gelen form verisini yakalar ve kongreye ozel kayit mantigini uygular.

## Temel Gorevleri

- Form gonderiminden sonra atolye tercihlerini islemek
- Kontenjana gore anlik yerlestirme yapmak
- Kayit verisini kendi tablolarinda tutmak
- Google Sheets veya operasyon ekranlari icin veriyi hazirlamak
- Doluluk durumunu public tarafta gostermek
- Mail kuyrugu isletmek
- Masaustu uygulamasi icin REST API saglamak

## Bagimli Oldugu Eklenti

Bu eklenti, [FormHitit](../FormHitit) aktif olmadan beklenen sekilde calismaz.

## Kurulum

1. Bu klasoru `wp-content/plugins/` altina kopyalayin.
2. `FormHitit` eklentisinin aktif oldugundan emin olun.
3. `KayitPlugin` eklentisini etkinlestirin.
4. Admin panelinde hedef form, alan eslesmeleri ve atolye ayarlarini tamamlayin.

## Aktivasyon Sirasinda Neler Olur?

- Kayit tablolari olusturulur
- Varsayilan atolye verileri eklenir
- Mail kuyrugu icin WP-Cron zamanlanir

## Admin Panelindeki Alanlar

Eklenti yonetim ekraninda su bolumler bulunur:

- Doluluk Durumu
- Kayitlar
- Atolye Listeleri
- Atolyeler
- Kontenjan Yonetimi
- Mail Kuyrugu
- Ayarlar

## Public Tarafta Ne Saglar?

Eklenti, kullanicinin gorecegi doluluk verisini AJAX ile dondurebilir. Bunun icin kendi JS ve CSS dosyalarini yukler.

## Masaustu API

KayitPlugin, `KayitHitit` uygulamasinin baglandigi REST endpoint'lerini saglar:

- `/wp-json/kongre-desktop/v1/bootstrap`
- `/wp-json/kongre-desktop/v1/live`
- `/wp-json/kongre-desktop/v1/participants`
- `/wp-json/kongre-desktop/v1/workshops`

Yetkilendirme, eklenti tarafinda olusturulan masaustu API anahtari ile yapilir.

## Masaustu API Anahtari Nasil Kullanilir?

1. Eklentide API anahtari olusturulur.
2. Bu anahtar `KayitHitit` uygulamasina girilir.
3. Uygulama isteklerinde `X-Hitit-Desktop-Key` header'i ile gonderilir.

## Kayit Akisi

1. Kullanici formu doldurur.
2. `FormHitit` veriyi kaydeder.
3. `KayitPlugin` hook ile formu yakalar.
4. Atolye ve kontenjan mantigi uygulanir.
5. Sonuc veritabani ve ilgili operasyon akislarina yazilir.
6. Gerekirse mail kuyrugu devreye girer.

## Dosya Yapisi

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

- Bu eklenti dogrudan masaustu panelle entegre oldugu icin operasyonel olarak kritik parcadir.
- Hedef form secimi ve alan eslesmeleri yanlis yapilirsa desktop panelde veri beklenen bicimde gorunmez.
