<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Kongre_DB {

    public static function normalize_sort( $sort ) {
        return $sort === 'alfabetik' ? 'alfabetik' : 'basvuru';
    }

    private static function get_order_clause( $sort, $fallback = 'id DESC' ) {
        $sort = self::normalize_sort( $sort );

        if ( $sort === 'alfabetik' ) {
            return 'ad_soyad ASC, id ASC';
        }

        if ( $sort === 'basvuru' ) {
            return 'CASE WHEN form_entry_id IS NULL THEN 1 ELSE 0 END ASC, form_entry_id ASC, id ASC';
        }

        return $fallback;
    }

    public static function table_atolyeler() {
        global $wpdb;
        return $wpdb->prefix . 'kongre_atolyeler';
    }

    public static function table_kayitlar() {
        global $wpdb;
        return $wpdb->prefix . 'kongre_kayitlar';
    }

    public static function table_mail_queue() {
        global $wpdb;
        return $wpdb->prefix . 'kongre_mail_queue';
    }

    public static function table_option_quotas() {
        global $wpdb;
        return $wpdb->prefix . 'kongre_option_quotas';
    }

    /**
     * Tabloları oluştur
     */
    public static function create_tables() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();

        $t_atolye = self::table_atolyeler();
        $t_kayit  = self::table_kayitlar();
        $t_mail   = self::table_mail_queue();

        $sql_atolye = "CREATE TABLE $t_atolye (
            id int(11) NOT NULL AUTO_INCREMENT,
            tur varchar(20) NOT NULL COMMENT 'bilimsel veya sosyal',
            atolye_no int(11) NOT NULL,
            atolye_adi varchar(255) NOT NULL DEFAULT '',
            oturum varchar(20) NOT NULL COMMENT 'sabah, aksam, sabah+aksam',
            oturum_label varchar(100) NOT NULL DEFAULT '' COMMENT 'Custom display label for session',
            kontenjan int(11) NOT NULL DEFAULT 16,
            dolu int(11) NOT NULL DEFAULT 0,
            aktif tinyint(1) NOT NULL DEFAULT 1,
            PRIMARY KEY (id),
            UNIQUE KEY tur_no_oturum (tur, atolye_no, oturum),
            KEY idx_tur_aktif (tur, aktif)
        ) $charset;";

        $sql_kayit = "CREATE TABLE $t_kayit (
            id int(11) NOT NULL AUTO_INCREMENT,
            form_entry_id int(11) DEFAULT NULL COMMENT 'Hitit Form entry ID',
            ad_soyad varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            telefon varchar(30) NOT NULL DEFAULT '',
            donem varchar(255) NOT NULL DEFAULT '',
            bilimsel_tercihler varchar(255) NOT NULL DEFAULT '',
            sosyal_tercihler varchar(255) NOT NULL DEFAULT '',
            bilimsel_atolye_id int(11) DEFAULT NULL,
            bilimsel_atolye_no int(11) DEFAULT NULL,
            bilimsel_oturum varchar(20) DEFAULT NULL,
            sosyal_atolye_id int(11) DEFAULT NULL,
            sosyal_atolye_no int(11) DEFAULT NULL,
            sosyal_oturum varchar(20) DEFAULT NULL,
            katilimci_turu varchar(255) NOT NULL DEFAULT '',
            paket varchar(255) NOT NULL DEFAULT '',
            fallback_bilimsel tinyint(1) NOT NULL DEFAULT 0,
            fallback_sosyal tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_form_entry (form_entry_id),
            KEY idx_email (email),
            KEY idx_telefon (telefon)
        ) $charset;";

        $sql_mail = "CREATE TABLE $t_mail (
            id int(11) NOT NULL AUTO_INCREMENT,
            kayit_id int(11) NOT NULL,
            email_to varchar(255) NOT NULL,
            subject varchar(500) NOT NULL,
            body longtext NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            attempts int(11) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            sent_at datetime DEFAULT NULL,
            error_message text DEFAULT NULL,
            PRIMARY KEY (id),
            KEY idx_status (status)
        ) $charset;";

        $t_quotas = self::table_option_quotas();
        $sql_quotas = "CREATE TABLE $t_quotas (
            id int(11) NOT NULL AUTO_INCREMENT,
            form_id int(11) NOT NULL,
            field_name varchar(100) NOT NULL,
            option_value varchar(255) NOT NULL,
            kontenjan int(11) NOT NULL DEFAULT 0,
            dolu int(11) NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            UNIQUE KEY form_field_option (form_id, field_name, option_value)
        ) $charset;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql_atolye );
        dbDelta( $sql_kayit );
        dbDelta( $sql_mail );
        dbDelta( $sql_quotas );
    }

    /**
     * Varsayılan atölyeleri oluştur (sadece tablo boşsa)
     */
    public static function seed_atolyeler() {
        global $wpdb;
        $table = self::table_atolyeler();

        if ( (int) $wpdb->get_var( "SELECT COUNT(*) FROM $table" ) > 0 ) return;

        $bilimsel = 11;
        $sosyal   = 10;
        $kont     = 16;
        $cift_no  = 6;

        for ( $i = 1; $i <= $bilimsel; $i++ ) {
            if ( $i === $cift_no ) {
                $wpdb->insert( $table, array(
                    'tur' => 'bilimsel', 'atolye_no' => $i,
                    'atolye_adi' => "Bilimsel Atölye $i (Çift Oturum)",
                    'oturum' => 'sabah+aksam', 'kontenjan' => 32, 'dolu' => 0, 'aktif' => 1,
                ));
            } else {
                foreach ( array( 'sabah', 'aksam' ) as $o ) {
                    $wpdb->insert( $table, array(
                        'tur' => 'bilimsel', 'atolye_no' => $i,
                        'atolye_adi' => "Bilimsel Atölye $i",
                        'oturum' => $o, 'kontenjan' => $kont, 'dolu' => 0, 'aktif' => 1,
                    ));
                }
            }
        }

        for ( $i = 1; $i <= $sosyal; $i++ ) {
            foreach ( array( 'sabah', 'aksam' ) as $o ) {
                $wpdb->insert( $table, array(
                    'tur' => 'sosyal', 'atolye_no' => $i,
                    'atolye_adi' => "Sosyal Atölye $i",
                    'oturum' => $o, 'kontenjan' => $kont, 'dolu' => 0, 'aktif' => 1,
                ));
            }
        }
    }

    public static function get_all_atolyeler( $tur = null, $only_active = true ) {
        global $wpdb;
        $table = self::table_atolyeler();
        $active_clause = $only_active ? 'AND aktif = 1' : '';
        if ( $tur ) {
            return $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM $table WHERE tur = %s $active_clause ORDER BY atolye_no, oturum", $tur
            ));
        }
        $where = $only_active ? 'WHERE aktif = 1' : '';
        return $wpdb->get_results( "SELECT * FROM $table $where ORDER BY tur, atolye_no, oturum" );
    }

    public static function get_atolye( $id ) {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM " . self::table_atolyeler() . " WHERE id = %d", $id
        ));
    }

    public static function insert_kayit( $data ) {
        global $wpdb;
        $wpdb->insert( self::table_kayitlar(), $data );
        return $wpdb->insert_id;
    }

    public static function get_kayit( $id ) {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM " . self::table_kayitlar() . " WHERE id = %d", $id
        ));
    }

    public static function get_kayit_by_form_entry_id( $form_entry_id ) {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM " . self::table_kayitlar() . " WHERE form_entry_id = %d ORDER BY id DESC LIMIT 1",
            (int) $form_entry_id
        ) );
    }

    public static function get_kayitlar( $limit = 50, $offset = 0 ) {
        global $wpdb;
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM " . self::table_kayitlar() . " ORDER BY id DESC LIMIT %d OFFSET %d",
            $limit, $offset
        ));
    }

    public static function count_kayitlar() {
        global $wpdb;
        return (int) $wpdb->get_var( "SELECT COUNT(*) FROM " . self::table_kayitlar() );
    }

    public static function count_kayitlar_for_form( $form_id ) {
        global $wpdb;
        $table = self::table_kayitlar();
        $entries_table = $wpdb->prefix . 'hitit_form_entries';

        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*)
            FROM $table kayit
            INNER JOIN $entries_table entry
                ON entry.id = kayit.form_entry_id
            WHERE entry.form_id = %d",
            (int) $form_id
        ) );
    }

    public static function get_all_kayitlar( $sort = 'basvuru' ) {
        global $wpdb;
        $table = self::table_kayitlar();
        $order = self::get_order_clause( $sort );

        return $wpdb->get_results( "SELECT * FROM $table ORDER BY $order" );
    }

    public static function get_all_kayitlar_for_form( $form_id, $sort = 'basvuru' ) {
        global $wpdb;
        $table = self::table_kayitlar();
        $entries_table = $wpdb->prefix . 'hitit_form_entries';
        $order = self::get_order_clause( $sort );

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT kayit.*, entry.created_at AS form_created_at
            FROM $table kayit
            INNER JOIN $entries_table entry
                ON entry.id = kayit.form_entry_id
            WHERE entry.form_id = %d
            ORDER BY $order",
            (int) $form_id
        ) );
    }

    public static function get_existing_form_entry_ids( $form_id, array $entry_ids ) {
        global $wpdb;
        if ( empty( $entry_ids ) ) {
            return array();
        }

        $ids = array_values( array_unique( array_filter( array_map( 'intval', $entry_ids ) ) ) );
        if ( empty( $ids ) ) {
            return array();
        }

        $table = $wpdb->prefix . 'hitit_form_entries';
        $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
        $query = $wpdb->prepare(
            "SELECT id FROM $table WHERE form_id = %d AND id IN ($placeholders)",
            array_merge( array( (int) $form_id ), $ids )
        );

        return array_map( 'intval', (array) $wpdb->get_col( $query ) );
    }

    public static function get_kayitlar_by_form_entry_ids( array $entry_ids ) {
        global $wpdb;
        if ( empty( $entry_ids ) ) {
            return array();
        }

        $ids = array_values( array_unique( array_filter( array_map( 'intval', $entry_ids ) ) ) );
        if ( empty( $ids ) ) {
            return array();
        }

        $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
        $table = self::table_kayitlar();
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE form_entry_id IN ($placeholders)",
            ...$ids
        ) );

        $mapped = array();
        foreach ( $rows as $row ) {
            $mapped[ (int) $row->form_entry_id ] = $row;
        }

        return $mapped;
    }

    public static function get_last_form_entry_id() {
        global $wpdb;
        $table = self::table_kayitlar();

        return (int) $wpdb->get_var( "SELECT MAX(form_entry_id) FROM $table" );
    }

    public static function get_state_token() {
        global $wpdb;
        $table = self::table_kayitlar();
        $summary = $wpdb->get_row(
            "SELECT
                COUNT(*) AS total,
                COALESCE(MAX(id), 0) AS max_id,
                COALESCE(MAX(form_entry_id), 0) AS max_form_entry_id,
                COALESCE(SUM(id), 0) AS sum_id,
                COALESCE(SUM(COALESCE(form_entry_id, 0)), 0) AS sum_form_entry_id,
                COALESCE(SUM(COALESCE(bilimsel_atolye_id, 0)), 0) AS sum_bilimsel_atolye_id,
                COALESCE(SUM(COALESCE(sosyal_atolye_id, 0)), 0) AS sum_sosyal_atolye_id
            FROM $table",
            ARRAY_A
        );

        if ( ! is_array( $summary ) ) {
            $summary = array(
                'total'                 => 0,
                'max_id'                => 0,
                'max_form_entry_id'     => 0,
                'sum_id'                => 0,
                'sum_form_entry_id'     => 0,
                'sum_bilimsel_atolye_id'=> 0,
                'sum_sosyal_atolye_id'  => 0,
            );
        }

        return md5( wp_json_encode( $summary ) );
    }

    public static function get_state_token_for_form( $form_id ) {
        global $wpdb;
        $table = self::table_kayitlar();
        $entries_table = $wpdb->prefix . 'hitit_form_entries';
        $summary = $wpdb->get_row( $wpdb->prepare(
            "SELECT
                COUNT(*) AS total,
                COALESCE(MAX(kayit.id), 0) AS max_id,
                COALESCE(MAX(kayit.form_entry_id), 0) AS max_form_entry_id,
                COALESCE(SUM(kayit.id), 0) AS sum_id,
                COALESCE(SUM(COALESCE(kayit.form_entry_id, 0)), 0) AS sum_form_entry_id,
                COALESCE(SUM(COALESCE(kayit.bilimsel_atolye_id, 0)), 0) AS sum_bilimsel_atolye_id,
                COALESCE(SUM(COALESCE(kayit.sosyal_atolye_id, 0)), 0) AS sum_sosyal_atolye_id,
                COALESCE(MAX(entry.id), 0) AS max_entry_id,
                COALESCE(SUM(entry.id), 0) AS sum_entry_id
            FROM $table kayit
            INNER JOIN $entries_table entry
                ON entry.id = kayit.form_entry_id
            WHERE entry.form_id = %d",
            (int) $form_id
        ), ARRAY_A );

        if ( ! is_array( $summary ) ) {
            $summary = array(
                'total'                  => 0,
                'max_id'                 => 0,
                'max_form_entry_id'      => 0,
                'sum_id'                 => 0,
                'sum_form_entry_id'      => 0,
                'sum_bilimsel_atolye_id' => 0,
                'sum_sosyal_atolye_id'   => 0,
                'max_entry_id'           => 0,
                'sum_entry_id'           => 0,
            );
        }

        return md5( wp_json_encode( $summary ) );
    }

    public static function get_kayitlar_by_atolye( $tur, $atolye_no, $oturum = null, $sort = 'alfabetik' ) {
        global $wpdb;
        $table = self::table_kayitlar();
        $col_no = ( $tur === 'bilimsel' ) ? 'bilimsel_atolye_no' : 'sosyal_atolye_no';
        $col_ot = ( $tur === 'bilimsel' ) ? 'bilimsel_oturum' : 'sosyal_oturum';
        $order  = self::get_order_clause( $sort, 'ad_soyad ASC, id ASC' );

        if ( $oturum ) {
            return $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM $table WHERE $col_no = %d AND $col_ot = %s ORDER BY $order",
                $atolye_no,
                $oturum
            ));
        }
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE $col_no = %d ORDER BY $order",
            $atolye_no
        ));
    }

    public static function get_kayitlar_by_atolye_id( $atolye_id, $sort = 'alfabetik' ) {
        $atolye = self::get_atolye( $atolye_id );
        if ( ! $atolye ) return array();
        return self::get_kayitlar_by_atolye( $atolye->tur, $atolye->atolye_no, $atolye->oturum, $sort );
    }

    public static function get_kayitlar_by_atolye_id_for_form( $form_id, $atolye_id, $sort = 'alfabetik' ) {
        global $wpdb;
        $atolye = self::get_atolye( $atolye_id );
        if ( ! $atolye ) {
            return array();
        }

        $table = self::table_kayitlar();
        $entries_table = $wpdb->prefix . 'hitit_form_entries';
        $col_no = $atolye->tur === 'bilimsel' ? 'bilimsel_atolye_no' : 'sosyal_atolye_no';
        $col_ot = $atolye->tur === 'bilimsel' ? 'bilimsel_oturum' : 'sosyal_oturum';
        $order = self::get_order_clause( $sort, 'ad_soyad ASC, id ASC' );

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT kayit.*, entry.created_at AS form_created_at
            FROM $table kayit
            INNER JOIN $entries_table entry
                ON entry.id = kayit.form_entry_id
            WHERE entry.form_id = %d
                AND kayit.$col_no = %d
                AND kayit.$col_ot = %s
            ORDER BY $order",
            (int) $form_id,
            (int) $atolye->atolye_no,
            (string) $atolye->oturum
        ) );
    }

    /**
     * Kayıt sil — kontenjanı geri aç (transaction ile)
     */
    public static function delete_kayit( $id ) {
        global $wpdb;
        $kayit = self::get_kayit( $id );
        if ( ! $kayit ) return false;

        $t_atolye = self::table_atolyeler();
        $t_kayit  = self::table_kayitlar();

        $wpdb->query( 'START TRANSACTION' );
        try {
            if ( $kayit->bilimsel_atolye_id ) {
                $wpdb->query( $wpdb->prepare(
                    "UPDATE $t_atolye SET dolu = GREATEST(dolu - 1, 0) WHERE id = %d",
                    $kayit->bilimsel_atolye_id
                ));
            }
            if ( $kayit->sosyal_atolye_id ) {
                $wpdb->query( $wpdb->prepare(
                    "UPDATE $t_atolye SET dolu = GREATEST(dolu - 1, 0) WHERE id = %d",
                    $kayit->sosyal_atolye_id
                ));
            }
            $wpdb->delete( $t_kayit, array( 'id' => $id ) );
            $wpdb->delete( self::table_mail_queue(), array( 'kayit_id' => $id ) );
            $wpdb->query( 'COMMIT' );
            return true;
        } catch ( \Exception $e ) {
            $wpdb->query( 'ROLLBACK' );
            return false;
        }
    }

    public static function delete_kayit_by_form_entry_id( $form_entry_id ) {
        $kayit = self::get_kayit_by_form_entry_id( $form_entry_id );
        if ( ! $kayit ) {
            return false;
        }

        return self::delete_kayit( (int) $kayit->id );
    }

    public static function sync_deleted_form_entries( $form_id ) {
        if ( ! class_exists( 'Hitit_Form_DB' ) ) {
            return 0;
        }

        $rows = self::get_all_kayitlar( 'basvuru' );
        if ( empty( $rows ) ) {
            return 0;
        }

        $form_entry_ids = array_values( array_unique( array_filter( array_map( function( $row ) {
            return (int) ( $row->form_entry_id ?? 0 );
        }, $rows ) ) ) );

        if ( empty( $form_entry_ids ) ) {
            return 0;
        }

        $existing = self::get_existing_form_entry_ids( $form_id, $form_entry_ids );
        $existing_lookup = array_fill_keys( $existing, true );
        $deleted = 0;

        foreach ( $rows as $row ) {
            $entry_id = (int) ( $row->form_entry_id ?? 0 );
            if ( $entry_id > 0 && ! isset( $existing_lookup[ $entry_id ] ) ) {
                if ( self::delete_kayit( (int) $row->id ) ) {
                    $deleted++;
                }
            }
        }

        return $deleted;
    }

    // ── Mail kuyruğu ────────────────────────────────────────────────────────
    public static function queue_mail( $kayit_id, $email_to, $subject, $body ) {
        global $wpdb;
        $wpdb->insert( self::table_mail_queue(), array(
            'kayit_id' => $kayit_id, 'email_to' => $email_to,
            'subject' => $subject, 'body' => $body, 'status' => 'pending',
        ));
    }

    public static function get_pending_mails( $limit = 10 ) {
        global $wpdb;
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM " . self::table_mail_queue() . " WHERE status = 'pending' AND attempts < 3 ORDER BY id LIMIT %d",
            $limit
        ));
    }

    public static function update_mail_status( $id, $status, $error_msg = null ) {
        global $wpdb;
        $table = self::table_mail_queue();
        if ( $status === 'sent' ) {
            $wpdb->query( $wpdb->prepare(
                "UPDATE $table SET status = %s, attempts = attempts + 1, sent_at = %s, error_message = NULL WHERE id = %d",
                $status, current_time( 'mysql' ), $id
            ));
        } else {
            $wpdb->query( $wpdb->prepare(
                "UPDATE $table SET status = %s, attempts = attempts + 1, error_message = %s WHERE id = %d",
                $status, $error_msg, $id
            ));
        }
    }

    public static function reset_mail_attempts( $id ) {
        global $wpdb;
        $table = self::table_mail_queue();
        $wpdb->query( $wpdb->prepare(
            "UPDATE $table SET status = 'pending', attempts = 0, error_message = NULL WHERE id = %d",
            $id
        ));
    }

    /**
     * Doluluk sayılarını senkronize et (Veri Onarımı)
     */
    public static function recalculate_counts() {
        global $wpdb;
        $t_atolye = self::table_atolyeler();
        $t_kayit  = self::table_kayitlar();

        // 1. Tüm sayaçları sıfırla
        $wpdb->query( "UPDATE $t_atolye SET dolu = 0" );

        // 2. Bilimsel atölye sayılarını al
        $bilimsel_counts = $wpdb->get_results( "SELECT bilimsel_atolye_id, COUNT(*) as c FROM $t_kayit WHERE bilimsel_atolye_id > 0 GROUP BY bilimsel_atolye_id" );
        foreach ( $bilimsel_counts as $row ) {
            $wpdb->update( $t_atolye, array( 'dolu' => $row->c ), array( 'id' => $row->bilimsel_atolye_id ) );
        }

        // 3. Sosyal atölye sayılarını al
        $sosyal_counts = $wpdb->get_results( "SELECT sosyal_atolye_id, COUNT(*) as c FROM $t_kayit WHERE sosyal_atolye_id > 0 GROUP BY sosyal_atolye_id" );
        foreach ( $sosyal_counts as $row ) {
            $current = $wpdb->get_var( $wpdb->prepare( "SELECT dolu FROM $t_atolye WHERE id = %d", $row->sosyal_atolye_id ) );
            $wpdb->update( $t_atolye, array( 'dolu' => $current + $row->c ), array( 'id' => $row->sosyal_atolye_id ) );
        }
    }

    // ── Option Quotas (Üniversite Kontenjanları vb.) ────────────────────────
    public static function get_option_quotas( $form_id = null ) {
        global $wpdb;
        $t = self::table_option_quotas();
        if ( $form_id ) {
            return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $t WHERE form_id = %d ORDER BY field_name, option_value", $form_id ) );
        }
        return $wpdb->get_results( "SELECT * FROM $t ORDER BY form_id, field_name, option_value" );
    }

    public static function get_option_quota( $id ) {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM " . self::table_option_quotas() . " WHERE id = %d", $id ) );
    }

    public static function get_quotas_for_form( $form_id, $field_name ) {
        global $wpdb;
        $t = self::table_option_quotas();
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $t WHERE form_id = %d AND field_name = %s ORDER BY option_value",
            $form_id, $field_name
        ));
    }

    public static function add_option_quota( $form_id, $field_name, $option_value, $kontenjan ) {
        global $wpdb;
        $wpdb->insert( self::table_option_quotas(), array(
            'form_id'      => (int) $form_id,
            'field_name'   => $field_name,
            'option_value' => $option_value,
            'kontenjan'    => (int) $kontenjan,
            'dolu'         => 0,
        ));
        return $wpdb->insert_id;
    }

    public static function increment_option_quota( $form_id, $field_name, $option_value ) {
        global $wpdb;
        $t = self::table_option_quotas();
        return $wpdb->query( $wpdb->prepare(
            "UPDATE $t
            SET dolu = dolu + 1
            WHERE form_id = %d
                AND field_name = %s
                AND option_value = %s
                AND dolu < kontenjan",
            $form_id, $field_name, $option_value
        ));
    }

    public static function decrement_option_quota( $form_id, $field_name, $option_value ) {
        global $wpdb;
        $t = self::table_option_quotas();
        return $wpdb->query( $wpdb->prepare(
            "UPDATE $t SET dolu = GREATEST(dolu - 1, 0) WHERE form_id = %d AND field_name = %s AND option_value = %s",
            $form_id, $field_name, $option_value
        ));
    }

    public static function delete_option_quota( $id ) {
        global $wpdb;
        return $wpdb->delete( self::table_option_quotas(), array( 'id' => (int) $id ) );
    }
}
