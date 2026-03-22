<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Google Sheets Asenkron Kuyruk
 *
 * Form gönderiminde Sheets verisini DB'ye yazar (~1ms).
 * WP-Cron ile arka planda kuyruğu işler.
 * Kullanıcı anında yanıt alır — darboğaz ortadan kalkar.
 */
class Hitit_Sheets_Queue {

    const TABLE_SUFFIX = 'hitit_sheets_queue';
    const CRON_HOOK    = 'hitit_sheets_queue_process';
    const BATCH_SIZE   = 10;  // Her cron çalışmasında max kaç satır işle
    const MAX_ATTEMPTS = 5;   // Başarısız gönderim tekrar deneme limiti

    /**
     * Tablo adı
     */
    public static function table() {
        global $wpdb;
        return $wpdb->prefix . self::TABLE_SUFFIX;
    }

    /**
     * Tabloyu oluştur (plugin aktivasyonunda çağrılır)
     */
    public static function create_table() {
        global $wpdb;
        $table   = self::table();
        $charset = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            web_app_url varchar(500) NOT NULL,
            payload longtext NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            attempts tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
            last_error text DEFAULT '',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT NULL,
            processed_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY status_attempts (status, attempts)
        ) $charset;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }

    /**
     * Kuyruğa ekle (form gönderiminde çağrılır — çok hızlı, sadece INSERT)
     */
    public static function enqueue( $web_app_url, $entry_data ) {
        global $wpdb;

        // Tarih/saat bilgisi ekle
        $entry_data['Gönderim Tarihi'] = current_time( 'd.m.Y H:i' );

        return $wpdb->insert( self::table(), array(
            'web_app_url' => $web_app_url,
            'payload'     => wp_json_encode( $entry_data, JSON_UNESCAPED_UNICODE ),
            'status'      => 'pending',
        ) );
    }

    /**
     * Cron hook'unu kaydet
     */
    public static function schedule_cron() {
        if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
            wp_schedule_event( time(), 'every_minute', self::CRON_HOOK );
        }
    }

    /**
     * Cron hook'unu kaldır (plugin deaktivasyon)
     */
    public static function unschedule_cron() {
        $timestamp = wp_next_scheduled( self::CRON_HOOK );
        if ( $timestamp ) {
            wp_unschedule_event( $timestamp, self::CRON_HOOK );
        }
    }

    /**
     * Kuyruğu işle (cron tarafından çağrılır)
     */
    public static function process_queue() {
        global $wpdb;
        $table = self::table();

        // 1. Önce takılı kalan 'processing' kayıtlarını kurtar (15 dakikadan uzun sürenler)
        $wpdb->query( "UPDATE $table SET status = 'pending' WHERE status = 'processing' AND updated_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)" );

        // 2. İşlenecek kayıtları seç
        $items = $wpdb->get_results( $wpdb->prepare(
            "SELECT id, web_app_url, payload, attempts FROM $table WHERE status = 'pending' AND attempts < %d ORDER BY id ASC LIMIT %d",
            self::MAX_ATTEMPTS,
            self::BATCH_SIZE
        ) );

        if ( empty( $items ) ) {
            return;
        }

        // 3. Bu kayıtları hemen 'processing' olarak işaretle (KİLİTLEME)
        $ids = array();
        foreach ( $items as $item ) {
            $ids[] = intval( $item->id );
        }
        
        if ( ! empty( $ids ) ) {
            $id_list = implode( ',', $ids );
            $wpdb->query( "UPDATE $table SET status = 'processing', updated_at = NOW() WHERE id IN ($id_list)" );
        }

        // 4. Teker teker işle
        foreach ( $items as $item ) {
            // Deneme sayısını şimdiden artır
            $new_attempts = $item->attempts + 1;

            // Gönder
            $result = Hitit_Google_Sheets::post_entry( $item->web_app_url, json_decode( $item->payload, true ) );

            if ( is_wp_error( $result ) ) {
                // Hata — tekrar denenecek (max deneme aşılırsa 'failed' olacak)
                $final_status = ( $new_attempts >= self::MAX_ATTEMPTS ) ? 'failed' : 'pending';
                $wpdb->update( $table,
                    array(
                        'status'     => $final_status,
                        'attempts'   => $new_attempts,
                        'last_error' => $result->get_error_message(),
                        'updated_at' => current_time( 'mysql' ),
                    ),
                    array( 'id' => $item->id )
                );
                error_log( sprintf(
                    'Sheets Queue #%d: Deneme %d/%d başarısız — %s',
                    $item->id, $new_attempts, self::MAX_ATTEMPTS, $result->get_error_message()
                ) );
            } else {
                // Başarılı
                $wpdb->update( $table,
                    array(
                        'status'       => 'sent',
                        'attempts'     => $new_attempts,
                        'processed_at' => current_time( 'mysql' ),
                        'updated_at'   => current_time( 'mysql' ),
                    ),
                    array( 'id' => $item->id )
                );
            }
        }
    }

    /**
     * Kuyruk istatistikleri (admin paneli için) — tek query
     */
    public static function get_stats() {
        global $wpdb;
        $table = self::table();

        $rows = $wpdb->get_results( "SELECT status, COUNT(*) AS cnt FROM $table GROUP BY status" );

        $stats = array( 'pending' => 0, 'sent' => 0, 'failed' => 0 );
        foreach ( $rows as $row ) {
            if ( isset( $stats[ $row->status ] ) ) {
                $stats[ $row->status ] = (int) $row->cnt;
            }
        }
        return $stats;
    }

    /**
     * Eski kayıtları temizle — 30 günden eski 'sent' kayıtları siler.
     * Cron ile çağrılmalıdır (günlük).
     */
    public static function cleanup_old_entries( $days = 30 ) {
        global $wpdb;
        $table = self::table();

        return $wpdb->query( $wpdb->prepare(
            "DELETE FROM $table WHERE status = 'sent' AND processed_at < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $days
        ) );
    }
}
