# CongressHitit'26

<p align="center">
  <img src="assets/logo.png" width="200" alt="CongressHitit Logo">
</p>

Bu depo, 3. Ulusal Tip Ogrenci Kongresi icin gelistirdigim masaustu uygulamalarini, bu uygulamalarin baglandigi WordPress eklentilerini ve kongre temasini tek yerde toplar. Projedeki klasorler birbirinden bagimsiz calisabilir; ancak en verimli kullanim sekli WordPress tarafi ile masaustu araclarini birlikte kullanmaktir.

## Depoda Neler Var?

### Masaustu uygulamalari

1. [KayitHitit](./KayitHitit)
Kongre kayitlarini canli izler, atolyeleri listeler, filtreler ve PDF ciktisi alir.

2. [BildiriHitit](./BildiriHitit)
Bildiri, hakem, puanlama ve sonuc maili sureclerini yonetir.

3. [MailHitit](./MailHitit)
Excel listeleri uzerinden kisilestirilmis toplu e-posta gonderir.

4. [CekilisHitit](./CekilisHitit)
Instagram yorum cekimi, cekilis yonetimi ve gala gecesi odul akisini yonetir.

### WordPress icerikleri

5. [Wordpress](./Wordpress)
Kongre sitesinde kullanilan ozel plugin'ler, tema ve hazir zip paketlerini icerir.

## Onerilen Kullanim Sirasi

1. WordPress tarafinda [TemaHitit](./Wordpress/Themes/TemaHitit) temasini ve ihtiyac duyulan plugin'leri kurun.
2. Form ve kayit akisi icin [FormHitit](./Wordpress/Plugins/FormHitit) ile [KayitPlugin](./Wordpress/Plugins/KayitPlugin) eklentilerini etkinlestirin.
3. Kayit takibi gerekiyorsa [KayitHitit](./KayitHitit) uygulamasinda WordPress site adresi ve masaustu API anahtarini tanimlayin.
4. Bildiri surecini yonetmek icin [BildiriHitit](./BildiriHitit) uygulamasinda hoca, ogrenci ve SMTP ayarlarini olusturun.
5. Toplu bilgilendirme ihtiyaclarinda [MailHitit](./MailHitit) ile Excel tabanli mail gonderimleri yapin.
6. Sosyal medya cekilisi veya gala cekilisi icin [CekilisHitit](./CekilisHitit) uygulamasini kullanin.

## Genel Gereksinimler

- Node.js 18+
- npm 9+
- Electron uygulamalari icin masaustu ortam
- WordPress 6+
- PHP 8.0+ ve MySQL/MariaDB

## Masaustu Uygulamalarini Calistirma

Her uygulama kendi klasoru icinde bagimsiz bir React + Electron projesidir.

```bash
cd KayitHitit
npm install
npm run dev
```

Uretim paketi almak icin:

```bash
npm run build
```

Ayri ayri uygulama klasorleri:

- `KayitHitit`
- `BildiriHitit`
- `MailHitit`
- `CekilisHitit`

## WordPress Tarafini Kurma

WordPress bilesenleri iki farkli sekilde kullanilabilir:

- Kaynak koddan: `Wordpress/Plugins/*` ve `Wordpress/Themes/TemaHitit`
- Hazir paketlerden: `Wordpress/Zips`

Standart kurulum:

1. Plugin klasorlerini `wp-content/plugins/` altina kopyalayin.
2. Tema klasorunu `wp-content/themes/` altina kopyalayin.
3. WordPress panelinden ilgili tema ve eklentileri etkinlestirin.

## Klasor Yapisi

```text
.
├── KayitHitit/
├── BildiriHitit/
├── MailHitit/
├── CekilisHitit/
├── Wordpress/
│   ├── Plugins/
│   ├── Themes/
│   └── Zips/
└── assets/
```

## Hangi Bilesen Ne Ile Entegre?

- `KayitHitit` -> `Wordpress/Plugins/KayitPlugin`
- `KayitPlugin` -> `Wordpress/Plugins/FormHitit`
- `BildiriHitit` -> Yerel veri + SMTP + dosya yonetimi
- `MailHitit` -> Yerel Excel dosyalari + SMTP
- `CheckPlugin` -> Google Sheets tabanli kayit sorgulama
- `TemaHitit` -> Kongre sayfalari, ozel sablonlar ve Gutenberg pattern'leri

## Notlar

- Masaustu uygulamalari ayarlarini yerel olarak saklar.
- WordPress plugin'leri kongreye ozel alan adlari ve is akislarina gore yazilmistir.
- Hazir zip dosyalari, canli sunucuya hizli kurulum yapabilmek icin repoda tutulur.
