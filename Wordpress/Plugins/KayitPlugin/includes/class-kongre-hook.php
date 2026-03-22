<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Kongre Hook — Hitit Form Builder'a bağlanır
 * 
 * Form gönderildiğinde:
 * 1. Entry verisinden tercih alanlarını çıkarır (label eşleştirmesi ile)
 * 2. Yerleştirme algoritmasını çalıştırır
 * 3. Sonucu kongre_kayitlar tablosuna yazar
 * 4. Sheets'e ek sütunları ekler (Bilimsel Atölye, Sosyal Atölye)
 * 5. Kullanıcıya dönecek mesajı yerleştirme sonucuyla günceller
 * 6. Mail kuyruğuna ekler
 */
class Kongre_Hook {

    /**
     * Admin ayarlarından okunan alan eşleştirmeleri.
     * Varsayılan: form alanlarının label'ları (Türkçe)
     */
    private $field_map;

    /** Son yerleştirme sonucu — filter'larda kullanmak için geçici saklama */
    private $last_result = null;
    private $last_kayit  = null;
    private $submission_error = null;

    public function register() {
        // Hitit Form Builder hook'larına bağlan
        add_action( 'hitit_form_entry_saved', array( $this, 'on_entry_saved' ), 10, 4 );
        add_action( 'hitit_form_entry_deleted', array( $this, 'on_entry_deleted' ), 10, 3 );
        add_filter( 'hitit_form_sheets_extra_data', array( $this, 'add_sheets_columns' ), 10, 4 );
        add_filter( 'hitit_form_success_response', array( $this, 'modify_response' ), 10, 4 );
    }

    /**
     * Ayarlardan alan eşleştirmelerini oku
     */
    private function get_field_map() {
        if ( $this->field_map !== null ) return $this->field_map;

        $defaults = array(
            'target_form_id'       => 0,     // 0 = tüm formlarda çalış
            'label_ad_soyad'       => 'Ad Soyad',
            'label_email'          => 'E-posta',
            'label_telefon'        => 'Telefon',
            'label_donem'          => 'Dönem',
            'label_bilimsel'       => 'Bilimsel Atölye Tercihleri',
            'label_sosyal'         => 'Sosyal Atölye Tercihleri',
        );
        $this->field_map = wp_parse_args( get_option( 'kongre_field_map', array() ), $defaults );
        return $this->field_map;
    }

    /**
     * Entry verisinden bir değeri label eşleştirmesiyle bul
     * Tam eşleşme + kısmi eşleşme (contains) dener
     */
    private function find_value( $entry_data, $search_label ) {
        $search = mb_strtolower( trim( $search_label ) );
        if ( empty( $search ) ) return ''; // Etiket boşsa eşleşme yapma

        // Tam eşleşme
        foreach ( $entry_data as $label => $value ) {
            if ( mb_strtolower( trim( $label ) ) === $search ) return $value;
        }
        // Kısmi eşleşme
        foreach ( $entry_data as $label => $value ) {
            if ( mb_strpos( mb_strtolower( $label ), $search ) !== false ) return $value;
        }
        return '';
    }

    /**
     * Tercih string'ini parse et: "3,1,7,2" → [3,1,7,2]
     */
    private function parse_tercihler( $str ) {
        if ( empty( $str ) ) return array();
        $str = trim( $str );
        $parcalar = preg_split( '/[\s,;\-|]+/', $str );
        $sonuc = array();
        foreach ( $parcalar as $p ) {
            $p = trim( $p );
            if ( is_numeric( $p ) && (int) $p > 0 ) {
                $sonuc[] = (int) $p;
            }
        }
        return $sonuc;
    }

