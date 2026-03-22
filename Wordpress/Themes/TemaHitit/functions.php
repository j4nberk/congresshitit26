<?php

// ============================================
// TEMA KURULUMU
// ============================================
function hitit_kongre_setup() {
    // Sayfa başlıklarını WordPress yönetsin
    add_theme_support( 'title-tag' );

    // Öne çıkarılan görseller
    add_theme_support( 'post-thumbnails' );

    // HTML5 desteği
    add_theme_support( 'html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ));

    // Blok editör (Gutenberg) desteği
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'align-wide' );
    add_theme_support( 'editor-styles' );
    add_theme_support( 'responsive-embeds' );

    // Editör stilini yükle (blok editörde de aynı görünüm)
    add_editor_style( 'assets/css/editor-style.css' );

    // Menü lokasyonları
    register_nav_menus( array(
        'primary'   => __( 'Ana Menü (Masaüstü)', 'hitit-kongre' ),
        'mobile'    => __( 'Mobil Menü', 'hitit-kongre' ),
        'footer'    => __( 'Footer Menüsü', 'hitit-kongre' ),
    ));

    // Özel logo desteği - boyut kısıtlaması yok, her görsel kabul edilir
    add_theme_support( 'custom-logo', array(
        'height'               => 80,
        'width'                => 300,
        'flex-height'          => true,
        'flex-width'           => true,
        'header-text'          => array( 'site-title', 'site-description' ),
        'unlink-homepage-logo' => false,
    ));
}
add_action( 'after_setup_theme', 'hitit_kongre_setup' );


// ============================================
// ÖZEL SAYFALAR: PAKETLERİMİZ / ÖDEME BİLGİLERİ
// ============================================
function hitit_kongre_get_default_packages_content() {
    return <<<'HTML'
<div class="hitit-plan-grid">
    <section class="hitit-plan-card hitit-plan-card--featured">
        <p class="hitit-plan-badge">Akademik odaklı paket</p>
        <h2>Bilimsel Paket</h2>
        <p>Bilimsel programa tam erişim sağlayan bu paket; oturumlar, konuşmalar ve akademik içeriklere katılım için hazırlanmıştır.</p>
        <div class="hitit-plan-price">Fiyat bilgisi yakında duyurulacaktır</div>
        <ul>
            <li>Tüm bilimsel oturumlara katılım</li>
            <li>Ana salon konuşmaları ve panellere erişim</li>
            <li>Dijital katılım sertifikası</li>
            <li>Kongre çantası ve basılı materyaller</li>
        </ul>
    </section>

    <section class="hitit-plan-card">
        <p class="hitit-plan-badge">Etkinlik ve deneyim paketi</p>
        <h2>Sosyal Paket</h2>
        <p>Kongrenin sosyal yönüne katılmak isteyen misafirler için planlanan bu paket, etkinlik ve organizasyon alanlarını kapsar.</p>
        <div class="hitit-plan-price">Sosyal program detayları kayıt takvimi ile paylaşılacaktır</div>
        <ul>
            <li>Sosyal program etkinliklerine katılım</li>
            <li>Karşılama ve organizasyon alanı erişimi</li>
            <li>Belirlenen sosyal buluşmalara öncelik</li>
            <li>Program akışı ve saha yönlendirme desteği</li>
        </ul>
    </section>
</div>

<section class="hitit-section-card">
    <h2>Kayıt Notları</h2>
    <ul>
        <li>Erken kayıt, öğrenci veya toplu başvuru indirimleri varsa bu alandan duyurabilirsiniz.</li>
        <li>Bilimsel ve sosyal paket içeriklerini ihtiyaçlarınıza göre WordPress panelinden güncelleyebilirsiniz.</li>
        <li>Bu içerik WordPress sayfa düzenleyicisinden doğrudan güncellenebilir.</li>
    </ul>
</section>
HTML;
}

function hitit_kongre_get_default_payment_content() {
    return <<<'HTML'
<div class="hitit-payment-grid">
    <section class="hitit-section-card hitit-section-card--primary hitit-section-card--full">
        <h2>Havale / EFT Bilgileri</h2>
        <p>Ödeme grubunuzu aşağıdaki menüden seçin. Seçtiğiniz döneme göre ilgili IBAN bilgileri aşağıda açılacaktır.</p>

        <div class="hitit-payment-switcher" data-payment-switcher>
            <div class="hitit-payment-menu" role="tablist" aria-label="Ödeme dönemleri">
                <button type="button" class="hitit-payment-menu__button is-active" data-payment-target="payment-period-a" aria-controls="payment-period-a" aria-expanded="true">
                    <span class="hitit-payment-menu__label">Dönem 1-2-3 (A)</span>
                </button>
                <button type="button" class="hitit-payment-menu__button" data-payment-target="payment-period-b" aria-controls="payment-period-b" aria-expanded="false">
                    <span class="hitit-payment-menu__label">Dönem 4-5-6 (B)</span>
                </button>
            </div>

            <div class="hitit-payment-panels">
                <section id="payment-period-a" class="hitit-payment-panel is-open" data-payment-panel>
                    <div class="hitit-payment-panel__inner">
                        <h3>Dönem 1-2-3 (A) IBAN Bilgileri</h3>
                        <dl class="hitit-info-list">
                            <div>
                                <dt>Hesap Adı</dt>
                                <dd>[A Grubu Hesap Adı Soyadı / Kurum Ünvanı]</dd>
                            </div>
                            <div>
                                <dt>Banka</dt>
                                <dd>[A Grubu Banka Adı - Şube]</dd>
                            </div>
                            <div>
                                <dt>IBAN</dt>
                                <dd>[A Grubu TR00 0000 0000 0000 0000 0000 00]</dd>
                            </div>
                            <div>
                                <dt>Açıklama</dt>
                                <dd>[Ad Soyad - Dönem 1-2-3 Kaydı]</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <section id="payment-period-b" class="hitit-payment-panel" data-payment-panel>
                    <div class="hitit-payment-panel__inner">
                        <h3>Dönem 4-5-6 (B) IBAN Bilgileri</h3>
                        <dl class="hitit-info-list">
                            <div>
                                <dt>Hesap Adı</dt>
                                <dd>[B Grubu Hesap Adı Soyadı / Kurum Ünvanı]</dd>
                            </div>
                            <div>
                                <dt>Banka</dt>
                                <dd>[B Grubu Banka Adı - Şube]</dd>
                            </div>
                            <div>
                                <dt>IBAN</dt>
                                <dd>[B Grubu TR00 0000 0000 0000 0000 0000 00]</dd>
                            </div>
                            <div>
                                <dt>Açıklama</dt>
                                <dd>[Ad Soyad - Dönem 4-5-6 Kaydı]</dd>
                            </div>
                        </dl>
                    </div>
                </section>
            </div>
        </div>

        <dl class="hitit-info-list">
            <div>
                <dt>Not</dt>
                <dd>Lütfen ödemenizi yalnızca kendi dönem grubunuza ait IBAN numarasına gönderin.</dd>
            </div>
            <div>
                <dt>Dekont</dt>
                <dd>Dekont üzerinde ad soyad ve dönem bilgisi mutlaka yer almalıdır.</dd>
            </div>
        </dl>
        <p>Canlıya almadan önce köşeli parantez içindeki alanları gerçek IBAN ve hesap bilgilerinizle güncelleyin.</p>
    </section>

    <section class="hitit-section-card">
        <h2>Ödeme Adımları</h2>
        <ol>
            <li>Kayıt formunuzu eksiksiz doldurun.</li>
            <li>Belirtilen hesaba havale veya EFT işlemini tamamlayın.</li>
            <li>Dekontunuzu açıklama bilgisiyle birlikte kayıt ekibine iletin.</li>
            <li>Onay e-postası geldikten sonra kaydınız kesinleşir.</li>
        </ol>
    </section>

    <section class="hitit-section-card">
        <h2>Önemli Bilgiler</h2>
        <ul>
            <li>Dekont üzerinde katılımcının adı soyadı mutlaka yer almalıdır.</li>
            <li>Kurumsal ödeme yapılacaksa fatura bilgileri ayrıca iletilmelidir.</li>
            <li>İade ve iptal koşulları için kayıt sözleşmesi sayfasını referans alabilirsiniz.</li>
        </ul>
    </section>
 </div>

<section class="hitit-section-card">
    <h2>İletişim</h2>
    <p>Ödeme teyidi, fatura talebi veya özel durumlar için organizasyon ekibine e-posta ve telefon üzerinden ulaşabilirsiniz.</p>
    <ul>
        <li>E-posta: iletisim@hitittipkongresi.com</li>
        <li>Konu başlığı: Ödeme Bilgisi / Dekont Gönderimi</li>
    </ul>
</section>
HTML;
}

