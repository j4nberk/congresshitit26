# FormHitit

FormHitit, kongre kayitlari ve benzeri basvuru surecleri icin gelistirilmis bir WordPress form olusturma eklentisidir. Yonetim panelinde form tasarlanir, shortcode ile yayinlanir, gelen veriler veritabanina kaydedilir ve istege gore Google Sheets tarafina aktarilir.

## Ne Saglar?

- Dinamik form olusturma
- Formlari WordPress panelinden yonetme
- Gonderimleri veritabaninda saklama
- Google Sheets entegrasyonu
- Kosullu alan yapilari
- Benzersiz alan kontrolu
- Shortcode ile sayfada yayinlama
- AJAX ile sayfa yenilenmeden form gonderimi

## Shortcode

Bir formu sayfada gostermek icin:

```text
[hitit_form id="1"]
```

`id` degeri, admin panelinde olusturulan formun kimligidir.

## Kurulum

1. Bu klasoru `wp-content/plugins/` altina kopyalayin.
2. WordPress panelinden eklentiyi etkinlestirin.
3. Admin panelinde `Hitit Forms` menusunu acin.
4. Yeni form olusturun.
5. Olusan shortcode'u ilgili sayfaya ekleyin.

## Aktivasyon Sirasinda Neler Olur?

Eklenti etkinlestiginde su tablolari olusturur:

- `hitit_forms`
- `hitit_form_entries`
- `hitit_form_unique_values`
- Sheets kuyruk tablosu

Ayrica:

- Upload klasorunu hazirlar
- Cron gorevlerini kaydeder
- Kuyruk temizligi icin zamanlama olusturur

## Yonetim Panelinde Neler Var?

- Tum formlar listesi
- Yeni form olusturma ekrani
- Gonderimler ekrani
- CSV disa aktarma
- Yeni kayitlari AJAX ile yenileme

## Form Yayinlama Mantigi

Sayfada shortcode goruldugunde eklenti:

- Gerekli CSS ve JS dosyalarini yukler
- Gerekirse Google Fonts ekler
- Form icinde `kongre_tercih` alani varsa ek asset'leri de yukler
- Onbelleklenmeyi engellemek icin ilgili header ve sabitleri ayarlar

## Google Sheets Entegrasyonu

Eklenti, gonderimleri anlik veya kuyruk mantigi ile Google Sheets tarafina yazabilecek sekilde tasarlanmistir. Bu sayede web paneline ek olarak Sheet uzerinden operasyon takibi yapilabilir.

## Guvenlik ve Kontroller

- Nonce kontrolu
- Honeypot alani
- IP alma ve loglama
- Unique alan claim tablosu ile tekrar eden veri engeli

## Diger Bilesenlerle Iliskisi

- [KayitPlugin](../KayitPlugin), bu eklentiye hook olarak calisir.
- Kongre kayit formunun ana veri kaynagi genelde bu eklentidir.

## Dosya Yapisi

```text
FormHitit/
├── admin/
├── includes/
├── public/
├── hitit-form.php
└── README.md
```

## Notlar

- Form olusturma mantigi genel bir builder gibi yazilsa da kongre ihtiyaclarina gore ozellestirilmistir.
- Cok yogun kayit anlarinda queue ve cron akislarinin saglikli calismasi onemlidir.
