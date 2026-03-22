<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Kongre Public — Frontend AJAX endpoint'leri
 * Formda doluluk durumunu göstermek için kullanılır.
 */
class Kongre_Public {

    public function register() {
        // Giriş yapmış + yapmamış kullanıcılar için
        add_action( 'wp_ajax_kongre_doluluk',        array( $this, 'ajax_doluluk' ) );
        add_action( 'wp_ajax_nopriv_kongre_doluluk', array( $this, 'ajax_doluluk' ) );

        // Frontend asset'leri — form bulunan sayfalarda yükle
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
    }

    /**
     * AJAX: Atölye doluluk verisini JSON döner
     * Kişisel veri yok, sadece atölye no + isim + kalan yer — public erişim güvenli.
     */
    public function ajax_doluluk() {
        // Nonce kontrolü (Security Fix)
        check_ajax_referer( 'kongre_doluluk', 'nonce' );

        // Cache'i tamamen kapat
        nocache_headers();

        $ozet = Kongre_Allocator::get_doluluk_ozeti();

        // Frontend'e sadece gerekli veriyi gönder (DB id vs. gösterme)
        $response = array( 'bilimsel' => array(), 'sosyal' => array() );

        foreach ( array( 'bilimsel', 'sosyal' ) as $tur ) {
            if ( empty( $ozet[ $tur ] ) ) continue;

            // Atölye numaralarına göre grupla (oturumları birleştir)
            $grouped = array();
            foreach ( $ozet[ $tur ] as $a ) {
                $no = $a['atolye_no'];
                if ( ! isset( $grouped[ $no ] ) ) {
                    $grouped[ $no ] = array(
                        'no'    => $no,
                        'ad'    => $a['atolye_adi'],
                        'oturumlar' => array(),
                    );
                }
                // Özel etiket varsa onu kullan, yoksa varsayılan çeviri
                if ( ! empty( $a['oturum_label'] ) ) {
                    $display_label = $a['oturum_label'];
                } else {
                    $display_label = $a['oturum'];
                    if ( $display_label === 'sabah' )           $display_label = 'Sabah';
                    elseif ( $display_label === 'aksam' )       $display_label = 'Akşam';
                    elseif ( $display_label === 'sabah+aksam' ) $display_label = 'Tam Gün';
                }

                $grouped[ $no ]['oturumlar'][] = array(
                    'oturum'    => $display_label,
                    'kontenjan' => $a['kontenjan'],
                    'kalan'     => $a['kalan'],
                    'dolu_mu'   => $a['dolu_mu'],
                );
            }

            // Numaraya göre sırala
            ksort( $grouped );
            $response[ $tur ] = array_values( $grouped );
        }

        wp_send_json_success( $response );
    }

    /**
     * Frontend asset'leri — hitit_form shortcode'u bulunan sayfalarda yükle
     */
    public function enqueue_assets() {
        global $post;
        if ( ! is_a( $post, 'WP_Post' ) || ! has_shortcode( $post->post_content, 'hitit_form' ) ) {
            return;
        }

        // Hedef form kontrolü — ayarlarda belirli bir form ID varsa sadece o sayfada yükle
        $map = get_option( 'kongre_field_map', array() );
        $target_form_id = intval( $map['target_form_id'] ?? 0 );

        if ( $target_form_id ) {
            // Sayfada hedef form var mı kontrol et
            if ( strpos( $post->post_content, 'id="' . $target_form_id . '"' ) === false ) {
                return;
            }
        }

        wp_enqueue_style(
            'kongre-doluluk',
            KONGRE_KAYIT_URL . 'public/css/doluluk.css',
            array(),
            KONGRE_KAYIT_VERSION
        );

        wp_enqueue_script(
            'kongre-doluluk',
            KONGRE_KAYIT_URL . 'public/js/doluluk.js',
            array( 'jquery' ),
            KONGRE_KAYIT_VERSION,
            true
        );

        wp_localize_script( 'kongre-doluluk', 'kongreDoluluk', array(
            'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
            'nonce'         => wp_create_nonce( 'kongre_doluluk' ),
            'labelBilimsel' => $map['label_bilimsel'] ?? 'Bilimsel Atölye Tercihleri',
            'labelSosyal'   => $map['label_sosyal'] ?? 'Sosyal Atölye Tercihleri',
        ) );
    }
}
