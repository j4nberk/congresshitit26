# FormHitit

FormHitit, kongre kayıtları ve benzeri başvuru süreçleri için geliştirilmiş bir WordPress form oluşturma eklentisidir. Yönetim panelinde form tasarlanır, shortcode ile yayınlanır, gelen veriler veritabanına kaydedilir ve isteğe göre Google Sheets tarafına aktarılır.

## Ne Sağlar?

- Dinamik form oluşturma
- Formları WordPress panelinden yönetme
- Gönderimleri veritabanında saklama
- Google Sheets entegrasyonu
- Koşullu alan yapıları
- Benzersiz alan kontrolü
- Shortcode ile sayfada yayınlama
- AJAX ile sayfa yenilenmeden form gönderimi

## Shortcode

Bir formu sayfada göstermek için:

```text
[hitit_form id="1"]
```

`id` değeri, admin panelinde oluşturulan formun kimliğidir.

## Kurulum

1. Bu klasörü `wp-content/plugins/` altına kopyalayın.
2. WordPress panelinden eklentiyi etkinleştirin.
3. Admin panelinde `Hitit Forms` menüsünü açın.
4. Yeni form oluşturun.
5. Oluşan shortcode'u ilgili sayfaya ekleyin.

## Aktivasyon Sırasında Neler Olur?

Eklenti etkinleştiğinde şu tabloları oluşturur:

- `hitit_forms`
- `hitit_form_entries`
- `hitit_form_unique_values`
- Sheets kuyruk tablosu

Ayrıca:

- Upload klasörünü hazırlar
- Cron görevlerini kaydeder
- Kuyruk temizliği için zamanlama oluşturur

## Yönetim Panelinde Neler Var?

- Tüm formlar listesi
- Yeni form oluşturma ekranı
- Gönderimler ekranı
- CSV dışa aktarma
- Yeni kayıtları AJAX ile yenileme

## Form Yayınlama Mantığı

Sayfada shortcode görüldüğünde eklenti:

- Gerekli CSS ve JS dosyalarını yükler
- Gerekirse Google Fonts ekler
- Form içinde `kongre_tercih` alanı varsa ek asset'leri de yükler
- Önbelleklenmeyi engellemek için ilgili header ve sabitleri ayarlar

## Google Sheets Entegrasyonu

Eklenti, gönderimleri anlık veya kuyruk mantığı ile Google Sheets tarafına yazabilecek şekilde tasarlanmıştır. Bu sayede web paneline ek olarak Sheet üzerinden operasyon takibi yapılabilir.

## Güvenlik ve Kontroller

- Nonce kontrolü
- Honeypot alanı
- IP alma ve loglama
- Unique alan claim tablosu ile tekrar eden veri engeli

## Diğer Bileşenlerle İlişkisi

- [KayitPlugin](../KayitPlugin), bu eklentiye hook olarak çalışır.
- Kongre kayıt formunun ana veri kaynağı genelde bu eklentidir.

## Dosya Yapısı

```text
FormHitit/
├── admin/
├── includes/
├── public/
├── hitit-form.php
└── README.md
```

## Notlar

- Form oluşturma mantığı genel bir builder gibi yazılsa da kongre ihtiyaçlarına göre özelleştirilmiştir.
- Çok yoğun kayıt anlarında queue ve cron akışlarının sağlıklı çalışması önemlidir.
