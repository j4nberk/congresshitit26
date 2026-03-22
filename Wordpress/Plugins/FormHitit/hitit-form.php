<?php
/**
 * Plugin Name: Hitit Form Builder
 * Plugin URI: https://hitittipkongresi.com
 * Description: Drag & drop form oluşturucu - Google Sheets entegrasyonu, koşullu alanlar ve shortcode desteği.
 * Version: 2.0.0
 * Author: Hitit Kongre
 * Text Domain: hitit-form
 * License: GPL v2 or later
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HITIT_FORM_VERSION', '2.0.0' );
define( 'HITIT_FORM_PATH', plugin_dir_path( __FILE__ ) );
define( 'HITIT_FORM_URL', plugin_dir_url( __FILE__ ) );

// ── Dosyaları ÖNCE yükle (hook'larda kullanılacak sınıflar tanımlı olsun) ──
require_once HITIT_FORM_PATH . 'includes/class-form-db.php';
require_once HITIT_FORM_PATH . 'includes/class-google-sheets.php';
require_once HITIT_FORM_PATH . 'includes/class-sheets-queue.php';
require_once HITIT_FORM_PATH . 'includes/class-form-shortcode.php';
require_once HITIT_FORM_PATH . 'includes/class-form-ajax.php';

if ( is_admin() ) {
    require_once HITIT_FORM_PATH . 'admin/class-form-admin.php';
}

// ── Veritabanı tabloları oluştur ──
register_activation_hook( __FILE__, 'hitit_form_activate' );
function hitit_form_activate() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    // Formlar tablosu
    $table_forms = $wpdb->prefix . 'hitit_forms';
    $sql_forms = "CREATE TABLE $table_forms (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL,
        fields longtext NOT NULL,
        settings longtext DEFAULT '',
        google_sheet_id varchar(255) DEFAULT '',
        google_credentials longtext DEFAULT '',
        start_time datetime DEFAULT NULL,
        wait_message longtext DEFAULT '',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset;";

    // Gönderimler tablosu
    $table_entries = $wpdb->prefix . 'hitit_form_entries';
    $sql_entries = "CREATE TABLE $table_entries (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        form_id mediumint(9) NOT NULL,
        data longtext NOT NULL,
        ip_address varchar(45) DEFAULT '',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY form_id (form_id),
        KEY form_id_id (form_id, id)
    ) $charset;";

    // Unique alan claim tablosu
    $table_unique = $wpdb->prefix . 'hitit_form_unique_values';
    $sql_unique = "CREATE TABLE $table_unique (
        id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        form_id mediumint(9) NOT NULL,
        entry_id mediumint(9) NOT NULL,
        field_name varchar(100) NOT NULL,
        field_label varchar(255) NOT NULL DEFAULT '',
        field_value text NOT NULL,
        normalized_value varchar(191) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY form_field_value (form_id, field_name, normalized_value),
        KEY entry_id (entry_id),
        KEY form_field (form_id, field_name)
    ) $charset;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql_forms );
    dbDelta( $sql_entries );
    dbDelta( $sql_unique );

    // Upload klasorunu aktivasyonda hazirla; runtime submit yukunu azaltir.
    Hitit_Form_Ajax::prepare_upload_directory();

    // Sheets kuyruk tablosunu oluştur
    Hitit_Sheets_Queue::create_table();

    // Cron zamanlayıcıyı kaydet
    Hitit_Sheets_Queue::schedule_cron();

    // Günlük eski kayıt temizliği cron'unu kaydet
    if ( ! wp_next_scheduled( 'hitit_sheets_queue_cleanup' ) ) {
        wp_schedule_event( time(), 'daily', 'hitit_sheets_queue_cleanup' );
    }
}

// Plugin deaktivasyon — cron temizliği
register_deactivation_hook( __FILE__, 'hitit_form_deactivate' );
function hitit_form_deactivate() {
    Hitit_Sheets_Queue::unschedule_cron();
    $ts = wp_next_scheduled( 'hitit_sheets_queue_cleanup' );
    if ( $ts ) { wp_unschedule_event( $ts, 'hitit_sheets_queue_cleanup' ); }
}

// "Her dakika" cron aralığını tanımla
add_filter( 'cron_schedules', function( $schedules ) {
    if ( ! isset( $schedules['every_minute'] ) ) {
        $schedules['every_minute'] = array(
            'interval' => 60,
            'display'  => __( 'Her Dakika' ),
        );
    }
    return $schedules;
} );

// Cron hook'unu bağla — kuyruğu işle
add_action( Hitit_Sheets_Queue::CRON_HOOK, array( 'Hitit_Sheets_Queue', 'process_queue' ) );

// Cron hook'unu bağla — eski kayıtları temizle (günlük)
add_action( 'hitit_sheets_queue_cleanup', array( 'Hitit_Sheets_Queue', 'cleanup_old_entries' ) );

// Shortcode kayıt
add_action( 'init', function() {
    $shortcode = new Hitit_Form_Shortcode();
    $shortcode->register();
});

// AJAX handler
add_action( 'init', function() {
    $ajax = new Hitit_Form_Ajax();
    $ajax->register();
});

// ── Veritabanı Güncelleme Kontrolü ──
add_action( 'plugins_loaded', 'hitit_form_update_db_check' );
function hitit_form_update_db_check() {
    if ( get_site_option( 'hitit_form_db_version' ) != HITIT_FORM_VERSION ) {
        hitit_form_activate();
        update_site_option( 'hitit_form_db_version', HITIT_FORM_VERSION );
    }
}

// ── Ortak yardımcı fonksiyon ────────────────────────────────────────────────
/**
 * İstemci IP adresini al (rate limiting & loglama için)
 * Cloudflare, proxy ve doğrudan bağlantı destekler.
 * Güvenlik: Sadece geçerli bir IP adresi formatında olanları kabul eder.
 *
 * @return string
 */
function hitit_form_get_client_ip(): string {
    $keys = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR' );
    
    foreach ( $keys as $key ) {
        if ( ! empty( $_SERVER[ $key ] ) ) {
            $ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) ) );
            $ip = trim( $ips[0] );
            
            // IP formatını doğrula (Spoofing ve enjeksiyon önlemi)
            if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
                return $ip;
            }
        }
    }
    
    return '0.0.0.0';
}