    /**
     * HOOK: Entry kaydedildikten sonra — yerleştirme yap
     */
    public function on_entry_saved( $form_id, $entry_id, $entry_data, $form ) {
        $this->submission_error = null;
        $map = $this->get_field_map();

        // Hedef form kontrolü (0 = tüm formlarda, belirli ID = sadece o form)
        if ( ! empty( $map['target_form_id'] ) && (int) $map['target_form_id'] !== (int) $form_id ) {
            return;
        }

        // Tercih verilerini bul
        $bilimsel_raw = $this->find_value( $entry_data, $map['label_bilimsel'] );
        $sosyal_raw   = $this->find_value( $entry_data, $map['label_sosyal'] );

        // Tercih alanları yoksa bu form atölye kayıt formu değil, atla
        if ( empty( $bilimsel_raw ) && empty( $sosyal_raw ) ) {
            return;
        }

        $bilimsel_tercihler = $this->parse_tercihler( $bilimsel_raw );
        $sosyal_tercihler   = $this->parse_tercihler( $sosyal_raw );

        // Kişisel bilgileri çıkar
        $ad_soyad       = $this->find_value( $entry_data, $map['label_ad_soyad'] );
        $email          = $this->find_value( $entry_data, $map['label_email'] );
        $telefon        = $this->find_value( $entry_data, $map['label_telefon'] );
        $donem          = $this->find_value( $entry_data, $map['label_donem'] );
        $katilimci_turu = $this->find_value( $entry_data, $map['label_katilimci_turu'] );
        $paket          = $this->find_value( $entry_data, $map['label_paket'] );

        // Yerleştirme algoritmasını çalıştır
        $result = Kongre_Allocator::yerlestir( $bilimsel_tercihler, $sosyal_tercihler );

        if ( is_wp_error( $result ) ) {
            error_log( 'Kongre yerleştirme hatası (entry #' . $entry_id . '): ' . $result->get_error_message() );
            return;
        }

        $bil = $result['bilimsel'];
        $sos = $result['sosyal'];

        // Kayıt tablosuna yaz
        $kayit_data = array(
            'form_entry_id'       => $entry_id,
            'ad_soyad'            => sanitize_text_field( $ad_soyad ),
            'email'               => sanitize_email( $email ),
            'telefon'             => sanitize_text_field( $telefon ),
            'donem'               => sanitize_text_field( $donem ),
            'katilimci_turu'      => sanitize_text_field( $katilimci_turu ),
            'paket'               => sanitize_text_field( $paket ),
            'bilimsel_tercihler'  => implode( ',', $bilimsel_tercihler ),
            'sosyal_tercihler'    => implode( ',', $sosyal_tercihler ),
            'bilimsel_atolye_id'  => $bil ? $bil['atolye_id'] : null,
            'bilimsel_atolye_no'  => $bil ? $bil['atolye_no'] : null,
            'bilimsel_oturum'     => $bil ? $bil['oturum'] : null,
            'sosyal_atolye_id'    => $sos ? $sos['atolye_id'] : null,
            'sosyal_atolye_no'    => $sos ? $sos['atolye_no'] : null,
            'sosyal_oturum'       => $sos ? $sos['oturum'] : null,
            'fallback_bilimsel'   => ( $bil && $bil['fallback'] ) ? 1 : 0,
            'fallback_sosyal'     => ( $sos && $sos['fallback'] ) ? 1 : 0,
        );

        $kayit_id = Kongre_DB::insert_kayit( $kayit_data );

        // Opsiyon kotalarını güncelle (üniversite kontenjanları vb.)
        $all_quotas = Kongre_DB::get_option_quotas( $form_id );
        if ( ! empty( $all_quotas ) ) {
            // entry_data'daki etiketleri field name'lere çevirmek için form alanlarını kullan
            $label_to_name = array();
            if ( $form && is_array( $form->fields ) ) {
                foreach ( $form->fields as $f ) {
                    if ( ! empty( $f['label'] ) && ! empty( $f['name'] ) ) {
                        $label_to_name[ $f['label'] ] = $f['name'];
                    }
                }
            }
            foreach ( $all_quotas as $q ) {
                // entry_data'da label ile eşle, name değerini bul
                foreach ( $entry_data as $label => $value ) {
                    $field_name = $label_to_name[ $label ] ?? sanitize_title( $label );
                    if ( $field_name === $q->field_name && $value === $q->option_value ) {
                        $incremented = Kongre_DB::increment_option_quota( $form_id, $q->field_name, $q->option_value );
                        if ( (int) $incremented !== 1 ) {
                            Kongre_DB::delete_kayit( (int) $kayit_id );
                            $this->submission_error = array(
                                'message'     => sprintf(
                                    '"%s" alanındaki "%s" kontenjanı dolmuş. Lütfen formu yenileyip farklı bir seçim yapın.',
                                    $label,
                                    $value
                                ),
                                'field_names' => array( $q->field_name ),
                            );
                            return;
                        }
                        break;
                    }
                }
            }
        }

        // Geçici sakla — aynı request'teki filter'larda kullanılacak
        $this->last_result = $result;
        $this->last_kayit  = $kayit_data;

        // Mail kuyruğuna ekle
        if ( $kayit_id && $email ) {
            $this->queue_result_mail( $kayit_id, $email, $ad_soyad, $result );
        }
    }

