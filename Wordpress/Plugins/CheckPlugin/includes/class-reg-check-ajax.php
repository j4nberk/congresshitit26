<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class HRCheck_Ajax {

    public function register() {
        add_action( 'wp_ajax_hrcheck_query', array( $this, 'handle_query' ) );
        add_action( 'wp_ajax_nopriv_hrcheck_query', array( $this, 'handle_query' ) );
    }

    public function handle_query() {
        // Nonce
        if ( ! check_ajax_referer( 'hrcheck_query', 'nonce', false ) ) {
            wp_send_json_error( array( 'message' => 'Güvenlik doğrulaması başarısız.' ) );
        }

        // ── RATE LIMITING (Sıfırıncı Gün Veri Kazıma/Scraping Koruması) ──
        $client_ip = $this->get_client_ip();
        $rate_key  = 'hrcheck_rl_' . md5( $client_ip );
        $rate_data = get_transient( $rate_key );

        if ( $rate_data === false ) {
            $rate_data = array( 'count' => 1, 'first' => time() );
        } else {
            $rate_data['count']++;
        }

        // 60 saniyede maks 5 istek
        if ( $rate_data['count'] > 5 ) {
            wp_send_json_error( array( 'message' => 'Çok fazla sorgulama yaptınız. Lütfen 1 dakika bekleyip tekrar deneyin.' ) );
        }
        set_transient( $rate_key, $rate_data, 60 );

        $settings = get_option( 'hrcheck_settings', array() );

        // ── reCAPTCHA DOĞRULAMA ──
        $secret_key = $settings['recaptcha_secret_key'] ?? '';
        if ( $secret_key ) {
            $recaptcha_response = sanitize_text_field( $_POST['recaptcha'] ?? '' );
            if ( empty( $recaptcha_response ) ) {
                wp_send_json_error( array( 'message' => 'Lütfen "Ben robot değilim" doğrulamasını tamamlayın.' ) );
            }

            $verify = wp_remote_post( 'https://www.google.com/recaptcha/api/siteverify', array(
                'body' => array(
                    'secret'   => $secret_key,
                    'response' => $recaptcha_response,
                    'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
                ),
            ));

            if ( is_wp_error( $verify ) ) {
                wp_send_json_error( array( 'message' => 'reCAPTCHA doğrulaması sırasında hata oluştu.' ) );
            }

            $verify_body = json_decode( wp_remote_retrieve_body( $verify ), true );
            if ( empty( $verify_body['success'] ) ) {
                wp_send_json_error( array( 'message' => 'reCAPTCHA doğrulaması başarısız. Lütfen tekrar deneyin.' ) );
            }
        }

        // ── TELEFON DOĞRULAMA ──
        $phone_raw = preg_replace( '/\D/', '', sanitize_text_field( $_POST['phone'] ?? '' ) );

        if ( ! $phone_raw || ! preg_match( '/^05[0-9]{9}$/', $phone_raw ) ) {
            wp_send_json_error( array( 'message' => 'Geçerli bir telefon numarası girin (05XX XXX XX XX).' ) );
        }

        // ── AYARLARI KONTROL ET ──
        $apps_url    = $settings['apps_script_url'] ?? '';
        $search_col  = $settings['search_column'] ?? 'A';
        $result_col1 = $settings['result_col_1'] ?? 'B';
        $result_col2 = $settings['result_col_2'] ?? 'C';

        if ( empty( $apps_url ) ) {
            wp_send_json_error( array( 'message' => 'Sistem yapılandırması eksik. Lütfen yönetici ile iletişime geçin.' ) );
        }

        // ── VERİ KAYNAĞI ŞEÇİMİ ──
        $data_source = $settings['data_source'] ?? 'sheets';

        if ( $data_source === 'local_db' ) {
            $this->query_local_db( $phone_raw, $settings );
            return;
        }

        // ── GOOGLE SHEETS SORGUSU ──
        $query_url = add_query_arg( array(
            'phone'      => $phone_raw,
            'searchCol'  => $search_col,
            'resultCol1' => $result_col1,
            'resultCol2' => $result_col2,
        ), $apps_url );

        $response = wp_remote_get( $query_url, array(
            'timeout'   => 15,
        ) );

        if ( is_wp_error( $response ) ) {
            error_log( 'HRCheck Sheets hatası: ' . $response->get_error_message() );
            wp_send_json_error( array( 'message' => 'Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.' ) );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = wp_remote_retrieve_body( $response );

        // Apps Script redirect takibi (302 → HTML sayfası dönebilir)
        $data = json_decode( $body, true );

        if ( ! is_array( $data ) ) {
            error_log( 'HRCheck: Sheets yanıtı JSON değil. HTTP ' . $code . ' Body: ' . substr( $body, 0, 300 ) );
            wp_send_json_error( array( 'message' => 'Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.' ) );
        }

        if ( ! empty( $data['error'] ) ) {
            wp_send_json_error( array( 'message' => $data['error'] ) );
        }

        if ( empty( $data['found'] ) ) {
            $not_found = $settings['not_found_msg'] ?? 'Bu telefon numarasına ait kayıt bulunamadı.';
            wp_send_json_error( array( 'message' => $not_found, 'type' => 'not_found' ) );
        }

        // ── BAŞARILI SONUÇ ──
        wp_send_json_success( array(
            'result1' => sanitize_text_field( $data['result1'] ?? '' ),
            'result2' => sanitize_text_field( $data['result2'] ?? '' ),
        ));
    }

    private function query_local_db( $phone, $settings ) {
        global $wpdb;

        if ( ! class_exists( 'Kongre_DB' ) ) {
            wp_send_json_error( array( 'message' => 'Kongre Kayıt eklentisi aktif değil.' ) );
        }

        $t_kayit  = Kongre_DB::table_kayitlar();
        $t_atolye = Kongre_DB::table_atolyeler();

        // Telefon numarası "son 10 hane" eşleşmesi yapalım (başındaki 0 veya 90 fark etmesin)
        // Veritabanındaki telefon formatı değişebilir, o yüzden LIKE kullanıyoruz.
        // Güvenlik için sadece rakamları alalım.
        $phone_clean = preg_replace( '/[^0-9]/', '', $phone );
        if ( strlen( $phone_clean ) > 10 ) {
            $phone_clean = substr( $phone_clean, -10 ); // Son 10 hane
        }

        // En son kaydı getir (JOIN ile atölye isimlerini al)
        // Telefon formatı DB'de farklı olabilir (boşluklu, parantezli vs.)
        // Bu yüzden olası formatları arayacağız.
        
        $p = $phone_clean; // 10 hane: 5551234567
        $formats = array();
        
        // 1. Düz: %5551234567%
        $formats[] = '%' . $p . '%';
        
        // 2. Boşluklu: %555 123 45 67%
        $f2 = substr($p, 0, 3) . ' ' . substr($p, 3, 3) . ' ' . substr($p, 6, 2) . ' ' . substr($p, 8, 2);
        $formats[] = '%' . $f2 . '%';
        
        // 3. Parantezli: %(555) 123 45 67%
        $f3 = '(' . substr($p, 0, 3) . ') ' . substr($p, 3, 3) . ' ' . substr($p, 6, 2) . ' ' . substr($p, 8, 2);
        $formats[] = '%' . $f3 . '%';
        
        // 4. Parantezli bitişik: %(555) 123 4567%
        $f4 = '(' . substr($p, 0, 3) . ') ' . substr($p, 3, 3) . ' ' . substr($p, 6, 4);
        $formats[] = '%' . $f4 . '%';

        // 5. Tireli: %555-123-45-67%
        $f5 = substr($p, 0, 3) . '-' . substr($p, 3, 3) . '-' . substr($p, 6, 2) . '-' . substr($p, 8, 2);
        $formats[] = '%' . $f5 . '%';

        // LIKE şartlarını oluştur
        $likes = array();
        $args  = array();
        foreach ( $formats as $f ) {
            $likes[] = 'k.telefon LIKE %s';
            $args[]  = $f;
        }
        $where_audit = implode( ' OR ', $likes );

        $sql = "
            SELECT k.ad_soyad, k.email, k.telefon, k.paket,
                   b.atolye_adi as bil_adi, b.oturum as bil_oturum,
                   s.atolye_adi as sos_adi, s.oturum as sos_oturum
            FROM $t_kayit k
            LEFT JOIN $t_atolye b ON k.bilimsel_atolye_id = b.id
            LEFT JOIN $t_atolye s ON k.sosyal_atolye_id = s.id
            WHERE ($where_audit)
            ORDER BY k.id DESC
            LIMIT 1
        ";

        if ( ! empty( $args ) ) {
            $sql = $wpdb->prepare( $sql, $args );
        }
        $row = $wpdb->get_row( $sql );

        if ( ! $row ) {
            $not_found = $settings['not_found_msg'] ?? 'Bu telefon numarasına ait kayıt bulunamadı.';
            wp_send_json_error( array( 'message' => $not_found, 'type' => 'not_found' ) );
        }

        // ── VERİ HAZIRLAMA ──
        // Atölye detayları
        $atolye_details = array();
        if ( ! empty( $row->bil_adi ) ) {
            $atolye_details[] = '<strong>Bilimsel:</strong> ' . $row->bil_adi . ' (' . $row->bil_oturum . ')';
        }
        if ( ! empty( $row->sos_adi ) ) {
            $atolye_details[] = '<strong>Sosyal:</strong> ' . $row->sos_adi . ' (' . $row->sos_oturum . ')';
        }
        $atolye_str = empty( $atolye_details ) ? 'Atölye kaydı yok' : implode( '<br>', $atolye_details );

        // Veri haritası
        $map = array(
            'ad_soyad' => $row->ad_soyad,
            'email'    => $row->email,
            'telefon'  => $row->telefon,
            'paket'    => $row->paket,
            'donem'    => $row->donem ?? '', // Eğer sütun eklenmediyse hata vermesin
            'durum'    => 'Kayıtlı',
            'atolye'   => $atolye_str
        );

        // Ayarlardan satır tercihlerini al
        $r1_key = $settings['db_row_1'] ?? 'ad_soyad';
        $r2_key = $settings['db_row_2'] ?? 'paket';
        $r3_key = $settings['db_row_3'] ?? 'atolye';

        $res1 = $map[ $r1_key ] ?? '';
        $res2 = $map[ $r2_key ] ?? '';
        $res3 = $map[ $r3_key ] ?? '';
        
        // Label 3 için basit bir mapping (Frontend'de göstermek istersek)
        $labels = array(
            'ad_soyad' => 'Ad Soyad', 'paket' => 'Paket', 'atolye' => 'Atölyeler',
            'email' => 'E-posta', 'telefon' => 'Telefon', 'donem' => 'Dönem', 'durum' => 'Durum'
        );
        $label3 = $labels[ $r3_key ] ?? '';

        wp_send_json_success( array(
            'result1' => $res1,
            'result2' => $res2,
            'result3' => $res3,
            'label3'  => $label3
        ));
    }

    /**
     * İstemci IP adresini al (Spoofing korumalı)
     *
     * @return string
     */
    private function get_client_ip(): string {
        $keys = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR' );
        
        foreach ( $keys as $key ) {
            if ( ! empty( $_SERVER[ $key ] ) ) {
                $ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) ) );
                $ip = trim( $ips[0] );
                
                if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0';
    }
}