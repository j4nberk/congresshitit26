<?php
/**
 * Plugin Name: Kongre Atölye Yerleştirme
 * Plugin URI: https://hitittipkongresi.com
 * Description: Hitit Form Builder'a hook olarak çalışır. Form gönderildiğinde atölye tercihlerini alır, anlık yerleştirme yapar, sonucu Google Sheets'e yazar.
 * Version: 2.0.0
 * Author: Hitit Kongre
 * Text Domain: kongre-kayit
 * Requires: Hitit Form Builder (form-plugin)
 * License: GPL v2 or later
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'KONGRE_KAYIT_VERSION', '2.0.0' );
define( 'KONGRE_KAYIT_PATH', plugin_dir_path( __FILE__ ) );
define( 'KONGRE_KAYIT_URL', plugin_dir_url( __FILE__ ) );

// ── Aktivasyon: Tabloları oluştur ───────────────────────────────────────────
register_activation_hook( __FILE__, 'kongre_kayit_activate' );
function kongre_kayit_activate() {
    require_once KONGRE_KAYIT_PATH . 'includes/class-kongre-db.php';
    Kongre_DB::create_tables();
    Kongre_DB::seed_atolyeler();

    // WP-Cron mail kuyruğu
    if ( ! wp_next_scheduled( 'kongre_process_mail_queue' ) ) {
        wp_schedule_event( time(), 'every_minute', 'kongre_process_mail_queue' );
    }
}

// ── Deaktivasyon ────────────────────────────────────────────────────────────
register_deactivation_hook( __FILE__, 'kongre_kayit_deactivate' );
function kongre_kayit_deactivate() {
    wp_clear_scheduled_hook( 'kongre_process_mail_queue' );
}

// ── Özel cron aralığı ──────────────────────────────────────────────────────
add_filter( 'cron_schedules', 'kongre_add_cron_interval' );
function kongre_add_cron_interval( $schedules ) {
    if ( ! isset( $schedules['every_minute'] ) ) {
        $schedules['every_minute'] = array(
            'interval' => 60,
            'display'  => __( 'Her Dakika', 'kongre-kayit' ),
        );
    }
    return $schedules;
}

// ── Dosyaları yükle ─────────────────────────────────────────────────────────
require_once KONGRE_KAYIT_PATH . 'includes/class-kongre-db.php';
require_once KONGRE_KAYIT_PATH . 'includes/class-kongre-allocator.php';
require_once KONGRE_KAYIT_PATH . 'includes/class-kongre-desktop-api.php';
require_once KONGRE_KAYIT_PATH . 'includes/class-kongre-hook.php';
require_once KONGRE_KAYIT_PATH . 'includes/class-kongre-mailer.php';
require_once KONGRE_KAYIT_PATH . 'public/class-kongre-public.php';

if ( is_admin() ) {
    require_once KONGRE_KAYIT_PATH . 'admin/class-kongre-admin.php';
    new Kongre_Admin();
}

// ── Public: Doluluk AJAX endpoint + frontend asset'leri ─────────────────────
$kongre_public = new Kongre_Public();
$kongre_public->register();

// ── Form Builder hook'unu kaydet ────────────────────────────────────────────
add_action( 'init', function() {
    $hook = new Kongre_Hook();
    $hook->register();
});

add_action( 'init', function() {
    $desktop_api = new Kongre_Desktop_API();
    $desktop_api->register();
} );

// ── WP-Cron: Mail kuyruğunu işle ───────────────────────────────────────────
add_action( 'kongre_process_mail_queue', function() {
    Kongre_Mailer::process_queue();
});