    /**
     * HOOK: Form kaydı silindiğinde kongre kaydını da kaldır.
     */
    public function on_entry_deleted( $entry_id, $form_id, $entry_data ) {
        $map = $this->get_field_map();

        if ( ! empty( $map['target_form_id'] ) && (int) $map['target_form_id'] !== (int) $form_id ) {
            return;
        }

        Kongre_DB::delete_kayit_by_form_entry_id( (int) $entry_id );
    }

    /**
     * FILTER: Google Sheets'e ek sütunlar ekle
     */
    public function add_sheets_columns( $extra, $form_id, $entry_id, $entry_data ) {
        if ( ! $this->last_result ) return $extra;

        $bil = $this->last_result['bilimsel'];
        $sos = $this->last_result['sosyal'];

        $oturum_map = array( 'sabah' => 'Sabah', 'aksam' => 'Akşam', 'sabah+aksam' => 'Sabah+Akşam' );

        // Sheets'e yazılacak ek sütunlar
        $extra['Bilimsel Atölye'] = $bil
            ? sprintf( '%s (%s)', $bil['atolye_adi'], $oturum_map[ $bil['oturum'] ] ?? $bil['oturum'] )
            : 'Yerleştirilemedi';

        $extra['Sosyal Atölye'] = '';
        if ( $sos && $sos['atolye_id'] ) {
            $extra['Sosyal Atölye'] = sprintf( '%s (%s)', $sos['atolye_adi'], $oturum_map[ $sos['oturum'] ] ?? $sos['oturum'] );
        } elseif ( $sos && isset( $sos['mesaj'] ) ) {
            $extra['Sosyal Atölye'] = $sos['mesaj'];
        } else {
            $extra['Sosyal Atölye'] = 'Yerleştirilemedi';
        }

        return $extra;
    }

    /**
     * FILTER: Kullanıcıya dönen başarı mesajını yerleştirme sonucuyla güncelle
     */
    public function modify_response( $response, $form_id, $entry_id, $entry_data ) {
        if ( ! empty( $this->submission_error ) ) {
            $response['error'] = $this->submission_error;
            return $response;
        }

        if ( ! $this->last_result ) return $response;

        $bil = $this->last_result['bilimsel'];
        $sos = $this->last_result['sosyal'];

        $oturum_tr = array( 'sabah' => 'Sabah', 'aksam' => 'Akşam', 'sabah+aksam' => 'Tam Gün (Sabah+Akşam)' );

        $msg = "✅ Kaydınız başarıyla alındı ve atölye yerleştirmeniz yapıldı!";

        if ( $bil ) {
            $bil_oturum = $oturum_tr[ $bil['oturum'] ] ?? $bil['oturum'];
            if ( $bil['fallback'] ) {
                $msg .= "<br><br>📋 <strong>Bilimsel Atölye:</strong> {$bil['atolye_adi']} — {$bil_oturum} oturumu";
                $msg .= "<br><em>(Tercihleriniz doluydu, en uygun atölyeye yerleştirildiniz)</em>";
            } else {
                $msg .= "<br><br>📋 <strong>Bilimsel Atölye:</strong> {$bil['atolye_adi']} — {$bil_oturum} oturumu";
                $msg .= " ({$bil['tercih_sirasi']}. tercihiniz)";
            }
        }

        if ( $sos && $sos['atolye_id'] ) {
            $sos_oturum = $oturum_tr[ $sos['oturum'] ] ?? $sos['oturum'];
            if ( $sos['fallback'] ) {
                $msg .= "<br><br>🎨 <strong>Sosyal Atölye:</strong> {$sos['atolye_adi']} — {$sos_oturum} oturumu";
                $msg .= "<br><em>(Tercihleriniz doluydu, en uygun atölyeye yerleştirildiniz)</em>";
            } else {
                $msg .= "<br><br>🎨 <strong>Sosyal Atölye:</strong> {$sos['atolye_adi']} — {$sos_oturum} oturumu";
                $msg .= " ({$sos['tercih_sirasi']}. tercihiniz)";
            }
        } elseif ( $sos && isset( $sos['mesaj'] ) ) {
            $msg .= "<br><br>🎨 <strong>Sosyal Atölye:</strong> " . $sos['mesaj'];
        }

        $msg .= "<br><br>📧 Yerleştirme detaylarınız e-posta adresinize gönderilecektir.";

        $response['message'] = $msg;
        return $response;
    }

