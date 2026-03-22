# CongressHitit'26 - WordPress Bilesenleri

Bu klasor, kongre web sitesinde kullanilan ozel WordPress altyapisini toplar. Icerikte hem canli sitede kullanilan kaynak kodlar hem de hizli kurulum icin olusturulmus zip paketleri bulunur.

## Klasorler

### [Plugins](./Plugins)

Kongreye ozel gelistirilmis eklentiler:

- [FormHitit](./Plugins/FormHitit)
  Dinamik form olusturma, shortcode ile yayinlama ve kayit saklama.
- [KayitPlugin](./Plugins/KayitPlugin)
  Atolye yerlestirme, doluluk gostergeleri ve masaustu API altyapisi.
- [CheckPlugin](./Plugins/CheckPlugin)
  Telefon numarasi ile kayit sorgulama arayuzu.

### [Themes](./Themes)

- [TemaHitit](./Themes/TemaHitit)
  Kongre sitesinin ozel temasi, Gutenberg pattern'leri ve sayfa sablonlari.

### [Zips](./Zips)

Canli sunucuya veya yeni bir WordPress kurulumuna hizli aktarma icin hazir paketler:

- `hitit-tema-v2.8.9.zip`
- `hitit-form_v2.0.0.zip`
- `kongre-kayit-plugin_v2.0.0.zip`
- `reg-check-plugin_v3.zip`

## Tipik Kurulum Senaryosu

1. Tema olarak `TemaHitit` kurulur ve etkinlestirilir.
2. Form akisi icin `FormHitit` kurulur.
3. Kayit ve atolye yerlestirme gerekiyorsa `KayitPlugin` etkinlestirilir.
4. Katilimcilarin kendi kaydini sorgulamasini istiyorsaniz `CheckPlugin` etkinlestirilir.

## Bu Klasor Ne Icin Onemli?

Masaustu uygulamalarinin bir kismi WordPress tarafindaki bu kodlara baglidir:

- `KayitHitit` <- `KayitPlugin`
- kayit formlari <- `FormHitit`
- kayit sorgulama sayfasi <- `CheckPlugin`
- site arayuzu <- `TemaHitit`

## Kaynak Koddan Mi, Zip'ten Mi Kurulmali?

- Gelistirme ve duzenleme yapacaksaniz kaynak kod klasorlerini kullanin.
- Hedefiniz hizli kurulumsa `Zips/` altindaki paketleri kullanin.

## Genel Notlar

- Bu bilesenler genel amacli bir tema/plugin paketi degil, kongre operasyonuna ozel bir sistemdir.
- Plugin ve tema icindeki alan isimleri, shortcode'lar ve panel akislari birbirini tamamlayacak sekilde yazilmistir.
