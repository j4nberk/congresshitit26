<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Kongre Mailer — WP-Cron ile mail kuyruğunu işler
 * SMTP ayarlarını admin panelinden okur ve PHPMailer'a uygular.
 */
class Kongre_Mailer {

    /** SMTP ayarları — process_queue sırasında set edilir */
    private static $smtp_settings = null;

    /**
     * Kuyruktaki bekleyen mailleri gönder (her cron çalışmasında max 10)
     */
    public static function process_queue() {
        $mails = Kongre_DB::get_pending_mails( 10 );

        if ( empty( $mails ) ) return;

        // SMTP ayarlarını oku
        self::$smtp_settings = wp_parse_args( get_option( 'kongre_smtp_settings', array() ), array(
            'enabled'    => 0,
            'host'       => '',
            'port'       => 465,
            'encryption' => 'ssl',
            'username'   => '',
            'password'   => '',
            'from_name'  => '',
            'from_email' => '',
        ) );

        // SMTP aktifse hook'ları ekle
        if ( self::$smtp_settings['enabled'] && ! empty( self::$smtp_settings['host'] ) ) {
            add_action( 'phpmailer_init', array( __CLASS__, 'configure_phpmailer' ), 99 );
        }

        // From bilgileri (SMTP aktif olmasa da çalışsın)
        if ( ! empty( self::$smtp_settings['from_email'] ) ) {
            add_filter( 'wp_mail_from', array( __CLASS__, 'set_from_email' ), 99 );
        }
        if ( ! empty( self::$smtp_settings['from_name'] ) ) {
            add_filter( 'wp_mail_from_name', array( __CLASS__, 'set_from_name' ), 99 );
        }

        $headers = array( 'Content-Type: text/html; charset=UTF-8' );

        // Hata yakalama için global değişken
        global $phpmailer_error;
        $phpmailer_error = null;
        
        // wp_mail_failed aksiyonunu dinle
        add_action( 'wp_mail_failed', array( __CLASS__, 'capture_mail_error' ) );

        foreach ( $mails as $mail ) {
            $phpmailer_error = null; // Her gönderimden önce sıfırla
            $sent = wp_mail( $mail->email_to, $mail->subject, $mail->body, $headers );

            if ( $sent ) {
                Kongre_DB::update_mail_status( $mail->id, 'sent' );
            } else {
                // Hata mesajını al
                $error_msg = 'Bilinmeyen hata';
                if ( $phpmailer_error && is_wp_error( $phpmailer_error ) ) {
                    $error_msg = $phpmailer_error->get_error_message();
                    // Bazen data içinde daha detaylı bilgi olabilir
                    $error_data = $phpmailer_error->get_error_data();
                    if ( is_array( $error_data ) && isset( $error_data['phpmailer_exception_code'] ) ) {
                        $error_msg .= ' (Code: ' . $error_data['phpmailer_exception_code'] . ')';
                    }
                }
                
                Kongre_DB::update_mail_status( $mail->id, 'pending', $error_msg ); // attempts artacak
                error_log( 'Kongre Mailer: Mail gönderilemedi — #' . $mail->id . ' → ' . $mail->email_to . ' | Hata: ' . $error_msg );
            }
        }

        // Hook'ları temizle — diğer pluginleri etkilemesin
        remove_action( 'wp_mail_failed', array( __CLASS__, 'capture_mail_error' ) );
        remove_action( 'phpmailer_init', array( __CLASS__, 'configure_phpmailer' ), 99 );
        remove_filter( 'wp_mail_from', array( __CLASS__, 'set_from_email' ), 99 );
        remove_filter( 'wp_mail_from_name', array( __CLASS__, 'set_from_name' ), 99 );

        self::$smtp_settings = null;
    }

    /**
     * wp_mail_failed olduğunda hatayı yakalar
     */
    public static function capture_mail_error( $error ) {
        global $phpmailer_error;
        $phpmailer_error = $error;
    }

    /**
     * PHPMailer'a SMTP ayarlarını uygula
     */
    public static function configure_phpmailer( $phpmailer ) {
        $smtp = self::$smtp_settings;
        if ( ! $smtp || ! $smtp['enabled'] ) return;

        $phpmailer->isSMTP();
        $phpmailer->Host       = $smtp['host'];
        $phpmailer->Port       = (int) $smtp['port'];
        $phpmailer->SMTPAuth   = true;
        $phpmailer->Username   = $smtp['username'];
        $phpmailer->Password   = $smtp['password'];

        if ( ! empty( $smtp['encryption'] ) ) {
            $phpmailer->SMTPSecure = $smtp['encryption']; // 'ssl' veya 'tls'
        } else {
            $phpmailer->SMTPSecure = '';
        }

        $phpmailer->SMTPAutoTLS = false; // Bazı sunucularda sorun çıkarabilir, manuel kontrol

        // SSL Doğrulamasını Devre Dışı Bırak (Code 0 hatasını çözmek için)
        // Birçok hosting'de sertifika uyuşmazlığı bu hataya neden olur.
        $phpmailer->SMTPOptions = array(
            'ssl' => array(
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true
            )
        );

        // From bilgileri
        if ( ! empty( $smtp['from_email'] ) ) {
            $phpmailer->From = $smtp['from_email'];
        }
        if ( ! empty( $smtp['from_name'] ) ) {
            $phpmailer->FromName = $smtp['from_name'];
        }
    }

    /**
     * wp_mail_from filtresi
     */
    public static function set_from_email( $email ) {
        if ( self::$smtp_settings && ! empty( self::$smtp_settings['from_email'] ) ) {
            return self::$smtp_settings['from_email'];
        }
        return $email;
    }

    /**
     * wp_mail_from_name filtresi
     */
    public static function set_from_name( $name ) {
        if ( self::$smtp_settings && ! empty( self::$smtp_settings['from_name'] ) ) {
            return self::$smtp_settings['from_name'];
        }
        return $name;
    }
}