    /**
     * Sonuç mailini kuyruğa ekle — admin'deki mail şablonunu kullanır
     */
    private function queue_result_mail( $kayit_id, $email, $ad_soyad, $result ) {
        $bil = $result['bilimsel'];
        $sos = $result['sosyal'];

        $oturum_tr = array( 'sabah' => 'Sabah', 'aksam' => 'Akşam', 'sabah+aksam' => 'Tam Gün (Sabah+Akşam)' );

        // Admin'den kaydedilen şablonu oku, yoksa varsayılanı kullan
        $tpl_defaults = array(
            'subject' => '26. Hitit Tıp Kongresi — Atölye Yerleştirme Sonucunuz',
            'body'    => Kongre_Admin::get_default_mail_template(),
        );
        $tpl = wp_parse_args( get_option( 'kongre_mail_template', array() ), $tpl_defaults );

        // Placeholder değerlerini hazırla
        $placeholders = array(
            '{ad_soyad}'       => esc_html( $ad_soyad ),
            '{email}'          => esc_html( $this->last_kayit['email'] ?? $email ),
            '{telefon}'        => esc_html( $this->last_kayit['telefon'] ?? '' ),
            '{donem}'          => esc_html( $this->last_kayit['donem'] ?? '' ),
            '{katilimci_turu}' => esc_html( $this->last_kayit['katilimci_turu'] ?? '' ),
            '{paket}'          => esc_html( $this->last_kayit['paket'] ?? '' ),
        );

        // Bilimsel atölye placeholder'ları
        if ( $bil ) {
            $placeholders['{bilimsel_atolye}']  = esc_html( $bil['atolye_adi'] );
            $placeholders['{bilimsel_oturum}']  = $oturum_tr[ $bil['oturum'] ] ?? $bil['oturum'];
            if ( $bil['fallback'] ) {
                $placeholders['{bilimsel_tercih_sirasi}'] = '';
                $placeholders['{bilimsel_fallback_notu}'] = '⚠ Tercihleriniz doluydu, en uygun atölyeye yerleştirildiniz.';
            } else {
                $placeholders['{bilimsel_tercih_sirasi}'] = $bil['tercih_sirasi'] . '. tercihinize yerleştirildiniz.';
                $placeholders['{bilimsel_fallback_notu}'] = '';
            }
        } else {
            $placeholders['{bilimsel_atolye}']          = 'Yerleştirilemedi';
            $placeholders['{bilimsel_oturum}']          = '—';
            $placeholders['{bilimsel_tercih_sirasi}']   = '';
            $placeholders['{bilimsel_fallback_notu}']   = '';
        }

        // Sosyal atölye placeholder'ları
        if ( $sos && $sos['atolye_id'] ) {
            $placeholders['{sosyal_atolye}']  = esc_html( $sos['atolye_adi'] );
            $placeholders['{sosyal_oturum}']  = $oturum_tr[ $sos['oturum'] ] ?? $sos['oturum'];
            $placeholders['{sosyal_mesaj}']   = '';
            if ( $sos['fallback'] ) {
                $placeholders['{sosyal_tercih_sirasi}'] = '';
                $placeholders['{sosyal_fallback_notu}'] = '⚠ Tercihleriniz doluydu, en uygun atölyeye yerleştirildiniz.';
            } else {
                $placeholders['{sosyal_tercih_sirasi}'] = $sos['tercih_sirasi'] . '. tercihinize yerleştirildiniz.';
                $placeholders['{sosyal_fallback_notu}'] = '';
            }
        } elseif ( $sos && isset( $sos['mesaj'] ) ) {
            $placeholders['{sosyal_atolye}']          = '';
            $placeholders['{sosyal_oturum}']          = '';
            $placeholders['{sosyal_tercih_sirasi}']   = '';
            $placeholders['{sosyal_fallback_notu}']   = '';
            $placeholders['{sosyal_mesaj}']           = esc_html( $sos['mesaj'] );
        } else {
            $placeholders['{sosyal_atolye}']          = 'Yerleştirilemedi';
            $placeholders['{sosyal_oturum}']          = '—';
            $placeholders['{sosyal_tercih_sirasi}']   = '';
            $placeholders['{sosyal_fallback_notu}']   = '';
            $placeholders['{sosyal_mesaj}']           = '';
        }

        // Şablondaki placeholder'ları değiştir
        $subject = str_replace( array_keys( $placeholders ), array_values( $placeholders ), $tpl['subject'] );
        $body    = str_replace( array_keys( $placeholders ), array_values( $placeholders ), $tpl['body'] );

        Kongre_DB::queue_mail( $kayit_id, $email, $subject, $body );
    }
}
