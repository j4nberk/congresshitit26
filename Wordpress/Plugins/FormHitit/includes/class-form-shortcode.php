<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Hitit_Form_Shortcode {

    private $current_form_id = 0;

    public function register() {
        add_shortcode( 'hitit_form', array( $this, 'render' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
    }

    public function enqueue_assets() {
        global $post;
        if ( ! is_a( $post, 'WP_Post' ) || ! has_shortcode( $post->post_content, 'hitit_form' ) ) {
            return;
        }

        // Google Fonts: formdaki font ayarına göre yükle
        // Tüm formları tara (sayfada birden fazla form olabilir)
        preg_match_all( '/\[hitit_form\s+id="(\d+)"\]/', $post->post_content, $matches );
        if ( ! empty( $matches[1] ) ) {
            $google_fonts = array( 'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Nunito', 'Lato', 'Montserrat' );
            $fonts_to_load = array();
            foreach ( $matches[1] as $fid ) {
                $f = Hitit_Form_DB::get_form( intval( $fid ) );
                if ( $f && ! empty( $f->settings['style_font'] ) ) {
                    foreach ( $google_fonts as $gf ) {
                        if ( strpos( $f->settings['style_font'], $gf ) !== false && ! in_array( $gf, $fonts_to_load ) ) {
                            $fonts_to_load[] = $gf;
                        }
                    }
                }
            }
            if ( ! empty( $fonts_to_load ) ) {
                $families = array_map( function( $f ) { return str_replace( ' ', '+', $f ) . ':wght@400;500;600;700'; }, $fonts_to_load );
                wp_enqueue_style(
                    'hitit-form-google-fonts',
                    'https://fonts.googleapis.com/css2?family=' . implode( '&family=', $families ) . '&display=swap',
                    array(),
                    null
                );
            }
        }

        wp_enqueue_style(
            'hitit-form-public',
            HITIT_FORM_URL . 'public/css/form-public.css',
            array(),
            HITIT_FORM_VERSION
        );

        wp_enqueue_script(
            'hitit-form-public',
            HITIT_FORM_URL . 'public/js/form-public.js',
            array( 'jquery' ),
            HITIT_FORM_VERSION,
            true
        );

        wp_localize_script( 'hitit-form-public', 'hititForm', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'hitit_form_submit' ),
        ));

        // Kongre tercih alanı varsa ek asset'leri yükle
        $has_tercih = false;
        if ( ! empty( $matches[1] ) ) {
            foreach ( $matches[1] as $fid ) {
                $f = Hitit_Form_DB::get_form( intval( $fid ) );
                if ( $f && is_array( $f->fields ) ) {
                    foreach ( $f->fields as $field ) {
                        if ( ( $field['type'] ?? '' ) === 'kongre_tercih' ) {
                            $has_tercih = true;
                            break 2;
                        }
                    }
                }
            }
        }

        if ( $has_tercih ) {
            wp_enqueue_style(
                'kongre-tercih',
                HITIT_FORM_URL . 'public/css/kongre-tercih.css',
                array( 'hitit-form-public' ),
                HITIT_FORM_VERSION
            );
            wp_enqueue_script(
                'kongre-tercih',
                HITIT_FORM_URL . 'public/js/kongre-tercih.js',
                array( 'jquery', 'hitit-form-public' ),
                HITIT_FORM_VERSION,
                true
            );
        }
    }

    public function render( $atts ) {
        // ── Önbellek kontrolü: Form sayfaları önbelleklenmemeli ──
        // (nonce + doluluk verisi her kullanıcıya özel olmalı)
        if ( ! defined( 'DONOTCACHEPAGE' ) ) {
            define( 'DONOTCACHEPAGE', true );
        }
        // LiteSpeed Cache
        if ( ! defined( 'LSCWP_CTRL_NOCACHE' ) ) {
            define( 'LSCWP_CTRL_NOCACHE', true );
        }
        do_action( 'litespeed_control_set_nocache', 'hitit form shortcode' );
        // Header bazlı (LiteSpeed + diğer reverse proxy'ler)
        if ( ! headers_sent() ) {
            header( 'X-LiteSpeed-Cache-Control: no-cache' );
            header( 'Cache-Control: no-cache, no-store, must-revalidate, private' );
        }

        $atts = shortcode_atts( array( 'id' => 0 ), $atts, 'hitit_form' );
        $form_id = intval( $atts['id'] );
        $this->current_form_id = $form_id;

        if ( ! $form_id ) {
            return '<p style="color:#ef4444;">Form ID belirtilmemiş.</p>';
        }

        $form = Hitit_Form_DB::get_form( $form_id );
        if ( ! $form ) {
            return '<p style="color:#ef4444;">Form bulunamadı (ID: ' . $form_id . ').</p>';
        }

        $fields = $form->fields;
        if ( empty( $fields ) || ! is_array( $fields ) ) {
            return '<p style="color:#ef4444;">Bu formda henüz alan tanımlanmamış.</p>';
        }

        $settings = $form->settings ?: array();
        $submit_text = ! empty( $settings['submit_text'] ) ? $settings['submit_text'] : 'Gönder';
        $success_msg = ! empty( $settings['success_message'] ) ? $settings['success_message'] : 'Formunuz başarıyla gönderildi!';

        // ── ZAMANLAMA KONTROLÜ ──
        if ( ! empty( $form->start_time ) ) {
            // WordPress yerel zamanını al (Timezone ayarlarına göre)
            $now = current_time( 'timestamp' );
            $start = strtotime( $form->start_time );

            if ( $now < $start ) {
                $wait_msg = ! empty( $form->wait_message ) ? $form->wait_message : 'Form henüz aktif değil.';
                return '<div class="hitit-form-wait-message">' . wp_kses_post( $wait_msg ) . '</div>';
            }
        }

        // Görünüm ayarlarından CSS custom properties oluştur
        $style_vars = array();
        $style_map = array(
            'style_font'         => '--hf-font',
            'style_max_width'    => '--hf-max-width',
            'style_bg'           => '--hf-bg',
            'style_label_color'  => '--hf-label-color',
            'style_border_color' => '--hf-border-color',
            'style_focus_color'  => '--hf-focus-color',
            'style_input_color'  => '--hf-input-color',
            'style_btn_bg'       => '--hf-btn-bg',
            'style_btn_color'    => '--hf-btn-color',
            'style_btn_hover'    => '--hf-btn-hover',
            'style_radius'       => '--hf-radius',
        );
        foreach ( $style_map as $key => $var ) {
            if ( ! empty( $settings[ $key ] ) ) {
                $val = $settings[ $key ];
                // Sayısal değerlere birim ekle
                if ( $key === 'style_max_width' ) $val .= 'px';
                if ( $key === 'style_radius' )    $val .= 'px';
                // Focus color için shadow alpha değeri de oluştur
                if ( $key === 'style_focus_color' ) {
                    $hex = ltrim( $val, '#' );
                    $r = hexdec( substr( $hex, 0, 2 ) );
                    $g = hexdec( substr( $hex, 2, 2 ) );
                    $b = hexdec( substr( $hex, 4, 2 ) );
                    $style_vars[] = '--hf-focus-shadow: rgba(' . $r . ',' . $g . ',' . $b . ', 0.12)';
                }
                // Buton hover rengi için de accent shadow
                if ( $key === 'style_btn_bg' ) {
                    $hex = ltrim( $val, '#' );
                    $r = hexdec( substr( $hex, 0, 2 ) );
                    $g = hexdec( substr( $hex, 2, 2 ) );
                    $b = hexdec( substr( $hex, 4, 2 ) );
                    $style_vars[] = '--hf-accent-rgb: ' . $r . ',' . $g . ',' . $b;
                }
                $style_vars[] = $var . ': ' . esc_attr( $val );
            }
        }
        $inline_style = ! empty( $style_vars ) ? ' style="' . implode( '; ', $style_vars ) . '"' : '';

        ob_start();
        ?>
        <div class="hitit-form-wrapper hitit-form-loading" data-form-id="<?php echo esc_attr( $form_id ); ?>" data-success="<?php echo esc_attr( $success_msg ); ?>"<?php echo $inline_style; ?>>
            <div class="hitit-form-skeleton">
                <div class="hfs-header"></div>
                <div class="hfs-line hfs-w-60"></div>
                <div class="hfs-gap"></div>
                <div class="hfs-row">
                    <div class="hfs-col"><div class="hfs-label"></div><div class="hfs-input"></div></div>
                    <div class="hfs-col"><div class="hfs-label"></div><div class="hfs-input"></div></div>
                </div>
                <div class="hfs-row">
                    <div class="hfs-col"><div class="hfs-label"></div><div class="hfs-input"></div></div>
                    <div class="hfs-col"><div class="hfs-label"></div><div class="hfs-input"></div></div>
                </div>
                <div class="hfs-line hfs-label"></div>
                <div class="hfs-input"></div>
                <div class="hfs-line hfs-label"></div>
                <div class="hfs-area"></div>
                <div class="hfs-btn"></div>
            </div>
            <form class="hitit-form" novalidate>
                <input type="hidden" name="hitit_form_id" value="<?php echo esc_attr( $form_id ); ?>">
                <!-- Honeypot: botlar için tuzak alan -->
                <div style="position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;width:0;overflow:hidden;" aria-hidden="true" tabindex="-1">
                    <label for="hitit_hp_field">Bu alanı boş bırakın</label>
                    <input type="text" name="hitit_hp_field" id="hitit_hp_field" value="" autocomplete="off" tabindex="-1">
                </div>

                <?php foreach ( $fields as $field ) : ?>
                    <?php echo $this->render_field( $field, $fields ); ?>
                <?php endforeach; ?>

                <div class="hitit-form-row hitit-form-submit-row">
                    <button type="submit" class="hitit-form-submit">
                        <span class="hitit-form-submit-text"><?php echo esc_html( $submit_text ); ?></span>
                        <span class="hitit-form-spinner" style="display:none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/></svg>
                        </span>
                    </button>
                </div>

                <div class="hitit-form-message" style="display:none;"></div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }

    private function render_field( $field, $all_fields ) {
        $type     = $field['type'] ?? 'text';
        $name     = $field['name'] ?? '';
        $label    = $field['label'] ?? '';
        $required = ! empty( $field['required'] );
        $placeholder = $field['placeholder'] ?? '';
        $options  = $field['options'] ?? array();
        $conditions = $field['conditions'] ?? array();
        $width    = $field['width'] ?? '100';

        // Koşullu alan data attribute'ları
        $cond_attr = '';
        $cond_class = '';
        $cond_disabled = '';
        if ( ! empty( $conditions ) ) {
            $cond_attr = ' data-conditions="' . esc_attr( wp_json_encode( $conditions ) ) . '"';
            // Sayfa ilk yüklendiğinde koşullu alanlar gizli başlar — JS koşul sağlanırsa gösterir
            $cond_class = ' hitit-hidden';
            $cond_disabled = ' disabled';
        }

        $req_html = $required ? ' required' : '';
        $req_star = $required ? '<span class="hitit-form-required">*</span>' : '';

        $html = '<div class="hitit-form-row hitit-form-row-' . esc_attr( $width ) . $cond_class . '"' . $cond_attr . '>';

        $show_label = true;
        if ( $type === 'checkbox' && empty( $options ) ) {
            $show_label = false;
        }

        if ( $type !== 'hidden' && $type !== 'html' && $show_label ) {
            $html .= '<label class="hitit-form-label" for="hf_' . esc_attr( $name ) . '">' . esc_html( $label ) . $req_star . '</label>';
        }

        switch ( $type ) {
            case 'text':
            case 'email':
                $html .= '<input type="' . esc_attr( $type ) . '" id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="hitit-form-input"' . $req_html . $cond_disabled . '>';
                break;

            case 'number':
                $num_attrs = '';
                if ( isset( $field['number_min'] ) && $field['number_min'] !== '' ) {
                    $num_attrs .= ' min="' . esc_attr( $field['number_min'] ) . '"';
                }
                if ( isset( $field['number_max'] ) && $field['number_max'] !== '' ) {
                    $num_attrs .= ' max="' . esc_attr( $field['number_max'] ) . '"';
                }
                if ( isset( $field['number_step'] ) && $field['number_step'] !== '' ) {
                    $num_attrs .= ' step="' . esc_attr( $field['number_step'] ) . '"';
                }
                $html .= '<input type="number" id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="hitit-form-input"' . $num_attrs . $req_html . $cond_disabled . '>';
                break;

            case 'date':
                $html .= '<input type="date" id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="hitit-form-input"' . $req_html . $cond_disabled . '>';
                break;

            case 'tel':
                $tel_placeholder = $placeholder ?: '05XX XXX XX XX';
                $html .= '<input type="tel" id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" placeholder="' . esc_attr( $tel_placeholder ) . '" class="hitit-form-input hitit-phone-input" data-type="tel" maxlength="14" pattern="05[0-9]{2}\s[0-9]{3}\s[0-9]{2}\s[0-9]{2}" inputmode="numeric"' . $req_html . $cond_disabled . '>';
                $html .= '<span class="hitit-form-hint">Format: 05XX XXX XX XX</span>';
                break;

            case 'textarea':
                $html .= '<textarea id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="hitit-form-textarea" rows="4"' . $req_html . $cond_disabled . '></textarea>';
                break;

            case 'select':
                // Kota kontrolü
                $quota_map = array();
                if ( $this->current_form_id && class_exists( 'Kongre_DB' ) && method_exists( 'Kongre_DB', 'get_quotas_for_form' ) ) {
                    $quotas = Kongre_DB::get_quotas_for_form( $this->current_form_id, $name );
                    foreach ( $quotas as $q ) {
                        $kalan = max( 0, (int) $q->kontenjan - (int) $q->dolu );
                        $quota_map[ $q->option_value ] = $kalan;
                    }
                }
                $html .= '<select id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" class="hitit-form-select"' . $req_html . $cond_disabled . '>';
                $html .= '<option value="">' . esc_html( $placeholder ?: 'Seçiniz...' ) . '</option>';
                foreach ( $options as $opt ) {
                    $opt_disabled = '';
                    $opt_suffix   = '';
                    if ( isset( $quota_map[ $opt ] ) && $quota_map[ $opt ] <= 0 ) {
                        $opt_disabled = ' disabled';
                        $opt_suffix   = ' (DOLU)';
                    }
                    $html .= '<option value="' . esc_attr( $opt ) . '"' . $opt_disabled . '>' . esc_html( $opt . $opt_suffix ) . '</option>';
                }
                $html .= '</select>';
                break;

            case 'radio':
                // Kota kontrolü
                $quota_map_r = array();
                if ( $this->current_form_id && class_exists( 'Kongre_DB' ) && method_exists( 'Kongre_DB', 'get_quotas_for_form' ) ) {
                    $quotas_r = Kongre_DB::get_quotas_for_form( $this->current_form_id, $name );
                    foreach ( $quotas_r as $q ) {
                        $kalan_r = max( 0, (int) $q->kontenjan - (int) $q->dolu );
                        $quota_map_r[ $q->option_value ] = $kalan_r;
                    }
                }
                $html .= '<div class="hitit-form-radio-group">';
                foreach ( $options as $opt ) {
                    $uid = 'hf_' . $name . '_' . sanitize_title( $opt );
                    $radio_disabled = '';
                    $radio_suffix   = '';
                    if ( isset( $quota_map_r[ $opt ] ) && $quota_map_r[ $opt ] <= 0 ) {
                        $radio_disabled = ' disabled';
                        $radio_suffix   = ' (DOLU)';
                    }
                    $html .= '<label class="hitit-form-radio-label" for="' . esc_attr( $uid ) . '">';
                    $html .= '<input type="radio" id="' . esc_attr( $uid ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $opt ) . '"' . $req_html . $cond_disabled . $radio_disabled . '>';
                    $html .= '<span>' . esc_html( $opt . $radio_suffix ) . '</span></label>';
                }
                $html .= '</div>';
                break;

            case 'checkbox':
                if ( ! empty( $options ) ) {
                    $html .= '<div class="hitit-form-checkbox-group">';
                    $first_cb = true;
                    foreach ( $options as $opt ) {
                        $uid = 'hf_' . $name . '_' . sanitize_title( $opt );
                        // İlk checkbox'a required ekle (grup için en az 1 seçim zorunlu)
                        $cb_req = ( $required && $first_cb ) ? ' required' : '';
                        $html .= '<label class="hitit-form-checkbox-label" for="' . esc_attr( $uid ) . '">';
                        $html .= '<input type="checkbox" id="' . esc_attr( $uid ) . '" name="' . esc_attr( $name ) . '[]" value="' . esc_attr( $opt ) . '"' . $cb_req . $cond_disabled . '>';
                        $html .= '<span>' . wp_kses_post( $opt ) . '</span></label>';
                        $first_cb = false;
                    }
                    $html .= '</div>';
                } else {
                    $html .= '<label class="hitit-form-checkbox-label" for="hf_' . esc_attr( $name ) . '">';
                    $html .= '<input type="checkbox" id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" value="1"' . $req_html . $cond_disabled . '>';
                    $html .= '<span>' . wp_kses_post( $label ) . '</span></label>';
                }
                break;

            case 'heading':
                $html .= '<h3 class="hitit-form-heading">' . esc_html( $label ) . '</h3>';
                break;

            case 'divider':
                $html .= '<hr class="hitit-form-divider">';
                break;

            case 'html':
                $html .= '<div class="hitit-form-html">' . wp_kses_post( $field['content'] ?? '' ) . '</div>';
                break;

            case 'hidden':
                $html .= '<input type="hidden" name="' . esc_attr( $name ) . '" value="' . esc_attr( $field['default'] ?? '' ) . '">';
                break;

            case 'file':
                $accept_attr = '';
                $file_data_attrs = '';
                if ( ! empty( $field['file_types'] ) ) {
                    $accept_attr = ' accept="' . esc_attr( $field['file_types'] ) . '"';
                    $file_data_attrs .= ' data-file-types="' . esc_attr( $field['file_types'] ) . '"';
                }
                if ( ! empty( $field['file_max_size'] ) ) {
                    $file_data_attrs .= ' data-max-size="' . esc_attr( $field['file_max_size'] ) . '"';
                }
                $html .= '<input type="file" id="hf_' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" class="hitit-form-file"' . $accept_attr . $file_data_attrs . $req_html . $cond_disabled . '>';
                break;

            case 'kongre_tercih':
                $html .= $this->render_kongre_tercih( $field );
                break;
        }

        $html .= '</div>';
        return $html;
    }

    /**
     * Kongre tercih alanını render et — drag & drop sıralama + doluluk paneli
     */
    private function render_kongre_tercih( $field ) {
        $tur = $field['kongre_tercih_type'] ?? 'bilimsel';
        $name = $field['name'] ?? 'kongre_tercih';
        $required = ! empty( $field['required'] );

        // kongre-kayit-plugin aktif değilse uyarı göster
        if ( ! class_exists( 'Kongre_Allocator' ) ) {
            return '<p style="color:#ef4444;">⚠ Kongre Kayıt eklentisi aktif değil.</p>';
        }

        $ozet = Kongre_Allocator::get_doluluk_ozeti();
        $atolyeler = $ozet[ $tur ] ?? array();

        if ( empty( $atolyeler ) ) {
            return '<p style="color:#a3a3a3;">Henüz atölye tanımlanmamış.</p>';
        }

        $oturum_map = array( 'sabah' => 'Sabah', 'aksam' => 'Akşam', 'sabah+aksam' => 'Tam Gün' );

        // Atölye numarasına göre grupla (sıralama listesi ve dolu/müsait ayrımı için)
        $grouped = array();
        foreach ( $atolyeler as $a ) {
            $no = $a['atolye_no'];
            // Oturum etiketi: özel etiket varsa onu kullan, yoksa varsayılan map
            $display_label = ! empty( $a['oturum_label'] ) ? $a['oturum_label'] : ( $oturum_map[ $a['oturum'] ] ?? $a['oturum'] );
            if ( ! isset( $grouped[ $no ] ) ) {
                $grouped[ $no ] = array(
                    'no'        => $no,
                    'ad'        => $a['atolye_adi'],
                    'kalan'     => 0,
                    'dolu_mu'   => true,
                    'oturum'    => $a['oturum'],
                    'oturum_display' => $display_label,
                    'oturumlar' => array(),
                );
            }
            $grouped[ $no ]['kalan'] += $a['kalan'];
            if ( ! $a['dolu_mu'] ) {
                $grouped[ $no ]['dolu_mu'] = false;
            }
            if ( $grouped[ $no ]['oturum'] !== $a['oturum'] ) {
                $grouped[ $no ]['oturum'] = 'sabah+aksam';
                $grouped[ $no ]['oturum_display'] = 'Tam Gün';
            }
            $a['_display_label'] = $display_label;
            $grouped[ $no ]['oturumlar'][] = $a;
        }
        ksort( $grouped );

        $musait = array();
        $dolu = array();
        foreach ( $grouped as $a ) {
            if ( $a['dolu_mu'] ) {
                $dolu[] = $a;
            } else {
                $musait[] = $a;
            }
        }

        $out = '<div class="kongre-tercih-wrapper" data-tur="' . esc_attr( $tur ) . '" data-ajax-url="' . esc_url( admin_url( 'admin-ajax.php' ) ) . '">';

        // ── Doluluk Paneli (atölye bazlı kartlar, oturumlar alt satırda) ──
        $out .= '<div class="kongre-tercih-doluluk">';
        $out .= '<div class="kongre-tercih-doluluk-title">📋 Doluluk Durumu</div>';
        $out .= '<div class="kongre-tercih-doluluk-grid">';
        foreach ( $grouped as $g ) {
            // Genel durum: tüm oturumlar dolu mu?
            $cls = $g['dolu_mu'] ? 'dolu' : ( $g['kalan'] <= 3 ? 'az' : 'musait' );

            $out .= '<div class="kongre-tercih-doluluk-item ' . $cls . '">';
            $out .= '<div class="kt-card-header">';
            $out .= '<span class="kt-no">#' . esc_html( $g['no'] ) . '</span>';
            $out .= '<span class="kt-ad">' . esc_html( $g['ad'] ) . '</span>';
            $out .= '</div>';
            $out .= '<div class="kt-sessions">';
            foreach ( $g['oturumlar'] as $a ) {
                $ot_cls  = $a['dolu_mu'] ? 'dolu' : ( $a['kalan'] <= 3 ? 'az' : 'musait' );
                $ot_text = $a['dolu_mu'] ? 'DOLU' : $a['kalan'] . ' yer';
                $oturum  = $a['_display_label'] ?? ( $oturum_map[ $a['oturum'] ] ?? $a['oturum'] );
                $out .= '<span class="kt-session-tag ' . $ot_cls . '">' . esc_html( $oturum ) . ': ' . esc_html( $ot_text ) . '</span>';
            }
            $out .= '</div>';
            $out .= '</div>';
        }
        $out .= '</div></div>';

        // ── Sıralama Listesi (atölye bazlı — müsait olanlar) ──
        $count = count( $musait );
        $out .= '<div class="kongre-tercih-hint">Tercihlerinizi sürükleyerek sıralayın <span class="kt-count-badge">' . $count . ' atölye</span></div>';
        $out .= '<ul class="kongre-tercih-sortable">';
        foreach ( $musait as $i => $a ) {
            $oturum = $a['oturum_display'] ?? ( $oturum_map[ $a['oturum'] ] ?? $a['oturum'] );
            $out .= '<li class="kongre-tercih-item" data-atolye-no="' . esc_attr( $a['no'] ) . '">';
            $out .= '<span class="kt-handle">≡</span>';
            $out .= '<span class="kt-rank">' . ( $i + 1 ) . '</span>';
            $out .= '<div class="kt-info">';
            $out .= '<div class="kt-name">' . esc_html( $a['ad'] ) . '</div>';
            $out .= '<div class="kt-session">' . esc_html( $oturum ) . ' • ' . esc_html( $a['kalan'] ) . ' yer kaldı</div>';
            $out .= '</div>';
            $out .= '</li>';
        }
        $out .= '</ul>';

        // ── Dolu Atölyeler ──
        if ( ! empty( $dolu ) ) {
            $out .= '<div class="kongre-tercih-dolu-title">Dolu Atölyeler</div>';
            $out .= '<ul class="kongre-tercih-dolu-list">';
            foreach ( $dolu as $a ) {
                $oturum = $a['oturum_display'] ?? ( $oturum_map[ $a['oturum'] ] ?? $a['oturum'] );
                $out .= '<li class="kongre-tercih-dolu-item">';
                $out .= '<span class="kt-handle" style="visibility:hidden;">≡</span>';
                $out .= '<div class="kt-info">';
                $out .= '<div class="kt-name">' . esc_html( $a['ad'] ) . ' (' . esc_html( $oturum ) . ')</div>';
                $out .= '</div>';
                $out .= '<span class="kt-dolu-badge">DOLU</span>';
                $out .= '</li>';
            }
            $out .= '</ul>';
        }

        // ── Hidden Input ──
        $initial_vals = array_map( function( $a ) { return $a['no']; }, $musait );
        $out .= '<input type="hidden" class="kongre-tercih-hidden" name="' . esc_attr( $name ) . '" value="' . esc_attr( implode( ',', $initial_vals ) ) . '"' . ( $required ? ' required' : '' ) . '>';

        $out .= '</div>';
        return $out;
    }
}