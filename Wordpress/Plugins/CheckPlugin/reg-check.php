<?php
/**
 * Plugin Name: Hitit Kayıt Kontrol
 * Description: Kullanıcıların telefon numarası ile Google Sheets üzerinden kayıt durumlarını sorgulamalarını sağlar.
 * Version: 1.1.6
 * Author: Hitit
 * Text Domain: hitit-reg-check
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HRCHECK_VERSION', '1.1.6' );
define( 'HRCHECK_PATH', plugin_dir_path( __FILE__ ) );
define( 'HRCHECK_URL', plugin_dir_url( __FILE__ ) );

// Sınıfları yükle
require_once HRCHECK_PATH . 'includes/class-reg-check-admin.php';
require_once HRCHECK_PATH . 'includes/class-reg-check-shortcode.php';
require_once HRCHECK_PATH . 'includes/class-reg-check-ajax.php';

// Admin (sadece admin panelinde yükle)
if ( is_admin() ) {
    $admin = new HRCheck_Admin();
    $admin->register();
}

// Shortcode
$shortcode = new HRCheck_Shortcode();
$shortcode->register();

// AJAX
$ajax = new HRCheck_Ajax();
$ajax->register();