function hitit_kongre_get_default_program_atlasi_content() {
    return <<<'HTML'
<!-- wp:group {"className":"hitit-program-atlas","layout":{"type":"constrained"}} -->
<div class="wp-block-group hitit-program-atlas">
    <!-- wp:group {"className":"hitit-program-atlas__hero","layout":{"type":"default"}} -->
    <div class="wp-block-group hitit-program-atlas__hero">
        <!-- wp:group {"className":"hitit-program-atlas__hero-inner","layout":{"type":"default"}} -->
        <div class="wp-block-group hitit-program-atlas__hero-inner">
            <!-- wp:group {"className":"hitit-program-atlas__hero-copy","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__hero-copy">
                <!-- wp:paragraph {"className":"hitit-program-atlas__eyebrow"} -->
                <p class="hitit-program-atlas__eyebrow">Bilimsel Ritmin Alternatif Yorumu</p>
                <!-- /wp:paragraph -->

                <!-- wp:heading {"level":1,"className":"hitit-program-atlas__title"} -->
                <h1 class="wp-block-heading hitit-program-atlas__title">Program Atlası</h1>
                <!-- /wp:heading -->

                <!-- wp:paragraph {"className":"hitit-program-atlas__lead"} -->
                <p class="hitit-program-atlas__lead">Uc gunluk akisi; gun temalari, oturum yogunlugu ve salon dagilimi uzerinden okutan, klasik zaman cizelgesinden daha anlatili bir program deneyimi.</p>
                <!-- /wp:paragraph -->

                <!-- wp:group {"className":"hitit-program-atlas__meta-grid","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__meta-grid">
                    <!-- wp:group {"className":"hitit-program-atlas__meta-card","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__meta-card">
                        <!-- wp:heading {"level":3,"className":"hitit-program-atlas__meta-value"} -->
                        <h3 class="wp-block-heading hitit-program-atlas__meta-value">3</h3>
                        <!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__meta-label"} -->
                        <p class="hitit-program-atlas__meta-label">Kurgulanmis gun</p>
                        <!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->

                    <!-- wp:group {"className":"hitit-program-atlas__meta-card","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__meta-card">
                        <!-- wp:heading {"level":3,"className":"hitit-program-atlas__meta-value"} -->
                        <h3 class="wp-block-heading hitit-program-atlas__meta-value">16</h3>
                        <!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__meta-label"} -->
                        <p class="hitit-program-atlas__meta-label">Akis noktasi</p>
                        <!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->

                    <!-- wp:group {"className":"hitit-program-atlas__meta-card","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__meta-card">
                        <!-- wp:heading {"level":3,"className":"hitit-program-atlas__meta-value"} -->
                        <h3 class="wp-block-heading hitit-program-atlas__meta-value">8</h3>
                        <!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__meta-label"} -->
                        <p class="hitit-program-atlas__meta-label">Salon ve alan</p>
                        <!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->

                    <!-- wp:group {"className":"hitit-program-atlas__meta-card","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__meta-card">
                        <!-- wp:heading {"level":3,"className":"hitit-program-atlas__meta-value"} -->
                        <h3 class="wp-block-heading hitit-program-atlas__meta-value">7</h3>
                        <!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__meta-label"} -->
                        <p class="hitit-program-atlas__meta-label">Oturum formati</p>
                        <!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->

            <!-- wp:group {"className":"hitit-program-atlas__hero-panel","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__hero-panel">
                <!-- wp:paragraph {"className":"hitit-program-atlas__panel-label"} -->
                <p class="hitit-program-atlas__panel-label">Akis Ozeti</p>
                <!-- /wp:paragraph -->

                <!-- wp:group {"className":"hitit-program-atlas__panel-days","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__panel-days">
                    <!-- wp:group {"className":"hitit-program-atlas__day-pill","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__day-pill">
                        <!-- wp:paragraph -->
                        <p>1. Gun</p>
                        <!-- /wp:paragraph -->
                        <!-- wp:heading {"level":3} -->
                        <h3 class="wp-block-heading">Acilis ve Klinik Gelecek</h3>
                        <!-- /wp:heading -->
                    </div>
                    <!-- /wp:group -->

                    <!-- wp:group {"className":"hitit-program-atlas__day-pill","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__day-pill">
                        <!-- wp:paragraph -->
                        <p>2. Gun</p>
                        <!-- /wp:paragraph -->
                        <!-- wp:heading {"level":3} -->
                        <h3 class="wp-block-heading">Paralel Salonlar ve Derinlesen Basliklar</h3>
                        <!-- /wp:heading -->
                    </div>
                    <!-- /wp:group -->

                    <!-- wp:group {"className":"hitit-program-atlas__day-pill","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__day-pill">
                        <!-- wp:paragraph -->
                        <p>3. Gun</p>
                        <!-- /wp:paragraph -->
                        <!-- wp:heading {"level":3} -->
                        <h3 class="wp-block-heading">Kapanis, Uretim ve Ortak Hafiza</h3>
                        <!-- /wp:heading -->
                    </div>
                    <!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:paragraph {"className":"hitit-program-atlas__panel-note"} -->
                <p class="hitit-program-atlas__panel-note">Sabah bloklari keynote ve panel yogun; ogleden sonra atolyeler ve forumlar one cikiyor. Aksam programi ise gunun ritmini sosyal etkinliklerle yumusatiyor.</p>
                <!-- /wp:paragraph -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:group -->
    </div>
    <!-- /wp:group -->

    <!-- wp:buttons {"className":"hitit-program-atlas__nav"} -->
    <div class="wp-block-buttons hitit-program-atlas__nav">
        <!-- wp:button {"className":"hitit-program-atlas__nav-link"} -->
        <div class="wp-block-button hitit-program-atlas__nav-link"><a class="wp-block-button__link wp-element-button" href="#program-day-1">1. Gun / 15 Mayis 2025</a></div>
        <!-- /wp:button -->
        <!-- wp:button {"className":"hitit-program-atlas__nav-link"} -->
        <div class="wp-block-button hitit-program-atlas__nav-link"><a class="wp-block-button__link wp-element-button" href="#program-day-2">2. Gun / 16 Mayis 2025</a></div>
        <!-- /wp:button -->
        <!-- wp:button {"className":"hitit-program-atlas__nav-link"} -->
        <div class="wp-block-button hitit-program-atlas__nav-link"><a class="wp-block-button__link wp-element-button" href="#program-day-3">3. Gun / 17 Mayis 2025</a></div>
        <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->

    <!-- wp:group {"className":"hitit-program-atlas__days","layout":{"type":"default"}} -->
    <div class="wp-block-group hitit-program-atlas__days">
        <!-- wp:group {"anchor":"program-day-1","className":"hitit-program-atlas__day","layout":{"type":"default"}} -->
        <div id="program-day-1" class="wp-block-group hitit-program-atlas__day">
            <!-- wp:group {"className":"hitit-program-atlas__day-header","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__day-header">
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-kicker"} -->
                <p class="hitit-program-atlas__day-kicker">1. Gun</p>
                <!-- /wp:paragraph -->
                <!-- wp:heading {"level":2} -->
                <h2 class="wp-block-heading">15 Mayis 2025</h2>
                <!-- /wp:heading -->
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-theme"} -->
                <p class="hitit-program-atlas__day-theme">Acilis ve Klinik Gelecek</p>
                <!-- /wp:paragraph -->
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-focus"} -->
                <p class="hitit-program-atlas__day-focus">Ilk gun; acilis enerjisini, guncel klinik perspektifi ve genc arastirmaci sunumlarini tek akis icinde bulusturur.</p>
                <!-- /wp:paragraph -->
                <!-- wp:group {"className":"hitit-program-atlas__tags","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__tags">
                    <!-- wp:paragraph --><p>Yapay zeka</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph --><p>Klinik karar destek</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph --><p>Hos geldiniz bulusmasi</p><!-- /wp:paragraph -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->

            <!-- wp:group {"className":"hitit-program-atlas__timeline","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__timeline">
                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-time">
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">08:30</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">09:30</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-body">
                        <!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} -->
                        <div class="wp-block-group hitit-program-atlas__session-topline">
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Karsilama</p><!-- /wp:paragraph -->
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Fuaye</p><!-- /wp:paragraph -->
                        </div>
                        <!-- /wp:group -->
                        <!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Kayit, Karsilama ve Sabah Kahvesi</h3><!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Organizasyon Masasi</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Yaka karti teslimi, tanisma alani ve gunun akisina yonelik ilk yonlendirmeler bu blokta tamamlanir.</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-time">
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">09:30</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">10:15</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-body">
                        <!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} -->
                        <div class="wp-block-group hitit-program-atlas__session-topline">
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Acilis</p><!-- /wp:paragraph -->
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Ana Salon</p><!-- /wp:paragraph -->
                        </div>
                        <!-- /wp:group -->
                        <!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Acilis Oturumu: Ogrenci Kongrelerinde Yeni Donem</h3><!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Duzenleme Kurulu</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Kongrenin bilimsel cercevesi, bu yilin odak basliklari ve uc gunluk deneyimin genel akisi bu oturumda paylasilir.</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-time">
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">10:30</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">11:30</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-body">
                        <!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} -->
                        <div class="wp-block-group hitit-program-atlas__session-topline">
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Keynote</p><!-- /wp:paragraph -->
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Ana Salon</p><!-- /wp:paragraph -->
                        </div>
                        <!-- /wp:group -->
                        <!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Klinik Egitimde Yapay Zeka</h3><!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Davetli Konusmaci</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Karar destek sistemlerinden simulasyon laboratuvarlarina uzanan yeni araclarin egitim etkisi ele alinir.</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-time">
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">11:45</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">13:00</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-body">
                        <!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} -->
                        <div class="wp-block-group hitit-program-atlas__session-topline">
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Sunum</p><!-- /wp:paragraph -->
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Salon A</p><!-- /wp:paragraph -->
                        </div>
                        <!-- /wp:group -->
                        <!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Sozlu Bildiri Seckisi I</h3><!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Genc Arastirmacilar</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Ogrenci arastirmalari, kisa tartisma bloklariyla birlikte hizli ve akici bir formatta sunulur.</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-time">
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">14:15</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">16:00</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} -->
                    <div class="wp-block-group hitit-program-atlas__session-body">
                        <!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} -->
                        <div class="wp-block-group hitit-program-atlas__session-topline">
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Atolye</p><!-- /wp:paragraph -->
                            <!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Atolye Studyosu</p><!-- /wp:paragraph -->
                        </div>
                        <!-- /wp:group -->
                        <!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Cerrahi Simulasyon Atolyesi</h3><!-- /wp:heading -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Beceri Egitmenleri</p><!-- /wp:paragraph -->
                        <!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Temel cerrahi el becerileri, istasyon mantigiyla ilerleyen uygulamali oturumlarda deneyimlenir.</p><!-- /wp:paragraph -->
                    </div>
                    <!-- /wp:group -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:group -->

        <!-- wp:group {"anchor":"program-day-2","className":"hitit-program-atlas__day","layout":{"type":"default"}} -->
        <div id="program-day-2" class="wp-block-group hitit-program-atlas__day">
            <!-- wp:group {"className":"hitit-program-atlas__day-header","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__day-header">
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-kicker"} --><p class="hitit-program-atlas__day-kicker">2. Gun</p><!-- /wp:paragraph -->
                <!-- wp:heading {"level":2} --><h2 class="wp-block-heading">16 Mayis 2025</h2><!-- /wp:heading -->
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-theme"} --><p class="hitit-program-atlas__day-theme">Paralel Salonlar ve Derinlesen Basliklar</p><!-- /wp:paragraph -->
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-focus"} --><p class="hitit-program-atlas__day-focus">Ikinci gun; paneller, poster koridoru ve aksam gala programiyla kongrenin en yogun ritmini tasir.</p><!-- /wp:paragraph -->
                <!-- wp:group {"className":"hitit-program-atlas__tags","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__tags">
                    <!-- wp:paragraph --><p>Onkoloji</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph --><p>Multidisipliner panel</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph --><p>Poster koridoru</p><!-- /wp:paragraph -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->

            <!-- wp:group {"className":"hitit-program-atlas__timeline","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__timeline">
                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">09:00</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">10:00</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Keynote</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Ana Salon</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Cerrahide Inovasyon ve Veri</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Davetli Konusmaci</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Dijital planlama, hasta guvenligi ve ekip koordinasyonunda veriye dayali yeni yaklasimlar ozetlenir.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">10:15</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">11:30</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Panel</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Salon A / Salon B</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Paralel Oturumlar: Dahili ve Cerrahi Perspektifler</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Oturum Baskanlari</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Iki farkli salonda eszamanli ilerleyen oturumlarda klinik yaklasim, vaka tartismasi ve yeni literatur konusulur.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">11:45</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">12:45</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Poster</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Sergi Alani</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Poster Yuruyusu ve Mentorluk Koridoru</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Hakemler ve Sunucular</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Posterler yalnizca sergilenmez; kisa geri bildirim pencereleriyle katilimcilar birebir etkilesim kurar.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">14:00</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">15:30</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Forum</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Ana Salon</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Vaka Forumu: Zor Kararlar, Acik Tartismalar</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Moderator Ekip</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Gercek yasam senaryolari uzerinden ilerleyen bu blokta farkli branslarin karar basamaklari karsilastirilir.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:group -->

        <!-- wp:group {"anchor":"program-day-3","className":"hitit-program-atlas__day","layout":{"type":"default"}} -->
        <div id="program-day-3" class="wp-block-group hitit-program-atlas__day">
            <!-- wp:group {"className":"hitit-program-atlas__day-header","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__day-header">
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-kicker"} --><p class="hitit-program-atlas__day-kicker">3. Gun</p><!-- /wp:paragraph -->
                <!-- wp:heading {"level":2} --><h2 class="wp-block-heading">17 Mayis 2025</h2><!-- /wp:heading -->
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-theme"} --><p class="hitit-program-atlas__day-theme">Kapanis, Uretim ve Ortak Hafiza</p><!-- /wp:paragraph -->
                <!-- wp:paragraph {"className":"hitit-program-atlas__day-focus"} --><p class="hitit-program-atlas__day-focus">Son gun; secili sozlu sunumlar, gelecek cagrisi ve kapanis oturumu ile daha derli toplu bir final duygusu kurar.</p><!-- /wp:paragraph -->
                <!-- wp:group {"className":"hitit-program-atlas__tags","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__tags">
                    <!-- wp:paragraph --><p>Final sunumlari</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph --><p>Ortak uretim</p><!-- /wp:paragraph -->
                    <!-- wp:paragraph --><p>Kapanis oturumu</p><!-- /wp:paragraph -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->

            <!-- wp:group {"className":"hitit-program-atlas__timeline","layout":{"type":"default"}} -->
            <div class="wp-block-group hitit-program-atlas__timeline">
                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">09:00</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">10:15</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Sunum</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Salon A</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Sozlu Bildiri Seckisi II</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Finalist Sunucular</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Hakem degerlendirmesinde one cikan calismalar daha genis zaman penceresiyle sunulur.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">10:30</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">11:30</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Panel</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Ana Salon</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Yuvarlak Masa: Ogrenci Arastirmasinin Gelecegi</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Konuk Akademisyenler</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Arastirma kulturu, ekip kurma ve surdurulebilir ogrenci inisiyatifleri uzerine acik masa formati uygulanir.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">11:45</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">12:30</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Forum</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Ana Salon</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Kongreden Cikan Fikirler: Hizli Paylasim Oturumu</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Katilimci Temsilcileri</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Katilimcilar, uc gunden akilda kalan basliklari ve sonraki yil icin onerilerini kisa sunumlarla paylasir.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"className":"hitit-program-atlas__session","layout":{"type":"default"}} -->
                <div class="wp-block-group hitit-program-atlas__session">
                    <!-- wp:group {"className":"hitit-program-atlas__session-time","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-time"><!-- wp:paragraph {"className":"hitit-program-atlas__session-start"} --><p class="hitit-program-atlas__session-start">12:30</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-end"} --><p class="hitit-program-atlas__session-end">13:15</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                    <!-- wp:group {"className":"hitit-program-atlas__session-body","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-body"><!-- wp:group {"className":"hitit-program-atlas__session-topline","layout":{"type":"default"}} --><div class="wp-block-group hitit-program-atlas__session-topline"><!-- wp:paragraph {"className":"hitit-program-atlas__session-type"} --><p class="hitit-program-atlas__session-type">Kapanis</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-track"} --><p class="hitit-program-atlas__session-track">Ana Salon</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Kapanis ve Sertifika Toreni</h3><!-- /wp:heading --><!-- wp:paragraph {"className":"hitit-program-atlas__session-speaker"} --><p class="hitit-program-atlas__session-speaker">Duzenleme Kurulu</p><!-- /wp:paragraph --><!-- wp:paragraph {"className":"hitit-program-atlas__session-summary"} --><p class="hitit-program-atlas__session-summary">Tesekkur konusmalari, odul ve sertifika teslimleri ile program resmi olarak tamamlanir.</p><!-- /wp:paragraph --></div><!-- /wp:group -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:group -->
    </div>
    <!-- /wp:group -->

    <!-- wp:group {"className":"hitit-program-atlas__notes","layout":{"type":"default"}} -->
    <div class="wp-block-group hitit-program-atlas__notes">
        <!-- wp:group {"className":"hitit-program-atlas__notes-card","layout":{"type":"default"}} -->
        <div class="wp-block-group hitit-program-atlas__notes-card">
            <!-- wp:paragraph {"className":"hitit-program-atlas__notes-label"} --><p class="hitit-program-atlas__notes-label">Sabah Akisi</p><!-- /wp:paragraph -->
            <!-- wp:heading {"level":2} --><h2 class="wp-block-heading">Yogun bilimsel bloklar gunun ilk yarisinda konumlaniyor.</h2><!-- /wp:heading -->
            <!-- wp:paragraph --><p>Keynote ve panel oturumlari art arda ilerledigi icin katilimcilarin ilk saatlerde ana salon cevresinde konumlanmasi deneyimi daha akici hale getirir.</p><!-- /wp:paragraph -->
        </div>
        <!-- /wp:group -->
        <!-- wp:group {"className":"hitit-program-atlas__notes-card","layout":{"type":"default"}} -->
        <div class="wp-block-group hitit-program-atlas__notes-card">
            <!-- wp:paragraph {"className":"hitit-program-atlas__notes-label"} --><p class="hitit-program-atlas__notes-label">Ogleden Sonra</p><!-- /wp:paragraph -->
            <!-- wp:heading {"level":2} --><h2 class="wp-block-heading">Atolye ve forumlar daha etkilesimli bir katilim ritmi kuruyor.</h2><!-- /wp:heading -->
            <!-- wp:paragraph --><p>Uygulamali oturumlar daha sinirli kapasitede kurgulandigindan, yonlendirme ve salon planlamasi bu tasarimda ozellikle gorunur tutuldu.</p><!-- /wp:paragraph -->
        </div>
        <!-- /wp:group -->
        <!-- wp:group {"className":"hitit-program-atlas__notes-card","layout":{"type":"default"}} -->
        <div class="wp-block-group hitit-program-atlas__notes-card">
            <!-- wp:paragraph {"className":"hitit-program-atlas__notes-label"} --><p class="hitit-program-atlas__notes-label">Final Duygusu</p><!-- /wp:paragraph -->
            <!-- wp:heading {"level":2} --><h2 class="wp-block-heading">Son gun daha kisa ama daha derli toplu bir kapanis etkisi veriyor.</h2><!-- /wp:heading -->
            <!-- wp:paragraph --><p>Final seckileri, yuvarlak masa ve sertifika toreni tek bir eksende toplanarak programin hafizada daha net kalmasi hedefleniyor.</p><!-- /wp:paragraph -->
        </div>
        <!-- /wp:group -->
    </div>
    <!-- /wp:group -->
</div>
<!-- /wp:group -->
HTML;
}

function hitit_kongre_get_replaceable_program_contents() {
    return array(
        '',
        trim( hitit_kongre_get_default_program_atlasi_content() ),
    );
}

function hitit_kongre_get_legacy_packages_content() {
    return <<<'HTML'
<div class="hitit-plan-grid">
    <section class="hitit-plan-card hitit-plan-card--featured">
        <p class="hitit-plan-badge">En çok tercih edilen</p>
        <h2>Standart Katılım</h2>
        <p>Bilimsel oturumlar, fuaye alanı ve kongre materyallerine tam erişim sunan temel katılım paketi.</p>
        <div class="hitit-plan-price">Fiyat bilgisi yakında duyurulacaktır</div>
        <ul>
            <li>Açılış ve kapanış oturumlarına erişim</li>
            <li>Tüm ana salon konuşmalarına katılım</li>
            <li>Dijital katılım sertifikası</li>
            <li>Kongre çantası ve basılı materyaller</li>
        </ul>
    </section>

    <section class="hitit-plan-card">
        <p class="hitit-plan-badge">Konaklamalı seçenek</p>
        <h2>Konaklamalı Katılım</h2>
        <p>Şehir dışından gelen katılımcılar için planlanmış, program ve konaklamayı birlikte düşünen kapsamlı paket.</p>
        <div class="hitit-plan-price">Detaylar kayıt takvimi ile paylaşılacaktır</div>
        <ul>
            <li>Standart katılım paketindeki tüm haklar</li>
            <li>Anlaşmalı oteller için yönlendirme desteği</li>
            <li>Sosyal program önceliği</li>
            <li>Organizasyon ekibinden seyahat danışmanlığı</li>
        </ul>
    </section>

    <section class="hitit-plan-card">
        <p class="hitit-plan-badge">Kısa süreli katılım</p>
        <h2>Günübirlik Katılım</h2>
        <p>Belirli oturumlara katılmak isteyen ziyaretçiler ve misafir konuşmacılar için esnek yapı sunar.</p>
        <div class="hitit-plan-price">Program bazlı ücretlendirme uygulanabilir</div>
        <ul>
            <li>Seçili gün ve oturumlara katılım</li>
            <li>Yaka kartı ve giriş kaydı</li>
            <li>Fuaye alanı erişimi</li>
            <li>Ek atölyeler için ayrı başvuru imkanı</li>
        </ul>
    </section>
</div>

<section class="hitit-section-card">
    <h2>Kayıt Notları</h2>
    <ul>
        <li>Erken kayıt, öğrenci ve toplu başvuru indirimleri varsa bu alandan duyurabilirsiniz.</li>
        <li>Atölye, gala veya konaklama gibi ek hizmetleri paket kartlarına ek madde olarak yazabilirsiniz.</li>
        <li>Bu içerik WordPress sayfa düzenleyicisinden doğrudan güncellenebilir.</li>
    </ul>
</section>
HTML;
}

function hitit_kongre_get_legacy_payment_content() {
    return <<<'HTML'
<div class="hitit-payment-grid">
    <section class="hitit-section-card hitit-section-card--primary">
        <h2>Havale / EFT Bilgileri</h2>
        <dl class="hitit-info-list">
            <div>
                <dt>Hesap Adı</dt>
                <dd>[Hesap Adı Soyadı / Kurum Ünvanı]</dd>
            </div>
            <div>
                <dt>Banka</dt>
                <dd>[Banka Adı - Şube]</dd>
            </div>
            <div>
                <dt>IBAN</dt>
                <dd>[TR00 0000 0000 0000 0000 0000 00]</dd>
            </div>
            <div>
                <dt>Açıklama</dt>
                <dd>[Ad Soyad - Kongre Kaydı]</dd>
            </div>
        </dl>
        <p>Canlıya almadan önce köşeli parantez içindeki alanları gerçek ödeme bilgilerinizle güncelleyin.</p>
    </section>

    <section class="hitit-section-card">
        <h2>Ödeme Adımları</h2>
        <ol>
            <li>Kayıt formunuzu eksiksiz doldurun.</li>
            <li>Belirtilen hesaba havale veya EFT işlemini tamamlayın.</li>
            <li>Dekontunuzu açıklama bilgisiyle birlikte kayıt ekibine iletin.</li>
            <li>Onay e-postası geldikten sonra kaydınız kesinleşir.</li>
        </ol>
    </section>

    <section class="hitit-section-card">
        <h2>Önemli Bilgiler</h2>
        <ul>
            <li>Dekont üzerinde katılımcının adı soyadı mutlaka yer almalıdır.</li>
            <li>Kurumsal ödeme yapılacaksa fatura bilgileri ayrıca iletilmelidir.</li>
            <li>İade ve iptal koşulları için kayıt sözleşmesi sayfasını referans alabilirsiniz.</li>
        </ul>
    </section>
 </div>

<section class="hitit-section-card">
    <h2>İletişim</h2>
    <p>Ödeme teyidi, fatura talebi veya özel durumlar için organizasyon ekibine e-posta ve telefon üzerinden ulaşabilirsiniz.</p>
    <ul>
        <li>E-posta: iletisim@hitittipkongresi.com</li>
        <li>Konu başlığı: Odeme Bilgisi / Dekont Gonderimi</li>
    </ul>
</section>
HTML;
}

function hitit_kongre_get_previous_payment_content() {
    return <<<'HTML'
<div class="hitit-payment-grid">
    <section class="hitit-section-card hitit-section-card--primary">
        <h2>Havale / EFT Bilgileri</h2>
        <dl class="hitit-info-list">
            <div>
                <dt>Hesap Adı</dt>
                <dd>[Hesap Adı Soyadı / Kurum Ünvanı]</dd>
            </div>
            <div>
                <dt>Banka</dt>
                <dd>[Banka Adı - Şube]</dd>
            </div>
            <div>
                <dt>IBAN</dt>
                <dd>[TR00 0000 0000 0000 0000 0000 00]</dd>
            </div>
            <div>
                <dt>Açıklama</dt>
                <dd>[Ad Soyad - Kongre Kaydı]</dd>
            </div>
        </dl>
        <p>Canlıya almadan önce köşeli parantez içindeki alanları gerçek ödeme bilgilerinizle güncelleyin.</p>
    </section>

    <section class="hitit-section-card">
        <h2>Ödeme Adımları</h2>
        <ol>
            <li>Kayıt formunuzu eksiksiz doldurun.</li>
            <li>Belirtilen hesaba havale veya EFT işlemini tamamlayın.</li>
            <li>Dekontunuzu açıklama bilgisiyle birlikte kayıt ekibine iletin.</li>
            <li>Onay e-postası geldikten sonra kaydınız kesinleşir.</li>
        </ol>
    </section>

    <section class="hitit-section-card">
        <h2>Önemli Bilgiler</h2>
        <ul>
            <li>Dekont üzerinde katılımcının adı soyadı mutlaka yer almalıdır.</li>
            <li>Kurumsal ödeme yapılacaksa fatura bilgileri ayrıca iletilmelidir.</li>
            <li>İade ve iptal koşulları için kayıt sözleşmesi sayfasını referans alabilirsiniz.</li>
        </ul>
    </section>
 </div>

<section class="hitit-section-card">
    <h2>İletişim</h2>
    <p>Ödeme teyidi, fatura talebi veya özel durumlar için organizasyon ekibine e-posta ve telefon üzerinden ulaşabilirsiniz.</p>
    <ul>
        <li>E-posta: iletisim@hitittipkongresi.com</li>
        <li>Konu başlığı: Ödeme Bilgisi / Dekont Gönderimi</li>
    </ul>
</section>
HTML;
}

function hitit_kongre_get_previous_dropdown_payment_content() {
    return <<<'HTML'
<div class="hitit-payment-grid">
    <section class="hitit-section-card hitit-section-card--primary hitit-section-card--full">
        <h2>Havale / EFT Bilgileri</h2>
        <p>Ödeme grubunuzu aşağıdaki menüden seçin. Seçtiğiniz döneme göre ilgili ücret tablosu aşağıda açılacaktır.</p>

        <div class="hitit-payment-switcher" data-payment-switcher>
            <div class="hitit-payment-menu" role="tablist" aria-label="Ödeme dönemleri">
                <button type="button" class="hitit-payment-menu__button is-active" data-payment-target="payment-period-a" aria-controls="payment-period-a" aria-expanded="true">
                    <span class="hitit-payment-menu__label">Dönem 1-2-3 (A)</span>
                </button>
                <button type="button" class="hitit-payment-menu__button" data-payment-target="payment-period-b" aria-controls="payment-period-b" aria-expanded="false">
                    <span class="hitit-payment-menu__label">Dönem 4-5-6 (B)</span>
                </button>
            </div>

            <div class="hitit-payment-panels">
                <section id="payment-period-a" class="hitit-payment-panel is-open" data-payment-panel>
                    <div class="hitit-payment-panel__inner">
                        <h3>Dönem 1-2-3 (A) Ücret Tablosu</h3>
                        <div class="hitit-payment-table-wrap">
                            <table class="hitit-payment-table">
                                <thead>
                                    <tr>
                                        <th>Ödeme Kalemi</th>
                                        <th>Tutar</th>
                                        <th>Açıklama</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Bilimsel Paket</td>
                                        <td>[A Grubu Bilimsel Paket Tutarı]</td>
                                        <td>Bilimsel oturumlar ve akademik programa erişim</td>
                                    </tr>
                                    <tr>
                                        <td>Sosyal Paket</td>
                                        <td>[A Grubu Sosyal Paket Tutarı]</td>
                                        <td>Sosyal program ve organizasyon etkinlikleri</td>
                                    </tr>
                                    <tr>
                                        <td>Bilimsel + Sosyal Paket</td>
                                        <td>[A Grubu Kombine Paket Tutarı]</td>
                                        <td>Her iki paketin birlikte seçildiği kayıt türü</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="payment-period-b" class="hitit-payment-panel" data-payment-panel>
                    <div class="hitit-payment-panel__inner">
                        <h3>Dönem 4-5-6 (B) Ücret Tablosu</h3>
                        <div class="hitit-payment-table-wrap">
                            <table class="hitit-payment-table">
                                <thead>
                                    <tr>
                                        <th>Ödeme Kalemi</th>
                                        <th>Tutar</th>
                                        <th>Açıklama</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Bilimsel Paket</td>
                                        <td>[B Grubu Bilimsel Paket Tutarı]</td>
                                        <td>Bilimsel oturumlar ve akademik programa erişim</td>
                                    </tr>
                                    <tr>
                                        <td>Sosyal Paket</td>
                                        <td>[B Grubu Sosyal Paket Tutarı]</td>
                                        <td>Sosyal program ve organizasyon etkinlikleri</td>
                                    </tr>
                                    <tr>
                                        <td>Bilimsel + Sosyal Paket</td>
                                        <td>[B Grubu Kombine Paket Tutarı]</td>
                                        <td>Her iki paketin birlikte seçildiği kayıt türü</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <dl class="hitit-info-list">
            <div>
                <dt>Hesap Adı</dt>
                <dd>[Hesap Adı Soyadı / Kurum Ünvanı]</dd>
            </div>
            <div>
                <dt>Banka</dt>
                <dd>[Banka Adı - Şube]</dd>
            </div>
            <div>
                <dt>IBAN</dt>
                <dd>[TR00 0000 0000 0000 0000 0000 00]</dd>
            </div>
            <div>
                <dt>Açıklama</dt>
                <dd>[Ad Soyad - Kongre Kaydı]</dd>
            </div>
        </dl>
        <p>Canlıya almadan önce köşeli parantez içindeki alanları gerçek ödeme ve ücret bilgilerinizle güncelleyin.</p>
    </section>

    <section class="hitit-section-card">
        <h2>Ödeme Adımları</h2>
        <ol>
            <li>Kayıt formunuzu eksiksiz doldurun.</li>
            <li>Belirtilen hesaba havale veya EFT işlemini tamamlayın.</li>
            <li>Dekontunuzu açıklama bilgisiyle birlikte kayıt ekibine iletin.</li>
            <li>Onay e-postası geldikten sonra kaydınız kesinleşir.</li>
        </ol>
    </section>

    <section class="hitit-section-card">
        <h2>Önemli Bilgiler</h2>
        <ul>
            <li>Dekont üzerinde katılımcının adı soyadı mutlaka yer almalıdır.</li>
            <li>Kurumsal ödeme yapılacaksa fatura bilgileri ayrıca iletilmelidir.</li>
            <li>İade ve iptal koşulları için kayıt sözleşmesi sayfasını referans alabilirsiniz.</li>
        </ul>
    </section>
 </div>

<section class="hitit-section-card">
    <h2>İletişim</h2>
    <p>Ödeme teyidi, fatura talebi veya özel durumlar için organizasyon ekibine e-posta ve telefon üzerinden ulaşabilirsiniz.</p>
    <ul>
        <li>E-posta: iletisim@hitittipkongresi.com</li>
        <li>Konu başlığı: Ödeme Bilgisi / Dekont Gönderimi</li>
    </ul>
</section>
HTML;
}

function hitit_kongre_get_previous_iban_payment_content() {
    return <<<'HTML'
<div class="hitit-payment-grid">
    <section class="hitit-section-card hitit-section-card--primary hitit-section-card--full">
        <h2>Havale / EFT Bilgileri</h2>
        <p>Ödeme grubunuzu aşağıdaki menüden seçin. Seçtiğiniz döneme göre ilgili IBAN bilgileri aşağıda açılacaktır.</p>

        <div class="hitit-payment-switcher" data-payment-switcher>
            <div class="hitit-payment-menu" role="tablist" aria-label="Ödeme dönemleri">
                <button type="button" class="hitit-payment-menu__button is-active" data-payment-target="payment-period-a" aria-controls="payment-period-a" aria-expanded="true">
                    <span class="hitit-payment-menu__label">Dönem 1-2-3 (A)</span>
                </button>
                <button type="button" class="hitit-payment-menu__button" data-payment-target="payment-period-b" aria-controls="payment-period-b" aria-expanded="false">
                    <span class="hitit-payment-menu__label">Dönem 4-5-6 (B)</span>
                </button>
            </div>

            <div class="hitit-payment-panels">
                <section id="payment-period-a" class="hitit-payment-panel is-open" data-payment-panel>
                    <div class="hitit-payment-panel__inner">
                        <h3>Dönem 1-2-3 (A) IBAN Bilgileri</h3>
                        <dl class="hitit-info-list">
                            <div>
                                <dt>Hesap Adı</dt>
                                <dd>[A Grubu Hesap Adı Soyadı / Kurum Ünvanı]</dd>
                            </div>
                            <div>
                                <dt>Banka</dt>
                                <dd>[A Grubu Banka Adı - Şube]</dd>
                            </div>
                            <div>
                                <dt>IBAN</dt>
                                <dd>[A Grubu TR00 0000 0000 0000 0000 0000 00]</dd>
                            </div>
                            <div>
                                <dt>Açıklama</dt>
                                <dd>[Ad Soyad - Dönem 1-2-3 Kaydı]</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <section id="payment-period-b" class="hitit-payment-panel" data-payment-panel>
                    <div class="hitit-payment-panel__inner">
                        <h3>Dönem 4-5-6 (B) IBAN Bilgileri</h3>
                        <dl class="hitit-info-list">
                            <div>
                                <dt>Hesap Adı</dt>
                                <dd>[B Grubu Hesap Adı Soyadı / Kurum Ünvanı]</dd>
                            </div>
                            <div>
                                <dt>Banka</dt>
                                <dd>[B Grubu Banka Adı - Şube]</dd>
                            </div>
                            <div>
                                <dt>IBAN</dt>
                                <dd>[B Grubu TR00 0000 0000 0000 0000 0000 00]</dd>
                            </div>
                            <div>
                                <dt>Açıklama</dt>
                                <dd>[Ad Soyad - Dönem 4-5-6 Kaydı]</dd>
                            </div>
                        </dl>
                    </div>
                </section>
            </div>
        </div>

        <dl class="hitit-info-list">
            <div>
                <dt>Not</dt>
                <dd>Lütfen ödemenizi yalnızca kendi dönem grubunuza ait IBAN numarasına gönderin.</dd>
            </div>
            <div>
                <dt>Dekont</dt>
                <dd>Dekont üzerinde ad soyad ve dönem bilgisi mutlaka yer almalıdır.</dd>
            </div>
        </dl>
        <p>Canlıya almadan önce köşeli parantez içindeki alanları gerçek IBAN ve hesap bilgilerinizle güncelleyin.</p>
    </section>

    <section class="hitit-section-card">
        <h2>Ödeme Adımları</h2>
        <ol>
            <li>Kayıt formunuzu eksiksiz doldurun.</li>
            <li>Belirtilen hesaba havale veya EFT işlemini tamamlayın.</li>
            <li>Dekontunuzu açıklama bilgisiyle birlikte kayıt ekibine iletin.</li>
            <li>Onay e-postası geldikten sonra kaydınız kesinleşir.</li>
        </ol>
    </section>

    <section class="hitit-section-card">
        <h2>Önemli Bilgiler</h2>
        <ul>
            <li>Dekont üzerinde katılımcının adı soyadı mutlaka yer almalıdır.</li>
            <li>Kurumsal ödeme yapılacaksa fatura bilgileri ayrıca iletilmelidir.</li>
            <li>İade ve iptal koşulları için kayıt sözleşmesi sayfasını referans alabilirsiniz.</li>
        </ul>
    </section>
 </div>

<section class="hitit-section-card">
    <h2>İletişim</h2>
    <p>Ödeme teyidi, fatura talebi veya özel durumlar için organizasyon ekibine e-posta ve telefon üzerinden ulaşabilirsiniz.</p>
    <ul>
        <li>E-posta: iletisim@hitittipkongresi.com</li>
        <li>Konu başlığı: Ödeme Bilgisi / Dekont Gönderimi</li>
    </ul>
</section>
HTML;
}

function hitit_kongre_get_replaceable_payment_contents() {
    return array(
        trim( hitit_kongre_get_legacy_payment_content() ),
        trim( hitit_kongre_get_previous_payment_content() ),
        trim( hitit_kongre_get_previous_dropdown_payment_content() ),
        trim( hitit_kongre_get_previous_iban_payment_content() ),
        trim( hitit_kongre_get_default_payment_content() ),
    );
}

function hitit_kongre_is_generated_payment_content( $content ) {
    return in_array( trim( (string) $content ), hitit_kongre_get_replaceable_payment_contents(), true );
}

function hitit_kongre_has_page_content( $post = null ) {
    $post = get_post( $post );

    if ( ! $post instanceof WP_Post ) {
        return false;
    }

    return '' !== trim( wp_strip_all_tags( $post->post_content ) );
}

function hitit_kongre_get_special_pages() {
    return array(
        array(
            'title'   => 'Paketlerimiz',
            'slug'    => 'paketlerimiz',
            'content' => hitit_kongre_get_default_packages_content(),
            'order'   => 30,
        ),
        array(
            'title'   => 'Ödeme Bilgileri',
            'slug'    => 'odeme-bilgileri',
            'content' => hitit_kongre_get_default_payment_content(),
            'order'   => 31,
        ),
        array(
            'title'   => 'Program Atlası',
            'slug'    => 'program-atlasi',
            'content' => hitit_kongre_get_default_program_atlasi_content(),
            'order'   => 32,
            'replaceable_contents' => hitit_kongre_get_replaceable_program_contents(),
        ),
    );
}

function hitit_kongre_create_special_pages() {
    foreach ( hitit_kongre_get_special_pages() as $page ) {
        $existing_page = get_page_by_path( $page['slug'], OBJECT, 'page' );

        if ( $existing_page ) {
            $replaceable_contents = array(
                trim( hitit_kongre_get_legacy_packages_content() ),
                ...hitit_kongre_get_replaceable_payment_contents(),
            );

            if ( ! empty( $page['replaceable_contents'] ) && is_array( $page['replaceable_contents'] ) ) {
                $replaceable_contents = array_merge(
                    $replaceable_contents,
                    array_map( 'trim', $page['replaceable_contents'] )
                );
            }

            if ( in_array( trim( $existing_page->post_content ), $replaceable_contents, true ) ) {
                wp_update_post(
                    array(
                        'ID'           => $existing_page->ID,
                        'post_content' => wp_slash( $page['content'] ),
                    )
                );
            }

            continue;
        }

        wp_insert_post(
            array(
                'post_type'    => 'page',
                'post_status'  => 'publish',
                'post_title'   => $page['title'],
                'post_name'    => $page['slug'],
                'post_content' => wp_slash( $page['content'] ),
                'menu_order'   => $page['order'],
            )
        );
    }
}

function hitit_kongre_maybe_create_special_pages() {
    $version = '2026-03-17-special-pages-v8';

    if ( get_option( 'hitit_kongre_special_pages_version' ) === $version ) {
        return;
    }

    hitit_kongre_create_special_pages();
    update_option( 'hitit_kongre_special_pages_version', $version );
}
add_action( 'after_switch_theme', 'hitit_kongre_create_special_pages' );
add_action( 'admin_init', 'hitit_kongre_maybe_create_special_pages' );


// ============================================
// STİL & SCRİPT YÜKLEME (Frontend)
// ============================================
function hitit_kongre_scripts() {
    // Google Fonts, Font Awesome ve style.css artık header.php'de inline olarak yükleniyor.
    // Ayrı dosya isteği yapılmasına gerek yok (render-blocking önlendi).

    // Tailwind CSS (locally built — npm run build:css)
    wp_enqueue_style(
        'hitit-tailwind',
        get_template_directory_uri() . '/assets/css/tailwind.css',
        array(),
        wp_get_theme()->get( 'Version' )
    );

    // Ana tema stili — inline olarak header.php'de yükleniyor, ayrı dosya isteği yapma
    // wp_enqueue_style yerine sadece WordPress'in theme stylesheet'i tanımasını sağla
    // (wp_head zaten inline'da)

    // Tema özel stilleri
    if ( file_exists( get_template_directory() . '/assets/css/theme.css' ) ) {
        wp_enqueue_style(
            'hitit-custom-style',
            get_template_directory_uri() . '/assets/css/theme.css',
            array(),
            wp_get_theme()->get( 'Version' )
        );
    }

    // Tema özel JS
    if ( file_exists( get_template_directory() . '/assets/js/theme.js' ) ) {
        wp_enqueue_script(
            'hitit-theme-js',
            get_template_directory_uri() . '/assets/js/theme.js',
            array(),
            wp_get_theme()->get( 'Version' ),
            true
        );
    }
}
add_action( 'wp_enqueue_scripts', 'hitit_kongre_scripts' );


// ============================================
// EDİTÖR İÇİN STİL & SCRİPT (Blok Editörde aynı görünüm)
// ============================================
function hitit_kongre_editor_assets() {
    // Google Fonts editörde de yüklensin (local)
    wp_enqueue_style(
        'hitit-editor-google-fonts',
        get_template_directory_uri() . '/assets/css/google-fonts-local.css',
        array(),
        wp_get_theme()->get( 'Version' )
    );

    // Font Awesome editörde de yüklensin (local)
    wp_enqueue_style(
        'hitit-editor-font-awesome',
        get_template_directory_uri() . '/assets/css/fontawesome-local.css',
        array(),
        '6.4.0'
    );
}
add_action( 'enqueue_block_editor_assets', 'hitit_kongre_editor_assets' );


// ============================================
// WİDGET ALANLARI
// ============================================
function hitit_kongre_widgets_init() {
    register_sidebar( array(
        'name'          => __( 'Footer Widget Alanı', 'hitit-kongre' ),
        'id'            => 'footer-widgets',
        'description'   => __( 'Footer bölümüne widget ekleyin.', 'hitit-kongre' ),
        'before_widget' => '<div id="%1$s" class="widget %2$s mb-6">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="text-white font-serif text-lg mb-4">',
        'after_title'   => '</h4>',
    ));

    register_sidebar( array(
        'name'          => __( 'Sidebar', 'hitit-kongre' ),
        'id'            => 'sidebar-1',
        'description'   => __( 'Kenar çubuğuna widget ekleyin.', 'hitit-kongre' ),
        'before_widget' => '<div id="%1$s" class="widget %2$s mb-6 p-4 border border-white/10 bg-cardBlack">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="text-white font-serif text-lg mb-3">',
        'after_title'   => '</h3>',
    ));
}
add_action( 'widgets_init', 'hitit_kongre_widgets_init' );


// ============================================
// BLOK EDİTÖR - BLOK KATEGORİSİ
// ============================================
function hitit_kongre_block_categories( $categories ) {
    return array_merge(
        array(
            array(
                'slug'  => 'hitit-kongre',
                'title' => __( 'Hitit Kongre', 'hitit-kongre' ),
                'icon'  => 'heart',
            ),
        ),
        $categories
    );
}
add_filter( 'block_categories_all', 'hitit_kongre_block_categories' );


// ============================================
// BLOK PATTERN KATEGORİSİ
// ============================================
function hitit_kongre_register_pattern_categories() {
    register_block_pattern_category(
        'hitit-kongre',
        array( 'label' => __( 'Hitit Kongre', 'hitit-kongre' ) )
    );
}
add_action( 'init', 'hitit_kongre_register_pattern_categories' );


// ============================================
// EXCERPT UZUNLUĞU
// ============================================
function hitit_kongre_excerpt_length( $length ) {
    return 25;
}
add_filter( 'excerpt_length', 'hitit_kongre_excerpt_length' );


// ============================================
// ADMIN BAR OFFSET KALDIR
// ============================================
function hitit_kongre_admin_bar_fix() {
    if ( is_admin_bar_showing() ) {
        echo '<style>html { margin-top: 0 !important; } #wpadminbar { position: fixed !important; }</style>';
    }
}
add_action( 'wp_head', 'hitit_kongre_admin_bar_fix' );


// ============================================
// LOGO RESMİNE BOYUT EKLE (CLS önle + Lighthouse uyarısı)
// ============================================
// the_custom_logo() çıktısındaki img'ye explicit width/height ekle
function hitit_kongre_custom_logo_attr( $html ) {
    // h-10 = 40px, logo genişliği oranına göre otomatik
    // img'de width/height yoksa ekle
    if ( strpos( $html, 'width=' ) === false ) {
        $html = str_replace( '<img', '<img width="140" height="40"', $html );
    }
    return $html;
}
add_filter( 'get_custom_logo', 'hitit_kongre_custom_logo_attr' );


// ============================================
// FONT AWESOME CSS'İ FOOTER'DA LAZY YÜKLE
// Header'daki ikonlar artık inline SVG, FA sadece
// footer (sosyal medya) ve single.php (meta) için gerekli.
// ============================================
function hitit_kongre_load_fa_footer() {
    $fa_css = get_template_directory() . '/assets/css/fontawesome-local.css';
    if ( file_exists( $fa_css ) ) {
        $css = file_get_contents( $fa_css );
        $webfonts_dir = esc_url( get_template_directory_uri() . '/assets/webfonts/' );
        $css = str_replace( 'url(../webfonts/', 'url(' . $webfonts_dir, $css );
        // Yorum satırlarını kaldır
        $css = preg_replace( '/\/\*[\s\S]*?\*\//', '', $css );
        echo '<style id="hitit-fa-css">' . $css . '</style>';
    }
}
add_action( 'wp_footer', 'hitit_kongre_load_fa_footer' );


// ============================================
// KULLANILMAYAN CSS'LERİ KALDIR / ERTELE
// ============================================

// WordPress blok kütüphanesi varsayılan stillerini kaldır (wp-block-library)
// Tema zaten Tailwind + kendi stilleriyle çalışıyor, bu stiller gereksiz.
// function hitit_kongre_remove_unused_css() {
//    // wp-block-library: WordPress blok editörünün varsayılan frontend stilleri (~14 KB)
//    // Tema kendi stil sistemini kullandığı için bu gereksiz.
//    wp_dequeue_style( 'wp-block-library' );
//    wp_deregister_style( 'wp-block-library' );
//
//    // wp-block-library-theme: Tema uyum katmanı
//    wp_dequeue_style( 'wp-block-library-theme' );
//    wp_deregister_style( 'wp-block-library-theme' );
//
//    // Klasik tema stilleri (classic-theme-styles)
//    wp_dequeue_style( 'classic-theme-styles' );
//    wp_deregister_style( 'classic-theme-styles' );
// }
// add_action( 'wp_enqueue_scripts', 'hitit_kongre_remove_unused_css', 100 );

// WordPress global styles CSS'ini erteleyerek kritik yoldan çıkar.
// Bu CSS theme.json'dan üretilir ve render-blocking'dir.
function hitit_kongre_defer_global_styles( $html, $handle ) {
    // Global styles ve global-styles-inline'ı ertele
    if ( 'global-styles' === $handle ) {
        // media="print" + onload ile asenkron yükleme
        $html = str_replace(
            "media='all'",
            "media='print' onload=\"this.media='all'\"",
            $html
        );
        // Fallback: tek tırnak yoksa çift tırnak dene
        $html = str_replace(
            'media="all"',
            'media="print" onload="this.media=\'all\'"',
            $html
        );
    }
    return $html;
}
add_filter( 'style_loader_tag', 'hitit_kongre_defer_global_styles', 10, 2 );


// ============================================
// CUSTOMIZER AYARLARI
// Görünüm → Özelleştir menüsünden tüm header/footer bilgilerini düzenle
// ============================================
function hitit_kongre_customize_register( $wp_customize ) {

    // ─────────────────────────────────────
    // HEADER BÖLÜMÜ
    // ─────────────────────────────────────
    $wp_customize->add_section( 'hitit_header', array(
        'title'    => __( 'Header Ayarları', 'hitit-kongre' ),
        'priority' => 30,
    ));

    // Logo üstü yazı (ör. "Hitit Üniversitesi")
    $wp_customize->add_setting( 'hitit_header_subtitle', array(
        'default'           => 'Hitit Üniversitesi',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control( 'hitit_header_subtitle', array(
        'label'   => __( 'Logo Üstü Yazı', 'hitit-kongre' ),
        'section' => 'hitit_header',
        'type'    => 'text',
    ));

    // Logo ikonu göster/gizle
    $wp_customize->add_setting( 'hitit_show_logo_icon', array(
        'default'           => true,
        'sanitize_callback' => 'wp_validate_boolean',
    ));
    $wp_customize->add_control( 'hitit_show_logo_icon', array(
        'label'   => __( 'Varsayılan Logo İkonunu Göster', 'hitit-kongre' ),
        'description' => __( 'Özel logo yüklemezseniz yılan ikonu gösterilir. Kapatırsanız sadece yazı görünür.', 'hitit-kongre' ),
        'section' => 'hitit_header',
        'type'    => 'checkbox',
    ));

    // Navbar CTA Butonu
    $wp_customize->add_setting( 'hitit_header_cta_text', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control( 'hitit_header_cta_text', array(
        'label'       => __( 'Navbar Buton Yazısı', 'hitit-kongre' ),
        'description' => __( 'Boş bırakırsan buton görünmez. Ör: "Kayıt Ol"', 'hitit-kongre' ),
        'section'     => 'hitit_header',
        'type'        => 'text',
    ));

    $wp_customize->add_setting( 'hitit_header_cta_url', array(
        'default'           => '#',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control( 'hitit_header_cta_url', array(
        'label'   => __( 'Navbar Buton Linki', 'hitit-kongre' ),
        'section' => 'hitit_header',
        'type'    => 'url',
    ));

    // ─────────────────────────────────────
    // FOOTER BÖLÜMÜ
    // ─────────────────────────────────────
    $wp_customize->add_section( 'hitit_footer', array(
        'title'    => __( 'Footer Ayarları', 'hitit-kongre' ),
        'priority' => 35,
    ));

    // Footer açıklama metni
    $wp_customize->add_setting( 'hitit_footer_description', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_textarea_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control( 'hitit_footer_description', array(
        'label'       => __( 'Footer Açıklama Metni', 'hitit-kongre' ),
        'description' => __( 'Boş bırakırsan "Site Açıklaması" (Ayarlar → Genel) kullanılır.', 'hitit-kongre' ),
        'section'     => 'hitit_footer',
        'type'        => 'textarea',
    ));

    // Adres
    $wp_customize->add_setting( 'hitit_footer_address', array(
        'default'           => 'Çorum Hitit Üniversitesi Erol Olçok Eğitim ve Araştırma Hastanesi',
        'sanitize_callback' => 'sanitize_textarea_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control( 'hitit_footer_address', array(
        'label'   => __( 'Adres', 'hitit-kongre' ),
        'section' => 'hitit_footer',
        'type'    => 'textarea',
    ));

    // E-posta
    $wp_customize->add_setting( 'hitit_footer_email', array(
        'default'           => 'iletisim@hitittipkongresi.com',
        'sanitize_callback' => 'sanitize_email',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control( 'hitit_footer_email', array(
        'label'   => __( 'E-posta Adresi', 'hitit-kongre' ),
        'section' => 'hitit_footer',
        'type'    => 'email',
    ));

    // Telefon
    $wp_customize->add_setting( 'hitit_footer_phone', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control( 'hitit_footer_phone', array(
        'label'       => __( 'Telefon Numarası', 'hitit-kongre' ),
        'description' => __( 'Boş bırakırsan görünmez.', 'hitit-kongre' ),
        'section'     => 'hitit_footer',
        'type'        => 'text',
    ));

    // Telif hakkı metni
    $wp_customize->add_setting( 'hitit_footer_copyright', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control( 'hitit_footer_copyright', array(
        'label'       => __( 'Telif Hakkı Metni', 'hitit-kongre' ),
        'description' => __( 'Boş bırakırsan "© 2026 Site Adı. Tüm hakları saklıdır." kullanılır.', 'hitit-kongre' ),
        'section'     => 'hitit_footer',
        'type'        => 'text',
    ));

    // Footer Logo (üniversite logosu vb.)
    $wp_customize->add_setting( 'hitit_footer_logo', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'hitit_footer_logo', array(
        'label'       => __( 'Footer Logo', 'hitit-kongre' ),
        'description' => __( 'Copyright satırında gösterilecek logo (ör. üniversite logosu). Önerilen yükseklik: 40-60px.', 'hitit-kongre' ),
        'section'     => 'hitit_footer',
    )));

    // ─────────────────────────────────────
    // SOSYAL MEDYA
    // ─────────────────────────────────────
    $wp_customize->add_section( 'hitit_social', array(
        'title'    => __( 'Sosyal Medya Linkleri', 'hitit-kongre' ),
        'priority' => 36,
    ));

    $social_platforms = array(
        'instagram' => 'Instagram',
        'twitter'   => 'Twitter / X',
        'youtube'   => 'YouTube',
        'linkedin'  => 'LinkedIn',
        'facebook'  => 'Facebook',
    );

    foreach ( $social_platforms as $key => $label ) {
        $wp_customize->add_setting( 'hitit_social_' . $key, array(
            'default'           => '',
            'sanitize_callback' => 'esc_url_raw',
        ));
        $wp_customize->add_control( 'hitit_social_' . $key, array(
            'label'   => $label . ' URL',
            'section' => 'hitit_social',
            'type'    => 'url',
        ));
    }

    // ─────────────────────────────────────
    // SÖZLEŞMELER (KVKK & Kayıt)
    // ─────────────────────────────────────
    $wp_customize->add_section( 'hitit_agreements', array(
        'title'    => __( 'Sözleşme Linkleri', 'hitit-kongre' ),
        'priority' => 37,
        'description' => __( 'Footer\'da görünecek sözleşme linkleri.', 'hitit-kongre' ),
    ));

    // Kayıt Sözleşmesi
    $wp_customize->add_setting( 'hitit_footer_agreement_text', array(
        'default'           => 'Mesafeli Satış Sözleşmesi',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control( 'hitit_footer_agreement_text', array(
        'label'   => __( 'Kayıt Sözleşmesi Metni', 'hitit-kongre' ),
        'section' => 'hitit_agreements',
        'type'    => 'text',
    ));

    $wp_customize->add_setting( 'hitit_footer_agreement_url', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control( 'hitit_footer_agreement_url', array(
        'label'   => __( 'Kayıt Sözleşmesi Linki', 'hitit-kongre' ),
        'section' => 'hitit_agreements',
        'type'    => 'url',
    ));

    // KVKK Metni
    $wp_customize->add_setting( 'hitit_footer_kvkk_text', array(
        'default'           => 'KVKK Aydınlatma Metni',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control( 'hitit_footer_kvkk_text', array(
        'label'   => __( 'KVKK Metni', 'hitit-kongre' ),
        'section' => 'hitit_agreements',
        'type'    => 'text',
    ));

    $wp_customize->add_setting( 'hitit_footer_kvkk_url', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control( 'hitit_footer_kvkk_url', array(
        'label'   => __( 'KVKK Linki', 'hitit-kongre' ),
        'section' => 'hitit_agreements',
        'type'    => 'url',
    ));
}
add_action( 'customize_register', 'hitit_kongre_customize_register' );


// ============================================
// CUSTOMIZER CANLI ÖNİZLEME (postMessage)
// ============================================
function hitit_kongre_customize_preview_js() {
    wp_enqueue_script(
        'hitit-customizer-preview',
        get_template_directory_uri() . '/assets/js/customizer-preview.js',
        array( 'customize-preview' ),
        wp_get_theme()->get( 'Version' ),
        true
    );
}
add_action( 'customize_preview_init', 'hitit_kongre_customize_preview_js' );


// ============================================
// ADMIN: PROGRAM PDF STÜDYOSU
// ============================================
function hitit_kongre_get_program_pdf_pages() {
    $pages      = get_pages(
        array(
            'sort_column'  => 'menu_order,post_title',
            'sort_order'   => 'ASC',
            'hierarchical' => false,
        )
    );
    $candidates = array();

    foreach ( $pages as $page ) {
        $haystack = strtolower( $page->post_title . ' ' . $page->post_name );

        if (
            false !== strpos( $haystack, 'program' ) ||
            false !== strpos( $haystack, 'atlas' ) ||
            'program-atlasi' === $page->post_name
        ) {
            $candidates[] = $page;
        }
    }

    return $candidates;
}

function hitit_kongre_get_program_pdf_default_page_id() {
    $pages = hitit_kongre_get_program_pdf_pages();

    if ( empty( $pages ) ) {
        return 0;
    }

    foreach ( $pages as $page ) {
        if ( 'program-atlasi' === $page->post_name ) {
            return (int) $page->ID;
        }
    }

    return (int) $pages[0]->ID;
}

function hitit_kongre_get_program_pdf_logo_url() {
    $custom_logo_id = (int) get_theme_mod( 'custom_logo' );

    if ( $custom_logo_id ) {
        $logo_url = wp_get_attachment_image_url( $custom_logo_id, 'full' );

        if ( $logo_url ) {
            return $logo_url;
        }
    }

    $site_icon_id = (int) get_option( 'site_icon' );

    if ( $site_icon_id ) {
        $icon_url = wp_get_attachment_image_url( $site_icon_id, 'full' );

        if ( $icon_url ) {
            return $icon_url;
        }
    }

    return '';
}

function hitit_kongre_get_program_pdf_rendered_content( $post_id ) {
    $post = get_post( $post_id );

    if ( ! $post instanceof WP_Post || 'page' !== $post->post_type ) {
        return '';
    }

    $content = trim( (string) $post->post_content );

    if ( '' === $content && 'program-atlasi' === $post->post_name && function_exists( 'hitit_kongre_get_default_program_atlasi_content' ) ) {
        $content = hitit_kongre_get_default_program_atlasi_content();
    }

    return apply_filters( 'the_content', $content );
}

function hitit_kongre_add_program_pdf_admin_page() {
    add_submenu_page(
        'edit.php?post_type=page',
        __( 'Program PDF', 'hitit-kongre' ),
        __( 'Program PDF', 'hitit-kongre' ),
        'edit_pages',
        'hitit-program-pdf',
        'hitit_kongre_render_program_pdf_admin_page'
    );
}
add_action( 'admin_menu', 'hitit_kongre_add_program_pdf_admin_page' );

function hitit_kongre_program_pdf_admin_assets( $hook ) {
    if ( false === strpos( $hook, 'hitit-program-pdf' ) ) {
        return;
    }

    wp_enqueue_style(
        'hitit-program-pdf-admin',
        get_template_directory_uri() . '/assets/css/admin-program-pdf.css',
        array(),
        wp_get_theme()->get( 'Version' )
    );
}
add_action( 'admin_enqueue_scripts', 'hitit_kongre_program_pdf_admin_assets' );

function hitit_kongre_render_program_pdf_admin_page() {
    if ( ! current_user_can( 'edit_pages' ) ) {
        wp_die( esc_html__( 'Bu sayfaya erişim yetkiniz yok.', 'hitit-kongre' ) );
    }

    $pages            = hitit_kongre_get_program_pdf_pages();
    $default_page_id  = hitit_kongre_get_program_pdf_default_page_id();
    $selected_page_id = isset( $_GET['post_id'] ) ? (int) $_GET['post_id'] : $default_page_id;
    $selected_page    = $selected_page_id ? get_post( $selected_page_id ) : null;
    $preview_url      = '';
    $print_url        = '';

    if ( $selected_page instanceof WP_Post ) {
        $preview_url = wp_nonce_url(
            admin_url( 'admin-post.php?action=hitit_kongre_program_pdf_preview&post_id=' . $selected_page->ID ),
            'hitit_kongre_program_pdf_preview_' . $selected_page->ID
        );

        $print_url = add_query_arg( 'autoprint', '1', $preview_url );
    }
    ?>
    <div class="wrap hitit-program-pdf-admin">
        <div class="hitit-program-pdf-admin__hero">
            <div>
                <p class="hitit-program-pdf-admin__eyebrow">Kongre Programı PDF</p>
                <h1>Portre PDF Stüdyosu</h1>
                <p>Seçtiğiniz program sayfasını, BildiriHitit PDF çıktısına benzer beyaz sayfa düzeninde A4 portre önizleyip PDF olarak kaydedebilirsiniz.</p>
            </div>
            <div class="hitit-program-pdf-admin__meta">
                <span>A4 Portrait</span>
                <span>Tarayıcı ile PDF kaydet</span>
            </div>
        </div>

        <div class="hitit-program-pdf-admin__grid">
            <section class="hitit-program-pdf-admin__card">
                <h2>Program Sayfası Seç</h2>
                <form method="get" class="hitit-program-pdf-admin__form">
                    <input type="hidden" name="post_type" value="page" />
                    <input type="hidden" name="page" value="hitit-program-pdf" />
                    <label for="hitit-program-pdf-post">PDF alınacak sayfa</label>
                    <select id="hitit-program-pdf-post" name="post_id">
                        <?php foreach ( $pages as $page ) : ?>
                            <option value="<?php echo esc_attr( $page->ID ); ?>" <?php selected( $selected_page_id, (int) $page->ID ); ?>>
                                <?php echo esc_html( $page->post_title ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <button type="submit" class="button button-primary">Sayfayı Yükle</button>
                </form>
            </section>

            <section class="hitit-program-pdf-admin__card">
                <h2>Çıktı Aksiyonları</h2>
                <?php if ( $selected_page instanceof WP_Post ) : ?>
                    <div class="hitit-program-pdf-admin__actions">
                        <a class="button button-primary button-hero" href="<?php echo esc_url( $preview_url ); ?>" target="_blank" rel="noopener noreferrer">PDF Önizlemeyi Aç</a>
                        <a class="button" href="<?php echo esc_url( $print_url ); ?>" target="_blank" rel="noopener noreferrer">Yazdır / PDF Kaydet</a>
                        <a class="button" href="<?php echo esc_url( get_edit_post_link( $selected_page->ID ) ); ?>">Sayfayı Düzenle</a>
                    </div>
                    <ul class="hitit-program-pdf-admin__list">
                        <li><strong>Kaynak sayfa:</strong> <?php echo esc_html( $selected_page->post_title ); ?></li>
                        <li><strong>Slug:</strong> <?php echo esc_html( $selected_page->post_name ); ?></li>
                        <li><strong>Son güncelleme:</strong> <?php echo esc_html( mysql2date( 'd.m.Y H:i', $selected_page->post_modified ) ); ?></li>
                    </ul>
                <?php else : ?>
                    <p>Henüz PDF üretilebilecek bir program sayfası bulunamadı.</p>
                <?php endif; ?>
            </section>
        </div>
    </div>
    <?php
}

function hitit_kongre_program_pdf_preview_handler() {
    if ( ! current_user_can( 'edit_pages' ) ) {
        wp_die( esc_html__( 'Bu işlem için yetkiniz yok.', 'hitit-kongre' ) );
    }

    $post_id = isset( $_GET['post_id'] ) ? (int) $_GET['post_id'] : 0;

    if ( ! $post_id || ! wp_verify_nonce( $_GET['_wpnonce'] ?? '', 'hitit_kongre_program_pdf_preview_' . $post_id ) ) {
        wp_die( esc_html__( 'Geçersiz istek.', 'hitit-kongre' ) );
    }

    $post = get_post( $post_id );

    if ( ! $post instanceof WP_Post || 'page' !== $post->post_type ) {
        wp_die( esc_html__( 'Program sayfası bulunamadı.', 'hitit-kongre' ) );
    }

    $rendered_content = hitit_kongre_get_program_pdf_rendered_content( $post_id );
    $logo_url         = hitit_kongre_get_program_pdf_logo_url();
    $autoprint        = ! empty( $_GET['autoprint'] );
    $preview_css_url  = get_template_directory_uri() . '/assets/css/program-pdf-preview.css?ver=' . rawurlencode( wp_get_theme()->get( 'Version' ) );
    $admin_back_url   = admin_url( 'edit.php?post_type=page&page=hitit-program-pdf&post_id=' . $post_id );
    ?>
    <!doctype html>
    <html lang="tr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><?php echo esc_html( get_the_title( $post ) ); ?> PDF</title>
        <link rel="stylesheet" href="<?php echo esc_url( $preview_css_url ); ?>" />
    </head>
    <body class="hitit-program-pdf-preview">
        <div class="hitit-program-pdf-preview__toolbar">
            <div class="hitit-program-pdf-preview__toolbar-inner">
                <a href="<?php echo esc_url( $admin_back_url ); ?>">Yonetim ekranina don</a>
                <button type="button" onclick="window.print()">Yazdir / PDF Kaydet</button>
            </div>
        </div>

        <main class="sheet">
            <header class="header">
                <div class="brand">
                    <?php if ( $logo_url ) : ?>
                        <img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" />
                    <?php endif; ?>
                    <div>
                        <div class="eyebrow"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></div>
                        <h1><?php echo esc_html( get_the_title( $post ) ); ?></h1>
                        <p class="subtitle">Kongre programi icin A4 portre PDF onizlemesi</p>
                    </div>
                </div>
                <div class="meta">
                    <div><strong>Kaynak:</strong> <?php echo esc_html( $post->post_name ); ?></div>
                    <div><strong>Olusturulma:</strong> <?php echo esc_html( wp_date( 'd.m.Y H:i' ) ); ?></div>
                    <div><strong>Sayfa duzeni:</strong> A4 Portrait PDF</div>
                </div>
            </header>

            <section class="content">
                <?php echo $rendered_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            </section>

            <footer class="footer">
                <span><?php echo esc_html( get_bloginfo( 'name' ) ); ?> tarafindan olusturuldu.</span>
                <span><?php echo esc_html( get_the_title( $post ) ); ?></span>
            </footer>
        </main>

        <?php if ( $autoprint ) : ?>
            <script>
                window.addEventListener('load', function () {
                    window.print();
                });
            </script>
        <?php endif; ?>
    </body>
    </html>
    <?php
    exit;
}
add_action( 'admin_post_hitit_kongre_program_pdf_preview', 'hitit_kongre_program_pdf_preview_handler' );
