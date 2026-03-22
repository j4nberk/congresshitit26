# CheckPlugin

CheckPlugin, katılımcıların telefon numarası ile kayıt durumunu sorgulamasını sağlayan WordPress eklentisidir. Kullanıcı arayüzü shortcode ile sayfaya yerleştirilir ve sorgular AJAX ile sonuç döndürür.

## Ne İşe Yarar?

- Katılımcılar kendi kaydını sorgulayabilir
- Sonuç ekranı sayfa yenilenmeden gelir
- Telefon numarası tabanlı arama yapılır
- reCAPTCHA ile bot / spam koruması eklenebilir

## Shortcode

Sayfada sorgu formunu göstermek için:

```text
[kayit_kontrol]
```

## Kurulum

1. Bu klasörü `wp-content/plugins/` altına kopyalayın.
2. Eklentiyi WordPress panelinden etkinleştirin.
3. Eklenti ayarlarında başlık, açıklama ve sonuç alanlarını düzenleyin.
4. Kullanıcıların göreceği sayfaya shortcode'u ekleyin.

## Kullanım Akışı

1. Kullanıcı telefon numarasını girer.
2. Varsa reCAPTCHA doğrulamasını tamamlar.
3. Form AJAX ile `admin-ajax.php` üzerinden sorgulanır.
4. Sonuç kartında kayıt bilgisi gösterilir.

## Arayüzde Neler Özelleştirilebilir?

- Başlık
- Açıklama metni
- Sonuç kolon etiketleri
- reCAPTCHA site key

## Teknik Yapı

Eklenti üç ana parçadan oluşur:

- `class-reg-check-admin.php`
  Admin ayarları
- `class-reg-check-shortcode.php`
  Shortcode ve asset yükleme
- `class-reg-check-ajax.php`
  AJAX sorgu işlemi

## Dosya Yapısı

```text
CheckPlugin/
├── assets/
├── includes/
├── reg-check.php
└── README.md
```

## Notlar

- Kayıt verisinin doğru okunabilmesi için veri kaynağının ve kolon eşleşmelerinin düzgün ayarlanması gerekir.
- Kullanıcıya açık olduğu için spam ve brute-force riskine karşı reCAPTCHA kullanımı faydalıdır.
