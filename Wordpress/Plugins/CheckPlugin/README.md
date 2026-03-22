# CheckPlugin

CheckPlugin, katilimcilarin telefon numarasi ile kayit durumunu sorgulamasini saglayan WordPress eklentisidir. Kullanici arayuzu shortcode ile sayfaya yerlestirilir ve sorgular AJAX ile sonuc dondurur.

## Ne Ise Yarar?

- Katilimcilar kendi kaydini sorgulayabilir
- Sonuc ekrani sayfa yenilenmeden gelir
- Telefon numarasi tabanli arama yapilir
- reCAPTCHA ile bot / spam korumasi eklenebilir

## Shortcode

Sayfada sorgu formunu gostermek icin:

```text
[kayit_kontrol]
```

## Kurulum

1. Bu klasoru `wp-content/plugins/` altina kopyalayin.
2. Eklentiyi WordPress panelinden etkinlestirin.
3. Eklenti ayarlarinda baslik, aciklama ve sonuc alanlarini duzenleyin.
4. Kullanicilarin gorecegi sayfaya shortcode'u ekleyin.

## Kullanim Akisi

1. Kullanici telefon numarasini girer.
2. Varsa reCAPTCHA dogrulamasini tamamlar.
3. Form AJAX ile `admin-ajax.php` uzerinden sorgulanir.
4. Sonuc kartinda kayit bilgisi gosterilir.

## Arayuzde Neler Ozellestirilebilir?

- Baslik
- Aciklama metni
- Sonuc kolon etiketleri
- reCAPTCHA site key

## Teknik Yapi

Eklenti uc ana parcadan olusur:

- `class-reg-check-admin.php`
  Admin ayarlari
- `class-reg-check-shortcode.php`
  Shortcode ve asset yukleme
- `class-reg-check-ajax.php`
  AJAX sorgu islemi

## Dosya Yapisi

```text
CheckPlugin/
├── assets/
├── includes/
├── reg-check.php
└── README.md
```

## Notlar

- Kayit verisinin dogru okunabilmesi icin veri kaynaginin ve kolon eslesmelerinin duzgun ayarlanmasi gerekir.
- Kullaniciya acik oldugu icin spam ve brute-force riskine karsi reCAPTCHA kullanimi faydalidir.
