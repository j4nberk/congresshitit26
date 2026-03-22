# CekilisHitit

![CekilisHitit Screenshot](../assets/cekilis-hitit.png)

CekilisHitit, hem Instagram cekilis operasyonu hem de gala gecesi odul dagitimi icin kullanilan Electron uygulamasidir. Uygulama tek arayuzde yorum cekme, kurali cekilis yapma, cok turlu odul dagitimi ve sahneye uygun gala modu sunar.

## Calisma Modlari

### 1. Instagram Yorum Cekme

Bir Instagram gonderisinin yorumlarini indirir.

Desteklenen motorlar:

- `InstaTouch`
- `Apify Bulut`
- `Yerel (V6)`

### 2. Instagram Cekilisi

Yorumlar cekildikten sonra veya mevcut listeyle:

- kazanan sayisi
- yedek sayisi
- birden fazla kazanma kurali
- takip etme / begeni / etiket kontrolu
- coklu odul turlari

gibi ayarlarla cekilis yapar.

### 3. Gala Modu

Excel'den katilimci ve odul listesi yukleyerek sahnede cekilis yapilmasini saglar.

## Gereksinimler

- Node.js 18+
- npm 9+
- Instagram yorum cekimi icin uygun erisim bilgisi

Motor bazli ek gereksinimler:

- `Apify Bulut` icin Apify API token
- `InstaTouch` icin Instagram session id

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

## Instagram Yorum Cekme Nasil Kullanilir?

1. Uygulamayi acin.
2. `Yorum Cekme` modunu secin.
3. Instagram gonderi baglantisini girin.
4. Kullanmak istediginiz motoru secin.
5. Gerekliyse Apify token veya session id bilgisini girin.
6. Yorumu cekip sonucu yerel liste olarak alin.

## Instagram Cekilisi Nasil Yapilir?

1. `Cekilis` modunu secin.
2. Yorum listesini / cekilis kaynagini belirleyin.
3. Her tur icin odul adi, kazanan ve yedek sayisini tanimlayin.
4. Tekrarlanan kazananlari engellemek icin tur mantigini kullanin.
5. Cekilisi baslatin.
6. Sonuc ekraninda kazananlari goruntuleyin.

## Gala Modu Nasil Kullanilir?

1. `Gala` modunu secin.
2. Katilimci listesini Excel olarak yukleyin.
3. Odul listesini Excel olarak yukleyin.
4. Dashboard ekraninda odul sirasini ve ayarlari kontrol edin.
5. Manuel veya otomatik modda cekilisi baslatin.
6. Final ekranda tum kazananlari toplayin.

## Gala Excel Beklentileri

Katilimci dosyasi:

- Isim, soyisim, kurum gibi alanlar icerebilir
- Satirlar katilimci olarak okunur

Odul dosyasi:

- `Odul` / `Prize`
- `Adet` / `Count`

alanlarini destekler.

## Script'ler

- `npm run dev` -> Gelistirme modu
- `npm run build` -> Uretim paketi
- `npm run lint` -> ESLint kontrolu
- `npm run preview` -> Vite onizleme

## Diger Dosyalar

Repo icinde su yardimci dosyalar bulunur:

- `scraper/` -> Python tabanli scraping denemeleri
- `ig-test/` -> Test amacli dosyalar
- `apify_schema.json` -> Apify akisina dair sema

## Notlar

- Yerel scraping yontemleri Instagram tarafinda risk olusturabilir.
- Apify kullanimi daha guvenli bir akistir ancak harici servis bagimliligi vardir.
- Gala modu, sahne akisina uygun hizli operasyona gore tasarlanmistir.
