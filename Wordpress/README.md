# CongressHitit'26 - WordPress Bileşenleri

Bu klasör, kongre web sitesinde kullanılan özel WordPress altyapısını toplar. İçerikte hem canlı sitede kullanılan kaynak kodlar hem de hızlı kurulum için oluşturulmuş zip paketleri bulunur.

## Klasörler

### [Plugins](./Plugins)

Kongreye özel geliştirilmiş eklentiler:

- [FormHitit](./Plugins/FormHitit)
  Dinamik form oluşturma, shortcode ile yayınlama ve kayıt saklama.
- [KayitPlugin](./Plugins/KayitPlugin)
  Atölye yerleştirme, doluluk göstergeleri ve masaüstü API altyapısı.
- [CheckPlugin](./Plugins/CheckPlugin)
  Telefon numarası ile kayıt sorgulama arayüzü.

### [Themes](./Themes)

- [TemaHitit](./Themes/TemaHitit)
  Kongre sitesinin özel teması, Gutenberg pattern'leri ve sayfa şablonları.

### [Zips](./Zips)

Canlı sunucuya veya yeni bir WordPress kurulumuna hızlı aktarma için hazır paketler:

- `hitit-tema-v2.8.9.zip`
- `hitit-form_v2.0.0.zip`
- `kongre-kayit-plugin_v2.0.0.zip`
- `reg-check-plugin_v3.zip`

## Tipik Kurulum Senaryosu

1. Tema olarak `TemaHitit` kurulur ve etkinleştirilir.
2. Form akışı için `FormHitit` kurulur.
3. Kayıt ve atölye yerleştirme gerekiyorsa `KayitPlugin` etkinleştirilir.
4. Katılımcıların kendi kaydını sorgulamasını istiyorsanız `CheckPlugin` etkinleştirilir.

## Bu Klasör Ne İçin Önemli?

Masaüstü uygulamalarının bir kısmı WordPress tarafındaki bu kodlara bağlıdır:

- `KayitHitit` <- `KayitPlugin`
- kayıt formları <- `FormHitit`
- kayıt sorgulama sayfası <- `CheckPlugin`
- site arayüzü <- `TemaHitit`

## Kaynak Koddan mı, Zip'ten mi Kurulmalı?

- Geliştirme ve düzenleme yapacaksanız kaynak kod klasörlerini kullanın.
- Hedefiniz hızlı kurulumsa `Zips/` altındaki paketleri kullanın.

## Genel Notlar

- Bu bileşenler genel amaçlı bir tema/plugin paketi değil, kongre operasyonuna özel bir sistemdir.
- Plugin ve tema içindeki alan isimleri, shortcode'lar ve panel akışları birbirini tamamlayacak şekilde yazılmıştır.
