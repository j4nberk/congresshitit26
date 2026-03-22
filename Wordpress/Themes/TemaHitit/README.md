# TemaHitit

![TemaHitit Preview](../../../assets/tema.png)

TemaHitit, 3. Ulusal Tıp Öğrenci Kongresi sitesi için geliştirilmiş özel WordPress temasıdır. Tema; Gutenberg uyumu, özel sayfa şablonları, block pattern'leri ve Tailwind tabanlı stil yapısı ile kongre içeriklerinin hızlı yönetilmesini sağlar.

## Temanın Sunduğu Yapı

- Responsive kongre sitesi tasarımı
- Gutenberg destekli düzenleme akışı
- Özel sayfa şablonları
- Özel pattern'ler
- Yerel font ve Font Awesome varlıkları
- Tailwind ile derlenen stil sistemi

## Desteklediği Alanlar

Tema kurulumunda şu WordPress özellikleri etkinleştirilir:

- `title-tag`
- `post-thumbnails`
- HTML5 bileşenleri
- `wp-block-styles`
- `align-wide`
- `editor-styles`
- `responsive-embeds`
- `custom-logo`

## Menü Konumları

- `primary`
- `mobile`
- `footer`

## Özel Sayfa Şablonları ve Dosyalar

Temada kongreye özel hazır sayfalar bulunur:

- `front-page.php`
- `page-paketlerimiz.php`
- `page-odeme-bilgileri.php`
- `page-program-atlasi.php`
- `page-ekibimiz.php`
- `template-full-width.php`
- `template-blank.php`

## Pattern'ler

Gutenberg tarafında tekrar kullanılabilen pattern dosyaları:

- `hero`
- `program`
- `social-program`
- `presentations`
- `speakers`
- `gala`
- `workshops`
- `team`
- `registration`

## Kurulum

1. Bu klasörü `wp-content/themes/` altına kopyalayın.
2. WordPress panelinden temayı etkinleştirin.
3. Menü konumlarını bağlayın.
4. Logo, ana sayfa ve sayfa içeriklerini düzenleyin.

Alternatif olarak `Wordpress/Zips/hitit-tema-v2.8.9.zip` paketini kullanabilirsiniz.

## Geliştirme

Tema Tailwind CSS ile stil üretiyor.

Kurulum:

```bash
npm install
```

İzleme modu:

```bash
npm run watch:css
```

Minify build:

```bash
npm run build:css
```

## Tema İçindeki Diğer Özel Bileşenler

Tema klasörü içinde kongreye özel gömülü plugin varyantları da bulunur:

- `form-plugin/`
- `reg-check-plugin/`

Ana geliştirme kaynağı olarak yine `Wordpress/Plugins/` altındaki klasörleri esas almak daha düzenlidir; ancak tema içindeki kopyalar dağıtım ve taşıma kolaylığı sağlayabilir.

## Dosya Yapısı

```text
TemaHitit/
├── assets/
├── patterns/
├── template-parts/
├── form-plugin/
├── reg-check-plugin/
├── functions.php
├── style.css
└── theme.json
```

## Notlar

- Tema, kongre sayfalarını hızlı yayına almak için birçok varsayılan içerik ve şablon sunar.
- `functions.php` içinde paketler, ödeme bilgileri ve program atlası gibi özel varsayılan içerikler üretilir.
