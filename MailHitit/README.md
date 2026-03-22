# MailHitit

![MailHitit Screenshot](../assets/mail-hitit.png)

MailHitit, Excel listeleri uzerinden kisilestirilmis toplu e-posta gondermek icin hazirlanmis bir Electron uygulamasidir. Kongre duyurulari, bilgilendirme mailleri, odeme hatirlatmalari ve sonuc paylasimlari gibi tekrar eden iletisim islerini hizlandirmak icin kullanilir.

## Baslica Ozellikler

- SMTP baglanti ayarlari ve test ekrani
- HTML mail icerigi hazirlama
- Konu satiri ve icerikte placeholder kullanimi
- Excel dosyasi yukleme (`.xlsx`, `.xls`, `.csv`)
- E-posta sutunu secme ve gecerli adresleri sayma
- Satir araligi secerek parcali gonderim yapma
- Gonderim hizi / saatlik limit tanimlama
- Ek dosya ile gonderim
- Canli log ve gonderim ozeti
- Log'lari disa aktarma

## Adimlar

Uygulama 4 asamali calisir:

1. `Ayarlar`
   SMTP bilgilerini tanimlama ve baglanti testi
2. `Mail Editor`
   Konu, HTML icerik ve ek dosyalari hazirlama
3. `Alicilar`
   Excel dosyasi yukleme, email sutunu ve placeholder eslestirmesi
4. `Gonderim`
   Toplu gonderimi baslatma, durdurma ve loglari takip etme

## Gereksinimler

- Node.js 18+
- npm 9+
- SMTP gonderimine izin veren bir e-posta hesabi

## Kurulum

```bash
npm install
```

## Gelistirme Modunda Calistirma

```bash
npm run dev
```

## Uretim Paketi Alma

```bash
npm run build
```

## Nasil Kullanilir?

1. `Ayarlar` ekraninda SMTP host, port, gonderici maili, sifre ve ad bilgisini girin.
2. SMTP testini calistirin.
3. `Mail Editor` ekraninda konu satiri ve HTML govdesini hazirlayin.
4. Gerekirse ek dosya ekleyin.
5. `Alicilar` ekraninda Excel dosyasini yukleyin.
6. E-posta sutununu secin.
7. Kullandiginiz placeholder'lari Excel sutunlariyla eslestirin.
8. Gonderilecek satir araligini belirleyin.
9. `Gonderim` ekranindan islemi baslatin.

## Placeholder Mantigi

Mail iceriginde veya konu satirinda su tarz alanlar kullanabilirsiniz:

```text
{ad_soyad}
{universite}
{kayit_durumu}
```

Uygulama, bu alanlari Excel'deki secilen sutunlarla eslestirerek her alici icin farkli icerik olusturur.

## Excel Yukleme Sonrasi Yapilan Islemler

- Sutun isimleri okunur
- Ilk satirlarin onizlemesi gosterilir
- Olası e-posta sutunu otomatik tespit edilmeye calisilir
- `mailto:` ile baslayan adresler temizlenir
- Gecerli mail sayisi hesaplanir

## Gonderim Sirasinda

Uygulama su durumlari ayri ayri raporlar:

- Gonderildi
- Basarisiz
- Atlandi
- Rate limit algilandi
- Tamamlandi
- Iptal edildi

## Script'ler

- `npm run dev` -> Gelistirme modu
- `npm run build` -> Uretim paketi
- `npm run dev:vite` -> Sadece Vite
- `npm run dev:electron` -> Sadece Electron

## Dosya Yapisi

```text
MailHitit/
├── electron/
├── src/components/
├── src/utils.js
├── public/
└── package.json
```

## Notlar

- Ayarlar yerel olarak saklanir.
- Gonderim hizi dusuk tutulursa hesap limiti ve spam riski daha iyi yonetilir.
- Toplu gonderimlerde once kucuk bir test listesiyle deneme yapmak iyi olur.
