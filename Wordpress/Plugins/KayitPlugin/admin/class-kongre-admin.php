<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Kongre Admin — WP Admin menüsü, ayarlar, yerleştirme listesi, doluluk tablosu
 */
class Kongre_Admin {

    private function get_desktop_key_transient_name() {
        return 'kongre_desktop_generated_key_' . get_current_user_id();
    }

    private function store_generated_desktop_key( $raw_key ) {
        set_transient( $this->get_desktop_key_transient_name(), (string) $raw_key, 10 * MINUTE_IN_SECONDS );
    }

    private function consume_generated_desktop_key() {
        $transient_name = $this->get_desktop_key_transient_name();
        $raw_key = get_transient( $transient_name );

        if ( $raw_key ) {
            delete_transient( $transient_name );
        }

        return is_string( $raw_key ) ? $raw_key : '';
    }

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_menus' ) );
        add_action( 'admin_init', array( $this, 'handle_actions' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
        add_action( 'wp_ajax_kongre_get_form_fields', array( $this, 'ajax_get_form_fields' ) );
    }

    public function add_menus() {
        add_menu_page(
            'Atölye Yerleştirme',
            'Atölye Yerleştirme',
            'manage_options',
            'kongre-kayit',
            array( $this, 'page_dashboard' ),
            'dashicons-groups',
            30
        );
        add_submenu_page( 'kongre-kayit', 'Doluluk Durumu', 'Doluluk Durumu', 'manage_options', 'kongre-kayit', array( $this, 'page_dashboard' ) );
        add_submenu_page( 'kongre-kayit', 'Kayıtlar', 'Kayıtlar', 'manage_options', 'kongre-kayitlar', array( $this, 'page_kayitlar' ) );
        add_submenu_page( 'kongre-kayit', 'Atölye Listeleri', 'Atölye Listeleri', 'manage_options', 'kongre-listeler', array( $this, 'page_atolyeler_listesi' ) );
        add_submenu_page( 'kongre-kayit', 'Atölyeler', 'Atölyeler', 'manage_options', 'kongre-atolyeler', array( $this, 'page_atolyeler' ) );
        add_submenu_page( 'kongre-kayit', 'Kontenjan Yönetimi', 'Kontenjan Yönetimi', 'manage_options', 'kongre-kotalar', array( $this, 'page_kotalar' ) );
        add_submenu_page( 'kongre-kayit', 'Mail Kuyruğu', 'Mail Kuyruğu', 'manage_options', 'kongre-mail', array( $this, 'page_mail' ) );
        add_submenu_page( 'kongre-kayit', 'Ayarlar', 'Ayarlar', 'manage_options', 'kongre-ayarlar', array( $this, 'page_ayarlar' ) );
    }

    public function enqueue_assets( $hook ) {
        if ( strpos( $hook, 'kongre' ) === false ) return;
        wp_enqueue_style( 'kongre-admin', KONGRE_KAYIT_URL . 'admin/css/admin.css', array(), KONGRE_KAYIT_VERSION );
    }

    // ── Aksiyon işleyici (silme, ayar kaydetme vs.) ─────────────────────────
    public function handle_actions() {
        // Mail tekrar dene
        if ( isset( $_GET['kongre_retry_mail'] ) && check_admin_referer( 'kongre_retry_mail' ) ) {
            $id = intval( $_GET['kongre_retry_mail'] );
            Kongre_DB::reset_mail_attempts( $id );
            wp_redirect( admin_url( 'admin.php?page=kongre-mail&retried=1' ) );
            exit;
        }

        // Kayıt silme
        if ( isset( $_GET['kongre_delete_kayit'] ) && check_admin_referer( 'kongre_delete_kayit' ) ) {
            $id = intval( $_GET['kongre_delete_kayit'] );
            Kongre_DB::delete_kayit( $id );
            wp_redirect( admin_url( 'admin.php?page=kongre-kayitlar&deleted=1' ) );
            exit;
        }

        // Toplu Kayıt Silme
        if ( isset( $_POST['kongre_bulk_action'] ) && $_POST['kongre_bulk_action'] === 'delete' && check_admin_referer( 'kongre_bulk_delete' ) ) {
            if ( ! empty( $_POST['bulk_ids'] ) && is_array( $_POST['bulk_ids'] ) ) {
                $count = 0;
                foreach ( $_POST['bulk_ids'] as $id ) {
                    Kongre_DB::delete_kayit( intval( $id ) );
                    $count++;
                }
                wp_redirect( admin_url( 'admin.php?page=kongre-kayitlar&bulk_deleted=' . $count ) );
                exit;
            }
        }

        // Ayarları kaydet
        if ( isset( $_POST['kongre_save_settings'] ) && check_admin_referer( 'kongre_save_settings' ) ) {
            $map = array(
                'target_form_id'   => intval( $_POST['target_form_id'] ?? 0 ),
                'label_ad_soyad'   => sanitize_text_field( $_POST['label_ad_soyad'] ?? '' ),
                'label_email'      => sanitize_text_field( $_POST['label_email'] ?? '' ),
                'label_telefon'    => sanitize_text_field( $_POST['label_telefon'] ?? '' ),
                'label_donem'      => sanitize_text_field( $_POST['label_donem'] ?? '' ),
                'label_katilimci_turu' => sanitize_text_field( $_POST['label_katilimci_turu'] ?? '' ),
                'label_paket'      => sanitize_text_field( $_POST['label_paket'] ?? '' ),
                'label_bilimsel'   => sanitize_text_field( $_POST['label_bilimsel'] ?? '' ),
                'label_sosyal'     => sanitize_text_field( $_POST['label_sosyal'] ?? '' ),
            );
            update_option( 'kongre_field_map', $map );
            wp_redirect( admin_url( 'admin.php?page=kongre-ayarlar&saved=1' ) );
            exit;
        }

        // SMTP ayarlarını kaydet
        if ( isset( $_POST['kongre_save_smtp'] ) && check_admin_referer( 'kongre_save_smtp' ) ) {
            $smtp = array(
                'enabled'   => isset( $_POST['smtp_enabled'] ) ? 1 : 0,
                'host'      => sanitize_text_field( $_POST['smtp_host'] ?? '' ),
                'port'      => intval( $_POST['smtp_port'] ?? 465 ),
                'encryption'=> sanitize_text_field( $_POST['smtp_encryption'] ?? 'ssl' ),
                'username'  => sanitize_text_field( $_POST['smtp_username'] ?? '' ),
                'password'  => sanitize_text_field( $_POST['smtp_password'] ?? '' ),
                'from_name' => sanitize_text_field( $_POST['smtp_from_name'] ?? '' ),
                'from_email'=> sanitize_email( $_POST['smtp_from_email'] ?? '' ),
            );
            update_option( 'kongre_smtp_settings', $smtp );
            wp_redirect( admin_url( 'admin.php?page=kongre-ayarlar&tab=smtp&saved=1' ) );
            exit;
        }

        // Mail şablonu kaydet
        if ( isset( $_POST['kongre_save_mail_template'] ) && check_admin_referer( 'kongre_save_mail_template' ) ) {
            $template = array(
                'subject'  => sanitize_text_field( $_POST['mail_subject'] ?? '' ),
                'body'     => isset( $_POST['mail_body'] ) ? stripslashes( $_POST['mail_body'] ) : '',
            );
            update_option( 'kongre_mail_template', $template );
            wp_redirect( admin_url( 'admin.php?page=kongre-ayarlar&tab=mail-template&saved=1' ) );
            exit;
        }

        if ( isset( $_POST['kongre_generate_desktop_key'] ) && check_admin_referer( 'kongre_generate_desktop_key' ) ) {
            $raw_key = Kongre_Desktop_API::create_key();
            $this->store_generated_desktop_key( $raw_key );
            wp_redirect( admin_url( 'admin.php?page=kongre-ayarlar&tab=desktop&generated=1' ) );
            exit;
        }

        if ( isset( $_POST['kongre_revoke_desktop_key'] ) && check_admin_referer( 'kongre_revoke_desktop_key' ) ) {
            Kongre_Desktop_API::revoke_key();
            wp_redirect( admin_url( 'admin.php?page=kongre-ayarlar&tab=desktop&revoked=1' ) );
            exit;
        }

        // Atölye güncelleme
        if ( isset( $_POST['kongre_save_atolye'] ) && check_admin_referer( 'kongre_save_atolye' ) ) {
            global $wpdb;
            $t = Kongre_DB::table_atolyeler();
            $id = intval( $_POST['atolye_id'] ?? 0 );
            if ( $id ) {
                $wpdb->update( $t, array(
                    'atolye_adi'   => sanitize_text_field( $_POST['atolye_adi'] ?? '' ),
                    'oturum_label' => sanitize_text_field( $_POST['oturum_label'] ?? '' ),
                    'kontenjan'    => max( 1, intval( $_POST['kontenjan'] ?? 16 ) ),
                    'aktif'        => isset( $_POST['aktif'] ) ? 1 : 0,
                ), array( 'id' => $id ) );
            }
            wp_redirect( admin_url( 'admin.php?page=kongre-atolyeler&saved=1' ) );
            exit;
        }

        // Yeni atölye ekleme
        if ( isset( $_POST['kongre_add_atolye'] ) && check_admin_referer( 'kongre_add_atolye' ) ) {
            global $wpdb;
            $t = Kongre_DB::table_atolyeler();
            $tur       = in_array( $_POST['new_tur'] ?? '', array( 'bilimsel', 'sosyal' ), true ) ? $_POST['new_tur'] : 'bilimsel';
            $no        = max( 1, intval( $_POST['new_atolye_no'] ?? 1 ) );
            $oturum    = in_array( $_POST['new_oturum'] ?? '', array( 'sabah', 'aksam', 'sabah+aksam' ), true ) ? $_POST['new_oturum'] : 'sabah';
            $adi       = sanitize_text_field( $_POST['new_atolye_adi'] ?? '' );
            $label     = sanitize_text_field( $_POST['new_oturum_label'] ?? '' );
            $kontenjan = max( 1, intval( $_POST['new_kontenjan'] ?? 16 ) );

            $wpdb->insert( $t, array(
                'tur'          => $tur,
                'atolye_no'    => $no,
                'atolye_adi'   => $adi ?: ( ucfirst( $tur ) . ' Atölye ' . $no ),
                'oturum'       => $oturum,
                'oturum_label' => $label,
                'kontenjan'    => $kontenjan,
                'dolu'         => 0,
                'aktif'        => 1,
            ));
            wp_redirect( admin_url( 'admin.php?page=kongre-atolyeler&added=1' ) );
            exit;
        }

        // Atölye silme
        if ( isset( $_GET['kongre_delete_atolye'] ) && check_admin_referer( 'kongre_delete_atolye' ) ) {
            global $wpdb;
            $t  = Kongre_DB::table_atolyeler();
            $id = intval( $_GET['kongre_delete_atolye'] );
            $a  = Kongre_DB::get_atolye( $id );
            if ( $a && (int) $a->dolu === 0 ) {
                $wpdb->delete( $t, array( 'id' => $id ) );
                wp_redirect( admin_url( 'admin.php?page=kongre-atolyeler&deleted=1' ) );
            } else {
                wp_redirect( admin_url( 'admin.php?page=kongre-atolyeler&delete_error=1' ) );
            }
            exit;
        }

        // CSV İndirme
        if ( isset( $_GET['kongre_download_csv'] ) && check_admin_referer( 'kongre_download_csv' ) ) {
            $id = intval( $_GET['kongre_download_csv'] );
            $this->download_atolye_csv( $id );
            exit;
        }

        // ZIP İndirme
        if ( isset( $_GET['kongre_download_zip'] ) && check_admin_referer( 'kongre_download_zip' ) ) {
            $this->download_all_zip();
            exit;
        }

        // Veri Onarımı (Sync)
        if ( isset( $_GET['kongre_sync_counts'] ) && check_admin_referer( 'kongre_sync_counts' ) ) {
            Kongre_DB::recalculate_counts();
            wp_redirect( admin_url( 'admin.php?page=kongre-kayit&synced=1' ) );
            exit;
        }

        // Kota ekleme
        if ( isset( $_POST['kongre_add_quota'] ) && check_admin_referer( 'kongre_add_quota' ) ) {
            $form_id      = intval( $_POST['quota_form_id'] ?? 0 );
            $field_name   = sanitize_text_field( $_POST['quota_field_name'] ?? '' );
            $option_value = sanitize_text_field( $_POST['quota_option_value'] ?? '' );
            $kontenjan    = max( 1, intval( $_POST['quota_kontenjan'] ?? 10 ) );

            if ( $form_id && $field_name && $option_value ) {
                $result = Kongre_DB::add_option_quota( $form_id, $field_name, $option_value, $kontenjan );
                if ( $result ) {
                    wp_redirect( admin_url( 'admin.php?page=kongre-kotalar&quota_added=1' ) );
                } else {
                    wp_redirect( admin_url( 'admin.php?page=kongre-kotalar&quota_error=1' ) );
                }
            } else {
                wp_redirect( admin_url( 'admin.php?page=kongre-kotalar&quota_error=1' ) );
            }
            exit;
        }

        // Kota silme
        if ( isset( $_GET['kongre_delete_quota'] ) && check_admin_referer( 'kongre_delete_quota' ) ) {
            $id = intval( $_GET['kongre_delete_quota'] );
            Kongre_DB::delete_option_quota( $id );
            wp_redirect( admin_url( 'admin.php?page=kongre-kotalar&quota_deleted=1' ) );
            exit;
        }
    }

    // ── CSV & ZIP İndirme Helperları ───────────────────────────────────────────
    
    private function download_atolye_csv( $atolye_id ) {
        $atolye = Kongre_DB::get_atolye( $atolye_id );
        if ( ! $atolye ) wp_die( 'Atölye bulunamadı.' );

        $kayitlar = Kongre_DB::get_kayitlar_by_atolye_id( $atolye_id );
        $filename = sanitize_file_name( $atolye->tur . '_' . $atolye->atolye_no . '_' . $atolye->oturum . '.csv' );

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename=' . $filename );

        $output = fopen( 'php://output', 'w' );
        fprintf( $output, chr(0xEF).chr(0xBB).chr(0xBF) ); // BOM for Excel

        // Başlıklar
        fputcsv( $output, array( 'Admin ID', 'Ad Soyad', 'Telefon', 'E-posta', 'Dönem', 'Paket', 'Katılımcı Türü' ) );

        foreach ( $kayitlar as $k ) {
            fputcsv( $output, array(
                $k->id,
                $k->ad_soyad,
                $k->telefon,
                $k->email,
                $k->donem,
                $k->paket,
                $k->katilimci_turu
            ));
        }
        fclose( $output );
        exit;
    }

    private function download_all_zip() {
        if ( ! class_exists( 'ZipArchive' ) ) wp_die( 'ZipArchive sınıfı sunucuda aktif değil.' );

        $atolyeler = Kongre_DB::get_all_atolyeler( null, true );
        $zip = new ZipArchive();
        $zip_name = 'tum_atolyeler_' . date( 'Y-m-d_H-i' ) . '.zip';
        $temp_file = tempnam( sys_get_temp_dir(), 'kongre_zip' );

        if ( $zip->open( $temp_file, ZipArchive::CREATE ) !== TRUE ) {
            wp_die( 'ZIP dosyası oluşturulamadı.' );
        }

        foreach ( $atolyeler as $atolye ) {
            $kayitlar = Kongre_DB::get_kayitlar_by_atolye_id( $atolye->id );
            if ( empty( $kayitlar ) ) continue; // Boş atölyeleri ekleme (isteğe bağlı)

            $csv_content = chr(0xEF).chr(0xBB).chr(0xBF); // BOM
            // CSV Header
            $headers = array( 'Admin ID', 'Ad Soyad', 'Telefon', 'E-posta', 'Dönem', 'Paket', 'Katılımcı Türü' );
            $fp = fopen( 'php://temp', 'r+' );
            fputcsv( $fp, $headers );
            foreach ( $kayitlar as $k ) {
                fputcsv( $fp, array(
                    $k->id, $k->ad_soyad, $k->telefon, $k->email, $k->donem, $k->paket, $k->katilimci_turu
                ));
            }
            rewind( $fp );
            $csv_content .= stream_get_contents( $fp );
            fclose( $fp );

            $filename = sanitize_file_name( $atolye->tur . '_' . $atolye->atolye_no . '_' . $atolye->oturum . '.csv' );
            $zip->addFromString( $filename, $csv_content );
        }

        $zip->close();

        header( 'Content-Type: application/zip' );
        header( 'Content-Disposition: attachment; filename="' . $zip_name . '"' );
        header( 'Content-Length: ' . filesize( $temp_file ) );
        readfile( $temp_file );
        unlink( $temp_file );
        exit;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SAYFA: Dashboard / Doluluk Durumu
    // ═══════════════════════════════════════════════════════════════════════════
    public function page_dashboard() {
        $ozet = Kongre_Allocator::get_doluluk_ozeti();
        $toplam_kayit = Kongre_DB::count_kayitlar();
        ?>
        <div class="wrap kongre-wrap">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h1>Atölye Yerleştirme — Doluluk Durumu</h1>
                <a href="<?php echo wp_nonce_url( admin_url( 'admin.php?page=kongre-kayit&kongre_sync_counts=1' ), 'kongre_sync_counts' ); ?>" 
                   class="button button-secondary" 
                   onclick="return confirm('Tüm atölye doluluk sayıları kayıt listesine göre yeniden hesaplanacak. Devam edilsin mi?');">
                   Verileri Onar (Sayım Yap)
                </a>
            </div>
            
            <?php if ( isset( $_GET['synced'] ) ) : ?>
                <div class="notice notice-success"><p>Doluluk sayıları başarıyla senkronize edildi.</p></div>
            <?php endif; ?>

            <p>Toplam kayıt: <strong><?php echo $toplam_kayit; ?></strong></p>

            <?php foreach ( array( 'bilimsel' => '📋 Bilimsel Atölyeler', 'sosyal' => '🎨 Sosyal Atölyeler' ) as $tur => $baslik ) : ?>
            <h2><?php echo $baslik; ?></h2>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Atölye Adı</th>
                        <th>Oturum</th>
                        <th>Kontenjan</th>
                        <th>Dolu</th>
                        <th>Kalan</th>
                        <th>Doluluk</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ( $ozet[ $tur ] as $a ) :
                    $pct = $a['kontenjan'] > 0 ? round( ( $a['dolu'] / $a['kontenjan'] ) * 100 ) : 0;
                    $bar_color = $pct >= 90 ? '#ef4444' : ( $pct >= 70 ? '#f59e0b' : '#22c55e' );
                ?>
                    <tr>
                        <td><?php echo $a['atolye_no']; ?></td>
                        <td><?php echo esc_html( $a['atolye_adi'] ); ?></td>
                        <td><?php echo esc_html( $a['oturum'] ); ?></td>
                        <td><?php echo $a['kontenjan']; ?></td>
                        <td><?php echo $a['dolu']; ?></td>
                        <td><?php echo $a['kalan']; ?></td>
                        <td>
                            <div style="background:#333;border-radius:4px;overflow:hidden;height:18px;width:120px;display:inline-block;vertical-align:middle;">
                                <div style="background:<?php echo $bar_color; ?>;height:100%;width:<?php echo $pct; ?>%;"></div>
                            </div>
                            <span style="margin-left:6px;"><?php echo $pct; ?>%</span>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <?php endforeach; ?>
        </div>
        <?php
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SAYFA: Kayıtlar
    // ═══════════════════════════════════════════════════════════════════════════
    public function page_kayitlar() {
        $page_num = max( 1, intval( $_GET['paged'] ?? 1 ) );
        $per_page = 30;
        $offset   = ( $page_num - 1 ) * $per_page;
        $kayitlar = Kongre_DB::get_kayitlar( $per_page, $offset );
        $total    = Kongre_DB::count_kayitlar();
        $pages    = ceil( $total / $per_page );

        if ( isset( $_GET['deleted'] ) ) {
            echo '<div class="notice notice-success"><p>Kayıt silindi.</p></div>';
        }
        if ( isset( $_GET['bulk_deleted'] ) ) {
            echo '<div class="notice notice-success"><p>' . intval( $_GET['bulk_deleted'] ) . ' kayıt başarıyla silindi.</p></div>';
        }
        ?>
        <div class="wrap kongre-wrap">
            <h1>Atölye Kayıtları <span class="title-count">(<?php echo $total; ?>)</span></h1>
            
            <form method="post" id="kongre-records-form">
                <?php wp_nonce_field( 'kongre_bulk_delete' ); ?>
                <div class="tablenav top">
                    <div class="alignleft actions bulkactions">
                        <select name="kongre_bulk_action" id="bulk-action-selector-top">
                            <option value="-1">Toplu İşlemler</option>
                            <option value="delete">Sil</option>
                        </select>
                        <input type="submit" id="doaction" class="button action" value="Uygula" onclick="return confirm('Seçili kayıtları silmek istediğinize emin misiniz?');">
                    </div>
                </div>

                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <td id="cb" class="manage-column column-cb check-column"><label class="screen-reader-text" for="cb-select-all-1">Tümünü seç</label><input id="cb-select-all-1" type="checkbox"></td>
                            <th style="width:40px">#</th>
                            <th>Ad Soyad</th>
                            <th>Paket / Dönem</th>
                            <th>E-posta / Telefon</th>
                            <th>Bilimsel Atölye</th>
                            <th>Sosyal Atölye</th>
                            <th>Tarih</th>
                            <th style="width:60px">İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php if ( empty( $kayitlar ) ) : ?>
                        <tr><td colspan="9">Henüz kayıt yok.</td></tr>
                    <?php else : foreach ( $kayitlar as $k ) : ?>
                        <tr>
                            <th scope="row" class="check-column"><input type="checkbox" name="bulk_ids[]" value="<?php echo $k->id; ?>"></th>
                            <td><?php echo $k->id; ?></td>
                            <td><?php echo esc_html( $k->ad_soyad ); ?></td>
                            <td>
                                <strong><?php echo esc_html( $k->paket ?: '—' ); ?></strong><br>
                                <span style="color:#666;font-size:12px;"><?php echo esc_html( $k->donem ?: '—' ); ?></span>
                            </td>
                            <td>
                                <?php echo esc_html( $k->email ); ?><br>
                                <span style="color:#666;font-size:12px;"><?php echo esc_html( $k->telefon ); ?></span>
                            </td>
                            <td>
                                <?php if ( $k->bilimsel_atolye_no ) : ?>
                                    Atölye <?php echo $k->bilimsel_atolye_no; ?>
                                    <small>(<?php echo $k->bilimsel_oturum; ?>)</small>
                                    <?php if ( $k->fallback_bilimsel ) echo '<span style="color:#f59e0b;" title="Fallback">⚠</span>'; ?>
                                <?php else : ?>
                                    <span style="color:#666;">—</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ( $k->sosyal_atolye_no ) : ?>
                                    Atölye <?php echo $k->sosyal_atolye_no; ?>
                                    <small>(<?php echo $k->sosyal_oturum; ?>)</small>
                                    <?php if ( $k->fallback_sosyal ) echo '<span style="color:#f59e0b;" title="Fallback">⚠</span>'; ?>
                                <?php else : ?>
                                    <span style="color:#666;">—</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo date( 'd.m.Y H:i', strtotime( $k->created_at ) ); ?></td>
                            <td>
                                <a href="<?php echo wp_nonce_url( admin_url( 'admin.php?page=kongre-kayitlar&kongre_delete_kayit=' . $k->id ), 'kongre_delete_kayit' ); ?>"
                                   class="button button-small" style="color:#ef4444;"
                                   onclick="return confirm('Bu kaydı silmek istediğinize emin misiniz? Kontenjan geri açılacaktır.');">
                                    Sil
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </form>

            <?php if ( $pages > 1 ) : ?>
            <div class="tablenav">
                <div class="tablenav-pages">
                    <?php for ( $i = 1; $i <= $pages; $i++ ) : ?>
                        <?php if ( $i === $page_num ) : ?>
                            <span class="tablenav-pages-navspan button disabled"><?php echo $i; ?></span>
                        <?php else : ?>
                            <a href="<?php echo admin_url( 'admin.php?page=kongre-kayitlar&paged=' . $i ); ?>" class="button"><?php echo $i; ?></a>
                        <?php endif; ?>
                    <?php endfor; ?>
                </div>
            </div>
            <?php endif; ?>
            
            <script>
            jQuery(document).ready(function($){
                $('#cb-select-all-1').on('change', function(){
                    $('input[name="bulk_ids[]"]').prop('checked', $(this).prop('checked'));
                });
            });
            </script>
        </div>
        <?php
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SAYFA: Atölyeler (isim, kontenjan düzenleme)
    // ═══════════════════════════════════════════════════════════════════════════
    public function page_atolyeler() {
        $edit_id = intval( $_GET['edit'] ?? 0 );
        $editing = $edit_id ? Kongre_DB::get_atolye( $edit_id ) : null;

        if ( isset( $_GET['saved'] ) ) {
            echo '<div class="notice notice-success"><p>Atölye güncellendi.</p></div>';
        }

        if ( $editing ) : ?>
        <div class="wrap kongre-wrap">
            <h1>Atölye Düzenle</h1>
            <form method="post">
                <?php wp_nonce_field( 'kongre_save_atolye' ); ?>
                <input type="hidden" name="atolye_id" value="<?php echo $editing->id; ?>">
                <table class="form-table">
                    <tr><th>Tür / No / Oturum</th>
                        <td><?php echo esc_html( $editing->tur . ' #' . $editing->atolye_no . ' — ' . $editing->oturum ); ?></td></tr>
                    <tr><th><label for="atolye_adi">Atölye Adı</label></th>
                        <td><input type="text" name="atolye_adi" id="atolye_adi" class="regular-text" value="<?php echo esc_attr( $editing->atolye_adi ); ?>"></td></tr>
                    <tr><th><label for="oturum_label">Oturum Görünen Adı</label></th>
                        <td><input type="text" name="oturum_label" id="oturum_label" class="regular-text" value="<?php echo esc_attr( $editing->oturum_label ?? '' ); ?>" placeholder="Boş bırakılırsa varsayılan kullanılır">
                        <p class="description">Kullanıcıya gösterilecek oturum adı. Örn: "1. Oturum (10:00-12:00)"</p></td></tr>
                    <tr><th><label for="kontenjan">Kontenjan</label></th>
                        <td><input type="number" name="kontenjan" id="kontenjan" min="1" value="<?php echo $editing->kontenjan; ?>"></td></tr>
                    <tr><th>Aktif</th>
                        <td><input type="checkbox" name="aktif" value="1" <?php checked( $editing->aktif, 1 ); ?>></td></tr>
                </table>
                <p><input type="submit" name="kongre_save_atolye" class="button button-primary" value="Kaydet">
                   <a href="<?php echo admin_url( 'admin.php?page=kongre-atolyeler' ); ?>" class="button">İptal</a></p>
            </form>
        </div>
        <?php return; endif;

        $atolyeler = Kongre_DB::get_all_atolyeler( null, false );

        if ( isset( $_GET['added'] ) )       echo '<div class="notice notice-success"><p>Atölye eklendi.</p></div>';
        if ( isset( $_GET['deleted'] ) )      echo '<div class="notice notice-success"><p>Atölye silindi.</p></div>';
        if ( isset( $_GET['delete_error'] ) ) echo '<div class="notice notice-error"><p>Bu atölyede kayıtlı kişi var, silinemez. Önce kontenjanı boşaltın.</p></div>';
        ?>
        <div class="wrap kongre-wrap">
            <h1>Atölye Yönetimi</h1>

            <!-- Yeni Atölye Ekleme Formu -->
            <div style="background:#f9f9f9;border:1px solid #ddd;padding:15px;margin:10px 0 20px;border-radius:4px;">
                <h3 style="margin-top:0;">➕ Yeni Atölye Ekle</h3>
                <form method="post" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">
                    <?php wp_nonce_field( 'kongre_add_atolye' ); ?>
                    <div>
                        <label><strong>Tür</strong></label><br>
                        <select name="new_tur">
                            <option value="bilimsel">Bilimsel</option>
                            <option value="sosyal">Sosyal</option>
                        </select>
                    </div>
                    <div>
                        <label><strong>No</strong></label><br>
                        <input type="number" name="new_atolye_no" min="1" value="1" style="width:60px;">
                    </div>
                    <div>
                        <label><strong>Atölye Adı</strong></label><br>
                        <input type="text" name="new_atolye_adi" placeholder="Boş bırakılırsa otomatik" style="width:200px;">
                    </div>
                    <div>
                        <label><strong>Oturum</strong></label><br>
                        <select name="new_oturum">
                            <option value="sabah">Sabah</option>
                            <option value="aksam">Akşam</option>
                            <option value="sabah+aksam">Tam Gün</option>
                        </select>
                    </div>
                    <div>
                        <label><strong>Oturum Etiketi</strong></label><br>
                        <input type="text" name="new_oturum_label" placeholder="Ör: 1. Oturum" style="width:150px;">
                    </div>
                    <div>
                        <label><strong>Kontenjan</strong></label><br>
                        <input type="number" name="new_kontenjan" min="1" value="16" style="width:70px;">
                    </div>
                    <div>
                        <input type="submit" name="kongre_add_atolye" class="button button-primary" value="Ekle">
                    </div>
                </form>
            </div>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr><th style="width:40px">ID</th><th>Tür</th><th style="width:40px">No</th><th>Atölye Adı</th><th>Oturum</th><th>Oturum Etiketi</th><th style="width:70px">Kont.</th><th style="width:50px">Dolu</th><th style="width:40px">Aktif</th><th style="width:160px">İşlem</th></tr>
                </thead>
                <tbody>
                <?php foreach ( $atolyeler as $a ) :
                    $oturum_display = $a->oturum;
                    $label_display  = ! empty( $a->oturum_label ) ? $a->oturum_label : '—';
                ?>
                    <tr>
                        <td><?php echo $a->id; ?></td>
                        <td><?php echo esc_html( $a->tur ); ?></td>
                        <td><?php echo $a->atolye_no; ?></td>
                        <td><?php echo esc_html( $a->atolye_adi ); ?></td>
                        <td><?php echo esc_html( $oturum_display ); ?></td>
                        <td><?php echo esc_html( $label_display ); ?></td>
                        <td><?php echo $a->kontenjan; ?></td>
                        <td><?php echo $a->dolu; ?></td>
                        <td><?php echo $a->aktif ? '✓' : '✗'; ?></td>
                        <td>
                            <a href="<?php echo admin_url( 'admin.php?page=kongre-atolyeler&edit=' . $a->id ); ?>" class="button button-small">Düzenle</a>
                            <?php if ( (int) $a->dolu === 0 ) : ?>
                                <a href="<?php echo wp_nonce_url( admin_url( 'admin.php?page=kongre-atolyeler&kongre_delete_atolye=' . $a->id ), 'kongre_delete_atolye' ); ?>" class="button button-small" style="color:#dc3232;" onclick="return confirm('Bu atölyeyi silmek istediğinize emin misiniz?');">Sil</a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SAYFA: Mail Kuyruğu
    // ═══════════════════════════════════════════════════════════════════════════
    public function page_mail() {
        global $wpdb;
        $t = Kongre_DB::table_mail_queue();
        $mails = $wpdb->get_results( "SELECT * FROM $t ORDER BY id DESC LIMIT 50" );
        ?>
        <div class="wrap kongre-wrap">
            <h1>Mail Kuyruğu</h1>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr><th>#</th><th>Kayıt ID</th><th>Alıcı</th><th>Konu</th><th>Durum</th><th>Deneme</th><th>Oluşturulma</th><th>Gönderilme</th></tr>
                </thead>
                <tbody>
                <?php if ( empty( $mails ) ) : ?>
                    <tr><td colspan="8">Kuyrukta mail yok.</td></tr>
                <?php else : foreach ( $mails as $m ) :
                    $status_color = $m->status === 'sent' ? '#22c55e' : ( $m->attempts >= 3 ? '#ef4444' : '#f59e0b' );
                ?>
                    <tr>
                        <td><?php echo $m->id; ?></td>
                        <td><?php echo $m->kayit_id; ?></td>
                        <td><?php echo esc_html( $m->email_to ); ?></td>
                        <td><?php echo esc_html( mb_strimwidth( $m->subject, 0, 50, '…' ) ); ?></td>
                        <td>
                            <span style="color:<?php echo $status_color; ?>;font-weight:600;"><?php echo $m->status; ?></span>
                            <?php if ( ! empty( $m->error_message ) ) : ?>
                                <div style="margin-top:4px;font-size:11px;color:#ef4444;background:#fee2e2;padding:2px 6px;border-radius:4px;display:inline-block;max-width:200px;">
                                    <?php echo esc_html( $m->error_message ); ?>
                                </div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php echo $m->attempts; ?>
                            <?php if ( $m->status !== 'sent' ) : ?>
                                <br>
                                <a href="<?php echo wp_nonce_url( admin_url( 'admin.php?page=kongre-mail&kongre_retry_mail=' . $m->id ), 'kongre_retry_mail' ); ?>" 
                                   class="button button-small" style="margin-top:4px;">Tekrar Dene</a>
                            <?php endif; ?>
                        </td>
                        <td><?php echo $m->created_at; ?></td>
                        <td><?php echo $m->sent_at ?: '—'; ?></td>
                    </tr>
                <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SAYFA: Ayarlar (alan eşleştirme + SMTP + Mail Şablonu)
    // ═══════════════════════════════════════════════════════════════════════════
    public function page_ayarlar() {
        $active_tab = isset( $_GET['tab'] ) ? sanitize_text_field( $_GET['tab'] ) : 'fields';

        $defaults = array(
            'target_form_id' => 0, 'label_ad_soyad' => 'Ad Soyad',
            'label_email' => 'E-posta', 'label_telefon' => 'Telefon',
            'label_email' => 'E-posta', 'label_telefon' => 'Telefon',
            'label_donem' => 'Dönem', 'label_katilimci_turu' => 'Katılımcı Türü',
            'label_paket' => 'Paket',
            'label_bilimsel' => 'Bilimsel Atölye Tercihleri',
            'label_sosyal' => 'Sosyal Atölye Tercihleri',
        );
        $map = wp_parse_args( get_option( 'kongre_field_map', array() ), $defaults );

        $smtp_defaults = array(
            'enabled' => 0, 'host' => '', 'port' => 465, 'encryption' => 'ssl',
            'username' => '', 'password' => '', 'from_name' => '', 'from_email' => '',
        );
        $smtp = wp_parse_args( get_option( 'kongre_smtp_settings', array() ), $smtp_defaults );

        $mail_tpl_defaults = array(
            'subject' => '26. Hitit Tıp Kongresi — Atölye Yerleştirme Sonucunuz',
            'body'    => self::get_default_mail_template(),
        );
        $mail_tpl = wp_parse_args( get_option( 'kongre_mail_template', array() ), $mail_tpl_defaults );

        if ( isset( $_GET['saved'] ) ) {
            echo '<div class="notice notice-success"><p>Ayarlar kaydedildi.</p></div>';
        }

        // Mevcut formları listele (hedef form seçimi için)
        $forms = array();
        if ( class_exists( 'Hitit_Form_DB' ) ) {
            $forms = Hitit_Form_DB::get_forms();
        }
        ?>
        <div class="wrap kongre-wrap">
            <h1>Atölye Yerleştirme Ayarları</h1>

            <nav class="nav-tab-wrapper">
                <a href="<?php echo admin_url( 'admin.php?page=kongre-ayarlar&tab=fields' ); ?>" class="nav-tab <?php echo $active_tab === 'fields' ? 'nav-tab-active' : ''; ?>">Alan Eşleştirme</a>
                <a href="<?php echo admin_url( 'admin.php?page=kongre-ayarlar&tab=desktop' ); ?>" class="nav-tab <?php echo $active_tab === 'desktop' ? 'nav-tab-active' : ''; ?>">Masaüstü API</a>
                <a href="<?php echo admin_url( 'admin.php?page=kongre-ayarlar&tab=smtp' ); ?>" class="nav-tab <?php echo $active_tab === 'smtp' ? 'nav-tab-active' : ''; ?>">SMTP Ayarları</a>
                <a href="<?php echo admin_url( 'admin.php?page=kongre-ayarlar&tab=mail-template' ); ?>" class="nav-tab <?php echo $active_tab === 'mail-template' ? 'nav-tab-active' : ''; ?>">Mail Şablonu</a>
            </nav>

            <div style="margin-top:20px;">
            <?php
            switch ( $active_tab ) {
                case 'desktop':
                    $this->render_desktop_tab( $map );
                    break;
                case 'smtp':
                    $this->render_smtp_tab( $smtp );
                    break;
                case 'mail-template':
                    $this->render_mail_template_tab( $mail_tpl );
                    break;
                default:
                    $this->render_fields_tab( $map, $forms );
                    break;
            }
            ?>
            </div>
        </div>
        <?php
    }

    /**
     * TAB: Masaüstü API
     */
    private function render_desktop_tab( $map ) {
        $auth = Kongre_Desktop_API::get_auth_settings();
        $generated_desktop_key = $this->consume_generated_desktop_key();
        $target_form = ! empty( $map['target_form_id'] ) && class_exists( 'Hitit_Form_DB' )
            ? Hitit_Form_DB::get_form( intval( $map['target_form_id'] ) )
            : null;
        ?>
        <p>KayitHitit Electron uygulaması bu read-only API üzerinden bağlanır. Uygulama her 5 saniyede bir küçük JSON isteği atar; public form akışını değiştirmez.</p>

        <?php if ( isset( $_GET['revoked'] ) ) : ?>
            <div class="notice notice-success inline"><p>Masaüstü API anahtarı kaldırıldı.</p></div>
        <?php endif; ?>

        <?php if ( $generated_desktop_key ) : ?>
            <div class="notice notice-success inline">
                <p><strong>Yeni masaüstü anahtarı üretildi.</strong> Bu değer sadece şimdi gösterilir; hemen KayitHitit uygulamasına yapıştırın.</p>
                <p><input type="text" readonly class="regular-text code" style="width:420px;" value="<?php echo esc_attr( $generated_desktop_key ); ?>" onclick="this.select();"></p>
            </div>
        <?php endif; ?>

        <table class="form-table">
            <tr>
                <th>REST Base URL</th>
                <td>
                    <code><?php echo esc_html( rest_url( 'kongre-desktop/v1' ) ); ?></code>
                    <p class="description">Uygulama bu base URL'den <code>/bootstrap</code>, <code>/live</code>, <code>/participants</code> ve <code>/workshops</code> endpoint'lerine bağlanır.</p>
                </td>
            </tr>
            <tr>
                <th>Hedef Form</th>
                <td>
                    <?php if ( $target_form ) : ?>
                        <strong>#<?php echo (int) $target_form->id; ?> — <?php echo esc_html( $target_form->title ); ?></strong>
                    <?php else : ?>
                        <span style="color:#dc2626;">Henüz seçilmedi.</span>
                    <?php endif; ?>
                    <p class="description">Bu değer <a href="<?php echo admin_url( 'admin.php?page=kongre-ayarlar&tab=fields' ); ?>">Alan Eşleştirme</a> sekmesindeki hedef form seçiminden gelir.</p>
                </td>
            </tr>
            <tr>
                <th>Aktif Anahtar</th>
                <td>
                    <?php if ( ! empty( $auth['hash'] ) ) : ?>
                        <strong>Tanımlı</strong> <code>••••<?php echo esc_html( $auth['last4'] ); ?></code>
                        <?php if ( ! empty( $auth['created_at'] ) ) : ?>
                            <span style="color:#666;">(oluşturulma: <?php echo esc_html( $auth['created_at'] ); ?>)</span>
                        <?php endif; ?>
                    <?php else : ?>
                        <span style="color:#d97706;">Henüz masaüstü anahtarı yok.</span>
                    <?php endif; ?>
                </td>
            </tr>
        </table>

        <div style="display:flex;gap:12px;align-items:center;margin-top:20px;">
            <form method="post">
                <?php wp_nonce_field( 'kongre_generate_desktop_key' ); ?>
                <input type="submit" name="kongre_generate_desktop_key" class="button button-primary" value="<?php echo ! empty( $auth['hash'] ) ? 'Anahtarı Yeniden Üret' : 'API Anahtarı Üret'; ?>">
            </form>

            <?php if ( ! empty( $auth['hash'] ) ) : ?>
                <form method="post">
                    <?php wp_nonce_field( 'kongre_revoke_desktop_key' ); ?>
                    <input type="submit" name="kongre_revoke_desktop_key" class="button" style="color:#dc2626;" value="Anahtarı Kaldır" onclick="return confirm('Mevcut KayitHitit bağlantıları çalışmaz hale gelecek. Devam edilsin mi?');">
                </form>
            <?php endif; ?>
        </div>

        <hr>
        <h2>İstemci Başlıkları</h2>
        <p>KayitHitit her istekte aşağıdaki header'ı gönderir:</p>
        <p><code>X-Hitit-Desktop-Key: ...</code></p>

        <h2>Performans Notu</h2>
        <p>Bu API read-only çalışır. 1 açık istemci yaklaşık dakikada 12 istek üretir. Delta sorguları <code>hitit_form_entries(form_id, id)</code> indeksi üzerinden çalıştığı için normal kullanımda site performansına belirgin etkisi beklenmez.</p>
        <?php
    }

    /**
     * TAB: Alan Eşleştirme
     */
    private function render_fields_tab( $map, $forms ) {
        ?>
        <p>Hitit Form Builder'da oluşturduğun formun alan etiketlerini buraya gir. Plugin, form gönderildiğinde bu etiketleri arayarak verileri bulur.</p>

        <form method="post">
            <?php wp_nonce_field( 'kongre_save_settings' ); ?>
            <table class="form-table">
                <tr>
                    <th><label for="target_form_id">Hedef Form</label></th>
                    <td>
                        <select name="target_form_id" id="target_form_id">
                            <option value="0">Tüm Formlar</option>
                            <?php foreach ( $forms as $f ) : ?>
                                <option value="<?php echo $f->id; ?>" <?php selected( $map['target_form_id'], $f->id ); ?>>
                                    #<?php echo $f->id; ?> — <?php echo esc_html( $f->title ); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">Sadece belirli bir formda yerleştirme çalışsın mı? "Tüm Formlar" seçilirse, tercih alanı bulunan her formda çalışır.</p>
                    </td>
                </tr>
                <tr><th colspan="2"><h2 style="margin:0;padding:0;">Alan Etiketleri (Form Builder'daki label'lar)</h2></th></tr>
                <?php
                // Hedef form seçiliyse alanları getir
                $form_fields = array();
                if ( ! empty( $map['target_form_id'] ) ) {
                    $selected_form = Hitit_Form_DB::get_form( intval( $map['target_form_id'] ) );
                    if ( $selected_form && ! empty( $selected_form->fields ) && is_array( $selected_form->fields ) ) {
                        foreach ( $selected_form->fields as $f ) {
                            $type = $f['type'] ?? 'text';
                            if ( in_array( $type, array( 'heading', 'divider', 'html', 'submit' ), true ) ) continue;
                            $lbl = $f['label'] ?? ( $f['name'] ?? '' );
                            if ( $lbl ) $form_fields[] = $lbl;
                        }
                    }
                }
                
                $fields = array(
                    'label_ad_soyad'   => array( 'Ad Soyad Alanı', 'Formdaki ad soyad alanının etiketi' ),
                    'label_email'      => array( 'E-posta Alanı', 'Formdaki e-posta alanının etiketi' ),
                    'label_telefon'    => array( 'Telefon Alanı', 'Formdaki telefon alanının etiketi' ),
                    'label_donem'      => array( 'Dönem Alanı', 'Formdaki dönem alanının etiketi (ör: 1. Sınıf, 2. Sınıf)' ),
                    'label_katilimci_turu' => array( 'Katılımcı Türü Alanı', 'Formdaki katılımcı türü alanının etiketi (ör: Aktif, Pasif)' ),
                    'label_paket'      => array( 'Paket Alanı', 'Formdaki paket alanının etiketi (ör: Konaklamalı, Dış Katılım)' ),
                    'label_bilimsel'   => array( 'Bilimsel Tercih Alanı', 'Formdaki bilimsel atölye tercihleri alanının etiketi' ),
                    'label_sosyal'     => array( 'Sosyal Tercih Alanı', 'Formdaki sosyal atölye tercihleri alanının etiketi' ),
                );
                foreach ( $fields as $key => $info ) : ?>
                <tr>
                    <th><label for="<?php echo $key; ?>"><?php echo $info[0]; ?></label></th>
                    <td>
                        <?php if ( ! empty( $form_fields ) ) : ?>
                            <select name="<?php echo $key; ?>" id="<?php echo $key; ?>">
                                <option value="">-- Seçiniz --</option>
                                <?php foreach ( $form_fields as $ff ) : ?>
                                    <option value="<?php echo esc_attr( $ff ); ?>" <?php selected( $map[ $key ], $ff ); ?>><?php echo esc_html( $ff ); ?></option>
                                <?php endforeach; ?>
                                <!-- Fallback için mevcut değer listede yoksa ekle (manuel giriş desteği için text input'a geçiş gerekebilir ama şimdilik dropdown güvenli) -->
                                <?php if ( $map[ $key ] && ! in_array( $map[ $key ], $form_fields ) ) : ?>
                                    <option value="<?php echo esc_attr( $map[ $key ] ); ?>" selected><?php echo esc_html( $map[ $key ] ); ?> (Mevcut)</option>
                                <?php endif; ?>
                            </select>
                        <?php else : ?>
                            <input type="text" name="<?php echo $key; ?>" id="<?php echo $key; ?>" class="regular-text" value="<?php echo esc_attr( $map[ $key ] ); ?>">
                        <?php endif; ?>
                        <p class="description"><?php echo $info[1]; ?></p>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>
            <p>
                <input type="submit" name="kongre_save_settings" class="button button-primary" value="Ayarları Kaydet">
                <?php if ( empty( $map['target_form_id'] ) ) : ?>
                    <span style="margin-left:10px;color:#666;">(Dropdown listesi için önce Hedef Form seçip kaydedin)</span>
                <?php endif; ?>
            </p>
        </form>

        <hr>
        <h2>Nasıl Çalışır?</h2>
        <ol>
            <li>Hitit Form Builder ile bir kayıt formu oluştur (ad soyad, e-posta, telefon, dekont, kimlik + atölye tercihleri).</li>
            <li>Atölye tercihleri için bir text alanı ekle. Öğrenci "3,1,7,2" formatında sıralı tercih yazacak.</li>
            <li>Yukarıdaki etiketlerin form alanlarının label'larıyla eşleştiğinden emin ol.</li>
            <li>Form gönderildiğinde bu plugin otomatik olarak araya girer, yerleştirme yapar, sonucu ekranda gösterir ve e-posta gönderir.</li>
            <li>Google Sheets'e de "Bilimsel Atölye" ve "Sosyal Atölye" sütunları otomatik eklenir.</li>
        </ol>
        <?php
    }

    /**
     * TAB: SMTP Ayarları
     */
    private function render_smtp_tab( $smtp ) {
        ?>
        <p>Mail göndermek için özel SMTP sunucu bilgilerinizi girin. Devre dışı bırakılırsa WordPress'in varsayılan <code>wp_mail()</code> fonksiyonu kullanılır.</p>

        <form method="post">
            <?php wp_nonce_field( 'kongre_save_smtp' ); ?>
            <table class="form-table">
                <tr>
                    <th>SMTP Aktif</th>
                    <td>
                        <label><input type="checkbox" name="smtp_enabled" value="1" <?php checked( $smtp['enabled'], 1 ); ?>> Özel SMTP sunucusu kullan</label>
                        <p class="description">Kapalıyken WordPress varsayılan mail ayarlarıyla gönderilir.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="smtp_host">SMTP Sunucu</label></th>
                    <td><input type="text" name="smtp_host" id="smtp_host" class="regular-text" value="<?php echo esc_attr( $smtp['host'] ); ?>" placeholder="mail.example.com"></td>
                </tr>
                <tr>
                    <th><label for="smtp_port">Port</label></th>
                    <td>
                        <input type="number" name="smtp_port" id="smtp_port" min="1" max="65535" value="<?php echo esc_attr( $smtp['port'] ); ?>" style="width:100px;">
                        <p class="description">SSL: 465 / TLS: 587 / None: 25</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="smtp_encryption">Şifreleme</label></th>
                    <td>
                        <select name="smtp_encryption" id="smtp_encryption">
                            <option value="ssl" <?php selected( $smtp['encryption'], 'ssl' ); ?>>SSL</option>
                            <option value="tls" <?php selected( $smtp['encryption'], 'tls' ); ?>>TLS</option>
                            <option value="" <?php selected( $smtp['encryption'], '' ); ?>>Yok</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th><label for="smtp_username">Kullanıcı Adı</label></th>
                    <td><input type="text" name="smtp_username" id="smtp_username" class="regular-text" value="<?php echo esc_attr( $smtp['username'] ); ?>" placeholder="iletisim@example.com"></td>
                </tr>
                <tr>
                    <th><label for="smtp_password">Şifre</label></th>
                    <td><input type="password" name="smtp_password" id="smtp_password" class="regular-text" value="<?php echo esc_attr( $smtp['password'] ); ?>"></td>
                </tr>
                <tr><th colspan="2"><h2 style="margin:0;padding:0;">Gönderici Bilgileri</h2></th></tr>
                <tr>
                    <th><label for="smtp_from_name">Gönderici Adı</label></th>
                    <td><input type="text" name="smtp_from_name" id="smtp_from_name" class="regular-text" value="<?php echo esc_attr( $smtp['from_name'] ); ?>" placeholder="26. Hitit Tıp Kongresi"></td>
                </tr>
                <tr>
                    <th><label for="smtp_from_email">Gönderici E-posta</label></th>
                    <td><input type="email" name="smtp_from_email" id="smtp_from_email" class="regular-text" value="<?php echo esc_attr( $smtp['from_email'] ); ?>" placeholder="iletisim@example.com"></td>
                </tr>
            </table>
            <p><input type="submit" name="kongre_save_smtp" class="button button-primary" value="SMTP Ayarlarını Kaydet"></p>
        </form>

        <hr>
        <h2>Test</h2>
        <p>Ayarları kaydettikten sonra <a href="<?php echo admin_url( 'admin.php?page=kongre-mail' ); ?>">Mail Kuyruğu</a> sayfasından gönderim durumunu takip edebilirsiniz.</p>
        <?php
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SAYFA: Atölye Listeleri (Dropdown + CSV + ZIP)
    // ═══════════════════════════════════════════════════════════════════════════
    public function page_atolyeler_listesi() {
        $atolyeler = Kongre_DB::get_all_atolyeler( null, true );
        $selected_id = intval( $_POST['atolye_id'] ?? ( $_GET['atolye_id'] ?? 0 ) );
        
        $current_list = array();
        if ( $selected_id ) {
            $current_list = Kongre_DB::get_kayitlar_by_atolye_id( $selected_id );
        }
        ?>
        <div class="wrap kongre-wrap">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h1>Atölye Listeleri</h1>
                <div>
                     <a href="<?php echo wp_nonce_url( admin_url( 'admin.php?page=kongre-listeler&kongre_download_zip=1' ), 'kongre_download_zip' ); ?>" class="button button-primary">Tümünü ZIP İndir</a>
                </div>
            </div>

            <div class="card" style="margin-top:20px;padding:15px;max-width:100%;">
                <form method="get">
                    <input type="hidden" name="page" value="kongre-listeler">
                    <label for="atolye_id" style="font-weight:600;font-size:14px;margin-right:10px;">Atölye Seçiniz:</label>
                    <select name="atolye_id" id="atolye_id" style="min-width:300px;">
                        <option value="0">-- Seçiniz --</option>
                        <?php foreach ( $atolyeler as $a ) : 
                            $label = sprintf( '%s #%d - %s (%s) [%d/%d]',
                                ucfirst( $a->tur ), $a->atolye_no, $a->atolye_adi, ucfirst( $a->oturum ), $a->dolu, $a->kontenjan 
                            );
                        ?>
                            <option value="<?php echo $a->id; ?>" <?php selected( $selected_id, $a->id ); ?>><?php echo esc_html( $label ); ?></option>
                        <?php endforeach; ?>
                    </select>
                    <input type="submit" class="button button-secondary" value="Listele">
                </form>
            </div>

            <?php if ( $selected_id && $current_list ) : ?>
                <div style="margin-top:20px;">
                    <h2 style="display:inline-block;margin-right:15px;">Katılımcı Listesi (<?php echo count( $current_list ); ?> kişi)</h2>
                    <a href="<?php echo wp_nonce_url( admin_url( 'admin.php?page=kongre-listeler&kongre_download_csv=' . $selected_id ), 'kongre_download_csv' ); ?>" class="button">CSV Olarak İndir</a>
                    
                    <table class="wp-list-table widefat fixed striped" style="margin-top:10px;">
                        <thead>
                            <tr><th>#</th><th>Ad Soyad</th><th>Telefon</th><th>E-posta</th><th>Dönem</th><th>Paket</th></tr>
                        </thead>
                        <tbody>
                            <?php foreach ( $current_list as $k ) : ?>
                            <tr>
                                <td><?php echo $k->id; ?></td>
                                <td><?php echo esc_html( $k->ad_soyad ); ?></td>
                                <td><?php echo esc_html( $k->telefon ); ?></td>
                                <td><?php echo esc_html( $k->email ); ?></td>
                                <td><?php echo esc_html( $k->donem ); ?></td>
                                <td><?php echo esc_html( $k->paket ); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php elseif ( $selected_id ) : ?>
                <div class="notice notice-warning inline" style="margin-top:20px;"><p>Bu atölyeye henüz kimse kayıt olmamış.</p></div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * TAB: Mail Şablonu
     */
    private function render_mail_template_tab( $mail_tpl ) {
        ?>
        <p>Kayıt sonrası gönderilecek mailin konusu ve HTML içeriğini düzenleyin. Aşağıdaki placeholder'ları kullanabilirsiniz:</p>

        <div style="background:#f0f0f1;padding:12px 16px;border-radius:6px;margin-bottom:16px;">
            <code style="display:inline-block;margin:2px 6px;">{ad_soyad}</code>
            <code style="display:inline-block;margin:2px 6px;">{email}</code>
            <code style="display:inline-block;margin:2px 6px;">{telefon}</code>
            <code style="display:inline-block;margin:2px 6px;">{donem}</code>
            <code style="display:inline-block;margin:2px 6px;">{katilimci_turu}</code>
            <code style="display:inline-block;margin:2px 6px;">{bilimsel_atolye}</code>
            <code style="display:inline-block;margin:2px 6px;">{bilimsel_oturum}</code>
            <code style="display:inline-block;margin:2px 6px;">{bilimsel_tercih_sirasi}</code>
            <code style="display:inline-block;margin:2px 6px;">{bilimsel_fallback_notu}</code>
            <code style="display:inline-block;margin:2px 6px;">{sosyal_atolye}</code>
            <code style="display:inline-block;margin:2px 6px;">{sosyal_oturum}</code>
            <code style="display:inline-block;margin:2px 6px;">{sosyal_tercih_sirasi}</code>
            <code style="display:inline-block;margin:2px 6px;">{sosyal_fallback_notu}</code>
            <code style="display:inline-block;margin:2px 6px;">{sosyal_mesaj}</code>
        </div>

        <form method="post">
            <?php wp_nonce_field( 'kongre_save_mail_template' ); ?>
            <table class="form-table">
                <tr>
                    <th><label for="mail_subject">Mail Konusu</label></th>
                    <td>
                        <input type="text" name="mail_subject" id="mail_subject" class="large-text" value="<?php echo esc_attr( $mail_tpl['subject'] ); ?>">
                        <p class="description">Placeholder'lar konu satırında da kullanılabilir. Ör: <code>{ad_soyad}</code></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="mail_body">Mail İçeriği (HTML)</label></th>
                    <td>
                        <textarea name="mail_body" id="mail_body" rows="30" class="large-text code" style="font-family:monospace;font-size:13px;"><?php echo esc_textarea( $mail_tpl['body'] ); ?></textarea>
                        <p class="description">HTML formatında mail şablonu. Yukarıdaki placeholder'ları kullanarak kişiselleştirin.</p>
                    </td>
                </tr>
            </table>
            <p>
                <input type="submit" name="kongre_save_mail_template" class="button button-primary" value="Şablonu Kaydet">
                <button type="button" class="button" onclick="if(confirm('Şablonu varsayılana sıfırlamak istediğinize emin misiniz?')){document.getElementById('mail_body').value=kongre_default_template;}" style="margin-left:8px;">Varsayılana Sıfırla</button>
            </p>
        </form>

        <script>
        var kongre_default_template = <?php echo wp_json_encode( self::get_default_mail_template() ); ?>;
        </script>

        <hr>
        <h2>Önizleme</h2>
        <p>Şablonunuzu kaydettiğinizde, bir sonraki kayıtta bu şablon kullanılacaktır. Mevcut kuyrukta bekleyen mailler eski şablonla gönderilir.</p>
        <?php
    }

    /**
     * Varsayılan mail HTML şablonu
     */
    public static function get_default_mail_template() {
        return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
<div style="background-color:#F5F5F5;color:#262626;font-family:Bahnschrift,\'DIN Alternate\',\'Franklin Gothic Medium\',sans-serif;font-size:16px;font-weight:400;line-height:1.5;margin:0;padding:32px 0;min-height:100%;width:100%;">
  <table align="center" width="100%" style="margin:0 auto;max-width:600px;background-color:#FFFFFF;" role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tbody>
      <tr>
        <td>
          <!-- HEADER -->
          <div style="background-color:#003f63;text-align:center;padding:24px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;">26. Hitit Tıp Kongresi</h1>
          </div>

          <div style="padding:24px 32px;">
            <!-- BAŞVURU SONUCU -->
            <h2 style="color:#003f63;text-align:center;">Atölye Yerleştirme Sonucu</h2>
            <p>Sayın <strong>{ad_soyad}</strong>,</p>
            <p>Kongre kaydınız başarıyla alınmış ve atölye yerleştirmeniz tamamlanmıştır. Aşağıda yerleştirme detaylarınızı bulabilirsiniz.</p>

            <hr style="border:1px solid #e4e8eb;margin:20px 0;">

            <!-- BİLGİLER -->
            <h3 style="color:#003f63;">Bilgileriniz</h3>
            <p><strong>E-Posta:</strong> {email}</p>
            <p><strong>Telefon:</strong> {telefon}</p>
            <p><strong>Dönem:</strong> {donem}</p>

            <hr style="border:1px solid #e4e8eb;margin:20px 0;">

            <!-- YERLEŞTİRME -->
            <h3 style="color:#003f63;">Yerleştirildiğiniz Atölyeler</h3>

            <div style="background:#f0f7ff;border:1px solid #cce0f5;border-radius:8px;padding:16px;margin:12px 0;">
              <h4 style="margin:0 0 8px 0;color:#003f63;">📋 Bilimsel Atölye</h4>
              <p style="margin:4px 0;font-size:17px;font-weight:600;">{bilimsel_atolye}</p>
              <p style="margin:4px 0;color:#555;">Oturum: {bilimsel_oturum}</p>
              <p style="margin:4px 0;color:#555;">{bilimsel_tercih_sirasi}</p>
              <p style="margin:4px 0;color:#d97706;">{bilimsel_fallback_notu}</p>
            </div>

            <div style="background:#f0f7ff;border:1px solid #cce0f5;border-radius:8px;padding:16px;margin:12px 0;">
              <h4 style="margin:0 0 8px 0;color:#003f63;">🎨 Sosyal Atölye</h4>
              <p style="margin:4px 0;font-size:17px;font-weight:600;">{sosyal_atolye}</p>
              <p style="margin:4px 0;color:#555;">Oturum: {sosyal_oturum}</p>
              <p style="margin:4px 0;color:#555;">{sosyal_tercih_sirasi}</p>
              <p style="margin:4px 0;color:#d97706;">{sosyal_fallback_notu}</p>
              <p style="margin:4px 0;color:#555;">{sosyal_mesaj}</p>
            </div>
          </div>

          <!-- FOOTER -->
          <div style="background-color:#003f63;color:#ffffff;text-align:center;padding:20px 24px;">
            <p style="margin:4px 0;font-size:12px;">Bu e-posta 26. Hitit Tıp Kongresi kayıt sistemi tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
</body>
</html>';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SAYFA: Kontenjan Yönetimi (Opsiyon Kotaları)
    // ═══════════════════════════════════════════════════════════════════════════
    public function page_kotalar() {
        // Mevcut formları al
        $forms = array();
        if ( class_exists( 'Hitit_Form_DB' ) ) {
            $forms = Hitit_Form_DB::get_forms();
        }
        $quotas = Kongre_DB::get_option_quotas();

        if ( isset( $_GET['quota_added'] ) )   echo '<div class="notice notice-success"><p>Kota eklendi.</p></div>';
        if ( isset( $_GET['quota_deleted'] ) ) echo '<div class="notice notice-success"><p>Kota silindi.</p></div>';
        if ( isset( $_GET['quota_error'] ) )   echo '<div class="notice notice-error"><p>Kota eklenemedi (aynı alan/değer zaten var olabilir).</p></div>';
        ?>
        <div class="wrap kongre-wrap">
            <h1>Kontenjan Yönetimi</h1>
            <p>Form alan seçeneklerine (üniversite, şehir vb.) kontenjan ekleyebilirsiniz. Kontenjan dolan seçenek otomatik olarak devre dışı kalır.</p>

            <!-- Yeni Kota Ekleme -->
            <div style="background:#f9f9f9;border:1px solid #ddd;padding:15px;margin:10px 0 20px;border-radius:4px;">
                <h3 style="margin-top:0;">➕ Yeni Kontenjan Ekle</h3>
                <form method="post" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">
                    <?php wp_nonce_field( 'kongre_add_quota' ); ?>
                    <div>
                        <label><strong>Form</strong></label><br>
                        <select name="quota_form_id">
                            <?php foreach ( $forms as $f ) : ?>
                                <option value="<?php echo $f->id; ?>"><?php echo esc_html( $f->title ); ?> (ID: <?php echo $f->id; ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label><strong>Alan Adı (name)</strong></label><br>
                        <input type="text" name="quota_field_name" placeholder="Ör: universite" style="width:150px;" required>
                        <p class="description" style="margin:2px 0 0;">Formdaki alanın name değeri</p>
                    </div>
                    <div>
                        <label><strong>Seçenek Değeri</strong></label><br>
                        <input type="text" name="quota_option_value" placeholder="Ör: Hitit Üniversitesi" style="width:200px;" required>
                    </div>
                    <div>
                        <label><strong>Kontenjan</strong></label><br>
                        <input type="number" name="quota_kontenjan" min="1" value="10" style="width:70px;" required>
                    </div>
                    <div>
                        <input type="submit" name="kongre_add_quota" class="button button-primary" value="Ekle">
                    </div>
                </form>
            </div>

            <?php if ( empty( $quotas ) ) : ?>
                <p style="color:#888;">Henüz kota tanımlanmamış.</p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width:40px">ID</th>
                            <th>Form</th>
                            <th>Alan Adı</th>
                            <th>Seçenek Değeri</th>
                            <th style="width:80px">Kontenjan</th>
                            <th style="width:60px">Dolu</th>
                            <th style="width:60px">Kalan</th>
                            <th style="width:70px">Durum</th>
                            <th style="width:60px">İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php foreach ( $quotas as $q ) :
                        $kalan = max( 0, (int) $q->kontenjan - (int) $q->dolu );
                        $durum = $kalan <= 0 ? '<span style="color:#dc3232;font-weight:bold;">DOLU</span>' : '<span style="color:#46b450;">Açık</span>';
                        // Form adını bul
                        $form_title = 'Form #' . $q->form_id;
                        foreach ( $forms as $f ) {
                            if ( (int) $f->id === (int) $q->form_id ) {
                                $form_title = $f->title;
                                break;
                            }
                        }
                    ?>
                        <tr>
                            <td><?php echo $q->id; ?></td>
                            <td><?php echo esc_html( $form_title ); ?></td>
                            <td><code><?php echo esc_html( $q->field_name ); ?></code></td>
                            <td><?php echo esc_html( $q->option_value ); ?></td>
                            <td><?php echo $q->kontenjan; ?></td>
                            <td><?php echo $q->dolu; ?></td>
                            <td><?php echo $kalan; ?></td>
                            <td><?php echo $durum; ?></td>
                            <td>
                                <a href="<?php echo wp_nonce_url( admin_url( 'admin.php?page=kongre-kotalar&kongre_delete_quota=' . $q->id ), 'kongre_delete_quota' ); ?>" class="button button-small" style="color:#dc3232;" onclick="return confirm('Bu kotayı silmek istediğinize emin misiniz?');">Sil</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }
}
