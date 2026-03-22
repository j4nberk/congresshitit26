<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Hitit_Form_Ajax {

    const UPLOAD_SUBDIR = '/hitit_form_uploads';

    public function register() {
        add_action( 'wp_ajax_hitit_form_submit', array( $this, 'handle_submit' ) );
        add_action( 'wp_ajax_nopriv_hitit_form_submit', array( $this, 'handle_submit' ) );
    }

    public function handle_submit() {
        // Nonce doğrula
        if ( ! check_ajax_referer( 'hitit_form_submit', 'nonce', false ) ) {
            wp_send_json_error( array( 'message' => 'Güvenlik doğrulaması başarısız.' ) );
        }

        // ── HONEYPOT KONTROL ──
        if ( ! empty( $_POST['hitit_hp_field'] ) ) {
            // Bot tuzağına düştü, sessizce başarılı gibi göster
            wp_send_json_success( array( 'message' => 'Formunuz başarıyla gönderildi!' ) );
        }

        // ── RATE LIMITING (IP bazlı, 60 saniyede max 30 gönderim) ──
        $client_ip = $this->get_client_ip();
        $rate_key  = 'hitit_rl_' . md5( $client_ip );
        $rate_data = get_transient( $rate_key );

        if ( $rate_data === false ) {
            $rate_data = array( 'count' => 1, 'first' => time() );
        } else {
            $rate_data['count']++;
        }

        if ( $rate_data['count'] > 30 ) {
            wp_send_json_error( array( 'message' => 'Çok fazla gönderim yaptınız. Lütfen bir dakika bekleyip tekrar deneyin.' ) );
        }

        set_transient( $rate_key, $rate_data, 60 );

        $form_id = intval( $_POST['hitit_form_id'] ?? 0 );
        if ( ! $form_id ) {
            wp_send_json_error( array( 'message' => 'Geçersiz form.' ) );
        }

        $form = Hitit_Form_DB::get_form( $form_id );
        if ( ! $form ) {
            wp_send_json_error( array( 'message' => 'Form bulunamadı.' ) );
        }

        $fields = $form->fields;
        $entry_data = array();
        $unique_fields = array();
        $errors = array();
        $error_fields = array();

        foreach ( $fields as $field ) {
            $name = $field['name'] ?? '';
            $type = $field['type'] ?? 'text';
            $label = $field['label'] ?? $name;
            $required = ! empty( $field['required'] );
            $conditions = $field['conditions'] ?? array();

            // Dekoratif alanları atla
            if ( in_array( $type, array( 'heading', 'divider', 'html' ), true ) ) {
                continue;
            }

            if ( empty( $name ) ) continue;

            // Koşullu alan - koşul sağlanmıyorsa atla
            if ( ! empty( $conditions ) && ! $this->check_conditions( $conditions, $_POST ) ) {
                continue;
            }

            // Değeri al
            $value = '';
            if ( $type === 'file' ) {
                // Dosya yükleme işlemi
                if ( ! empty( $_FILES[ $name ] ) && $_FILES[ $name ]['error'] === UPLOAD_ERR_OK ) {
                    // Dosya türü kontrolü (uzantı)
                    if ( ! empty( $field['file_types'] ) ) {
                        $allowed = array_map( 'trim', explode( ',', strtolower( $field['file_types'] ) ) );
                        $allowed = array_map( function( $ext ) { return ltrim( $ext, '.' ); }, $allowed );
                        $file_ext = strtolower( pathinfo( $_FILES[ $name ]['name'], PATHINFO_EXTENSION ) );
                        if ( ! in_array( $file_ext, $allowed, true ) ) {
                            $errors[] = sprintf( '"%s": İzin verilen dosya türleri: %s', $label, $field['file_types'] );
                            $error_fields[] = $name;
                            continue;
                        }
                    }

                    // Gerçek MIME type doğrulaması (uzantı yanıltmasını önle)
                    if ( ! function_exists( 'wp_check_filetype_and_ext' ) ) {
                        require_once ABSPATH . 'wp-admin/includes/file.php';
                    }
                    $mime_check = wp_check_filetype_and_ext(
                        $_FILES[ $name ]['tmp_name'],
                        $_FILES[ $name ]['name']
                    );
                    if ( isset( $mime_check['type'] ) && $mime_check['type'] === false ) {
                        $errors[] = sprintf( '"%s": Dosya türü doğrulanamadı. Lütfen geçerli bir dosya yükleyin.', $label );
                        $error_fields[] = $name;
                        continue;
                    }
                    if ( empty( $mime_check['ext'] ) && empty( $mime_check['type'] ) ) {
                        $errors[] = sprintf( '"%s": Dosya türü güvenlik kontrolünden geçemedi.', $label );
                        $error_fields[] = $name;
                        continue;
                    }

                    // Dosya boyutu kontrolü
                    if ( ! empty( $field['file_max_size'] ) ) {
                        $max_bytes = floatval( $field['file_max_size'] ) * 1024 * 1024;
                        if ( $_FILES[ $name ]['size'] > $max_bytes ) {
                            $errors[] = sprintf( '"%s": Dosya boyutu en fazla %s MB olabilir.', $label, $field['file_max_size'] );
                            $error_fields[] = $name;
                            continue;
                        }
                    }

                    // WordPress upload fonksiyonlarını yükle
                    if ( ! function_exists( 'wp_handle_upload' ) ) {
                        require_once ABSPATH . 'wp-admin/includes/file.php';
                    }

                    // İzole dizin ve .htaccess koruması için upload dizinini geçici olarak filtrele
                    add_filter( 'upload_dir', array( $this, 'custom_upload_dir' ) );
                    $upload = wp_handle_upload( $_FILES[ $name ], array( 'test_form' => false ) );
                    remove_filter( 'upload_dir', array( $this, 'custom_upload_dir' ) );

                    if ( ! empty( $upload['error'] ) ) {
                        $errors[] = sprintf( '"%s": Dosya yüklenemedi - %s', $label, $upload['error'] );
                        $error_fields[] = $name;
                        continue;
                    }

                    $value = $upload['url'];
                } elseif ( $required ) {
                    $errors[] = sprintf( '"%s" alanı zorunludur.', $label );
                    $error_fields[] = $name;
                    continue;
                }

                $entry_data[ $label ] = $value;
                continue;
            } elseif ( $type === 'checkbox' ) {
                if ( isset( $_POST[ $name ] ) && is_array( $_POST[ $name ] ) ) {
                    $value = implode( ', ', array_map( 'sanitize_text_field', $_POST[ $name ] ) );
                } elseif ( isset( $_POST[ $name ] ) ) {
                    // Tekli checkbox (value="1")
                    $value = sanitize_text_field( $_POST[ $name ] );
                } else {
                    $value = '';
                }
            } elseif ( $type === 'email' ) {
                $value = sanitize_email( $_POST[ $name ] ?? '' );
            } elseif ( $type === 'textarea' ) {
                $value = sanitize_textarea_field( $_POST[ $name ] ?? '' );
            } elseif ( $type === 'number' ) {
                $raw_number = $_POST[ $name ] ?? '';
                if ( $required && ( $raw_number === '' || $raw_number === null ) ) {
                    $errors[] = sprintf( '"%s" alanı zorunludur.', $label );
                    $error_fields[] = $name;
                    continue;
                }
                $value = $raw_number !== '' ? floatval( $raw_number ) : '';

                // Min/Max/Step backend doğrulaması
                if ( $value !== '' ) {
                    if ( isset( $field['number_min'] ) && $field['number_min'] !== '' && $value < floatval( $field['number_min'] ) ) {
                        $errors[] = sprintf( '"%s" alanı en az %s olmalıdır.', $label, $field['number_min'] );
                        $error_fields[] = $name;
                        continue;
                    }
                    if ( isset( $field['number_max'] ) && $field['number_max'] !== '' && $value > floatval( $field['number_max'] ) ) {
                        $errors[] = sprintf( '"%s" alanı en fazla %s olmalıdır.', $label, $field['number_max'] );
                        $error_fields[] = $name;
                        continue;
                    }
                    if ( isset( $field['number_step'] ) && $field['number_step'] !== '' ) {
                        $step = floatval( $field['number_step'] );
                        $min  = isset( $field['number_min'] ) && $field['number_min'] !== '' ? floatval( $field['number_min'] ) : 0;
                        if ( $step > 0 ) {
                            $diff = round( ( $value - $min ) / $step, 10 );
                            if ( abs( $diff - round( $diff ) ) > 1e-9 ) {
                                $errors[] = sprintf( '"%s" alanı %s\'ın katları olmalıdır.', $label, $field['number_step'] );
                                $error_fields[] = $name;
                                continue;
                            }
                        }
                    }
                }
            } elseif ( $type === 'tel' ) {
                // Boşlukları ve rakam olmayan karakterleri temizle
                $raw = preg_replace( '/\D/', '', sanitize_text_field( $_POST[ $name ] ?? '' ) );
                $value = $raw;
            } else {
                $value = sanitize_text_field( $_POST[ $name ] ?? '' );
            }

            // Zorunlu alan kontrolü (number tipi yukarıda zaten kontrol edildi)
            if ( $type !== 'number' && $required && $value === '' ) {
                $errors[] = sprintf( '"%s" alanı zorunludur.', $label );
                $error_fields[] = $name;
            }

            // E-posta formatı kontrolü
            if ( $type === 'email' && $value && ! is_email( $value ) ) {
                $errors[] = sprintf( '"%s" alanına geçerli bir e-posta girin.', $label );
                $error_fields[] = $name;
            }

            // Telefon numarası format kontrolü (05XXXXXXXXX = 11 rakam)
            if ( $type === 'tel' && $value ) {
                if ( ! preg_match( '/^05[0-9]{9}$/', $value ) ) {
                    $errors[] = sprintf( '"%s" alanına geçerli bir telefon numarası girin (05XXXXXXXXX).', $label );
                    $error_fields[] = $name;
                } else {
                    // Veritabanına formatlı kaydet: 05XX XXX XX XX
                    $value = substr( $value, 0, 4 ) . ' ' . substr( $value, 4, 3 ) . ' ' . substr( $value, 7, 2 ) . ' ' . substr( $value, 9, 2 );
                }
            }

            // Benzersiz alanı yeni indeks tablosunda claim edeceğiz.
            if ( ! empty( $field['unique'] ) && $value !== '' ) {
                $unique_fields[] = array(
                    'field_name'  => $name,
                    'field_label' => $label,
                    'field_value' => (string) $value,
                    'field_type'  => $type,
                );
            }

            $entry_data[ $label ] = $value;
        }

        if ( ! empty( $errors ) ) {
            wp_send_json_error( array( 
                'message' => implode( '<br>', $errors ),
                'error_fields' => array_values( array_unique( $error_fields ) )
            ) );
        }

        // Veritabanına kaydet
        $entry_payload = $entry_data;
        if ( ! empty( $unique_fields ) ) {
            $entry_payload['__unique_fields'] = $unique_fields;
        }
        $entry_id = Hitit_Form_DB::save_entry( $form_id, $entry_payload );

        if ( is_wp_error( $entry_id ) ) {
            $error_data = $entry_id->get_error_data();
            $field_name = is_array( $error_data ) ? (string) ( $error_data['field_name'] ?? '' ) : '';
            wp_send_json_error( array(
                'message'      => $entry_id->get_error_message(),
                'error_fields' => $field_name !== '' ? array( $field_name ) : array(),
            ) );
        }

        if ( ! $entry_id ) {
            wp_send_json_error( array( 'message' => 'Kayıt sırasında bir hata oluştu.' ) );
        }

        // ── HOOK: Diğer plugin'lerin entry'yi işlemesine izin ver ──
        // kongre-kayit-plugin bu hook'a bağlanarak yerleştirme yapacak
        do_action( 'hitit_form_entry_saved', $form_id, $entry_id, $entry_data, $form );

        // Google Sheets'e kuyruğa ekle (asenkron — darboğaz yok)
        $sheets_extra_data = apply_filters( 'hitit_form_sheets_extra_data', array(), $form_id, $entry_id, $entry_data );
        $sheets_data = array_merge( $entry_data, $sheets_extra_data );

        if ( ! empty( $form->google_sheet_id ) ) {
            Hitit_Sheets_Queue::enqueue( $form->google_sheet_id, $sheets_data );
        }

        // E-posta bildirimi
        $settings = $form->settings ?: array();
        if ( ! empty( $settings['notification_email'] ) ) {
            $this->send_notification( $settings['notification_email'], $form->title, $entry_data );
        }

        $success_msg = ! empty( $settings['success_message'] ) ? $settings['success_message'] : 'Formunuz başarıyla gönderildi!';

        // ── HOOK: Response'u değiştirmeye izin ver ──
        $response_data = apply_filters( 'hitit_form_success_response', array(
            'message'  => $success_msg,
            'entry_id' => $entry_id,
        ), $form_id, $entry_id, $entry_data );

        if ( ! empty( $response_data['error'] ) && is_array( $response_data['error'] ) ) {
            wp_send_json_error( array(
                'message'      => $response_data['error']['message'] ?? 'Kayıt sırasında bir hata oluştu.',
                'error_fields' => array_values( array_unique( (array) ( $response_data['error']['field_names'] ?? array() ) ) ),
            ) );
        }

        wp_send_json_success( $response_data );
    }

    /**
     * Koşullu alan kontrolü
     * Koşullar: [{ "field": "cinsiyet", "operator": "==", "value": "Kadın" }]
     */
    private function check_conditions( $conditions, $post_data ) {
        foreach ( $conditions as $cond ) {
            $field_name = $cond['field'] ?? '';
            $operator   = $cond['operator'] ?? '==';
            $cond_value = $cond['value'] ?? '';

            // Checkbox array desteği
            $raw = $post_data[ $field_name ] ?? '';
            if ( is_array( $raw ) ) {
                $actual = implode( ', ', array_map( 'sanitize_text_field', $raw ) );
            } else {
                $actual = sanitize_text_field( $raw );
            }

            switch ( $operator ) {
                case '==':
                    if ( $actual !== $cond_value ) return false;
                    break;
                case '!=':
                    if ( $actual === $cond_value ) return false;
                    break;
                case 'contains':
                    if ( strpos( $actual, $cond_value ) === false ) return false;
                    break;
                case 'not_empty':
                    if ( empty( $actual ) ) return false;
                    break;
                case 'empty':
                    if ( ! empty( $actual ) ) return false;
                    break;
            }
        }
        return true;
    }

    /**
     * E-posta bildirimi
     */
    private function send_notification( $to, $form_title, $data ) {
        $subject = sprintf( 'Yeni Form Gönderimi: %s', $form_title );
        $body = "<h2>$form_title - Yeni Kayıt</h2><table style='border-collapse:collapse;width:100%;'>";

        foreach ( $data as $label => $value ) {
            $body .= '<tr>';
            $body .= '<td style="padding:8px 12px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;">' . esc_html( $label ) . '</td>';
            // URL ise tıklanabilir link yap
            if ( $value && filter_var( $value, FILTER_VALIDATE_URL ) ) {
                $filename = basename( parse_url( $value, PHP_URL_PATH ) );
                $body .= '<td style="padding:8px 12px;border:1px solid #ddd;"><a href="' . esc_url( $value ) . '" target="_blank">' . esc_html( $filename ) . '</a></td>';
            } else {
                $body .= '<td style="padding:8px 12px;border:1px solid #ddd;">' . esc_html( $value ) . '</td>';
            }
            $body .= '</tr>';
        }
        $body .= '</table>';

        $headers = array( 'Content-Type: text/html; charset=UTF-8' );
        wp_mail( $to, $subject, $body, $headers );
    }

    /**
     * İzole dosya yükleme klasörünü ayarlar ve güvenlik önlemlerini (.htaccess, index.php) uygular.
     *
     * @param array $pathdata Mevcut upload_dir dizisi
     * @return array Değiştirilmiş upload_dir dizisi
     */
    public function custom_upload_dir( array $pathdata ): array {
        return self::prepare_upload_directory( $pathdata );
    }

    /**
     * IP adresi al (rate limiting için)
     */
    private function get_client_ip() {
        return hitit_form_get_client_ip();
    }

    public static function prepare_upload_directory( ?array $pathdata = null ): array {
        static $prepared_paths = array();

        if ( $pathdata === null ) {
            $pathdata = wp_upload_dir( null, false );
        }

        $custom_dir = self::UPLOAD_SUBDIR;
        $pathdata['path']   = wp_normalize_path( $pathdata['basedir'] . $custom_dir );
        $pathdata['url']    = $pathdata['baseurl'] . $custom_dir;
        $pathdata['subdir'] = $custom_dir;

        $cache_key = $pathdata['path'];
        if ( isset( $prepared_paths[ $cache_key ] ) ) {
            return $pathdata;
        }

        if ( ! is_dir( $pathdata['path'] ) ) {
            wp_mkdir_p( $pathdata['path'] );
        }

        $htaccess_file = $pathdata['path'] . '/.htaccess';
        if ( ! is_file( $htaccess_file ) ) {
            $rules = "<Files \"*.php\">\nDeny from all\n</Files>\n<Files \"*.phtml\">\nDeny from all\n</Files>";
            file_put_contents( $htaccess_file, $rules );
        }

        $index_file = $pathdata['path'] . '/index.php';
        if ( ! is_file( $index_file ) ) {
            file_put_contents( $index_file, "<?php\n// Silence is golden.\n" );
        }

        $prepared_paths[ $cache_key ] = true;
        return $pathdata;
    }
}
