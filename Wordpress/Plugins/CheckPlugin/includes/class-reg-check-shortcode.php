<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class HRCheck_Shortcode {

    public function register() {
        add_shortcode( 'kayit_kontrol', array( $this, 'render' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
    }

    public function enqueue_assets() {
        global $post;
        if ( ! is_a( $post, 'WP_Post' ) || ! has_shortcode( $post->post_content, 'kayit_kontrol' ) ) {
            return;
        }

        $settings = get_option( 'hrcheck_settings', array() );
        $site_key = $settings['recaptcha_site_key'] ?? '';

        // reCAPTCHA API
        if ( $site_key ) {
            wp_enqueue_script( 'google-recaptcha', 'https://www.google.com/recaptcha/api.js', array(), null, true );
        }

        wp_enqueue_style(
            'hrcheck-public',
            HRCHECK_URL . 'assets/css/reg-check.css',
            array(),
            HRCHECK_VERSION
        );

        wp_enqueue_script(
            'hrcheck-public',
            HRCHECK_URL . 'assets/js/reg-check.js',
            array( 'jquery' ),
            HRCHECK_VERSION,
            true
        );

        wp_localize_script( 'hrcheck-public', 'hrcheck', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'hrcheck_query' ),
            'siteKey' => $site_key,
        ));
    }

    public function render() {
        $s = get_option( 'hrcheck_settings', array() );

        $title       = $s['title'] ?? 'Kayıt Sorgula';
        $description = $s['description'] ?? 'Kayıt durumunuzu öğrenmek için telefon numaranızı girin.';
        $site_key    = $s['recaptcha_site_key'] ?? '';
        $col1_label  = $s['result_col_1_label'] ?? 'Ad Soyad';
        $col2_label  = $s['result_col_2_label'] ?? 'Kayıt Durumu';

        ob_start();
        ?>
        <div class="hrcheck-wrapper">
            <div class="hrcheck-card">
                <div class="hrcheck-header">
                    <div class="hrcheck-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    </div>
                    <h2 class="hrcheck-title"><?php echo esc_html( $title ); ?></h2>
                    <p class="hrcheck-desc"><?php echo esc_html( $description ); ?></p>
                </div>

                <form class="hrcheck-form" id="hrcheck-form" novalidate>
                    <div class="hrcheck-field">
                        <label class="hrcheck-label" for="hrcheck-phone">Telefon Numarası</label>
                        <input type="tel" id="hrcheck-phone" name="phone"
                               class="hrcheck-input hrcheck-phone-input"
                               placeholder="05XX XXX XX XX"
                               maxlength="14"
                               inputmode="numeric"
                               required>
                        <span class="hrcheck-hint">Format: 05XX XXX XX XX</span>
                    </div>

                    <?php if ( $site_key ) : ?>
                    <div class="hrcheck-recaptcha">
                        <div class="g-recaptcha" data-sitekey="<?php echo esc_attr( $site_key ); ?>" data-theme="dark"></div>
                    </div>
                    <?php endif; ?>

                    <button type="submit" class="hrcheck-btn" id="hrcheck-submit" disabled>
                        <span class="hrcheck-btn-text">Sorgula</span>
                        <span class="hrcheck-btn-spinner" style="display:none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/></svg>
                        </span>
                    </button>
                </form>

                <!-- SONUÇ ALANI -->
                <div class="hrcheck-result" id="hrcheck-result" style="display:none;">
                    <div class="hrcheck-result-icon" id="hrcheck-result-icon"></div>
                    <div class="hrcheck-result-body">
                        <div class="hrcheck-result-row" id="hrcheck-row-1">
                            <span class="hrcheck-result-label" id="hrcheck-label-1"><?php echo esc_html( $col1_label ); ?></span>
                            <span class="hrcheck-result-value" id="hrcheck-val-1"></span>
                        </div>
                        <div class="hrcheck-result-row" id="hrcheck-row-2">
                            <span class="hrcheck-result-label" id="hrcheck-label-2"><?php echo esc_html( $col2_label ); ?></span>
                            <span class="hrcheck-result-value" id="hrcheck-val-2"></span>
                        </div>
                        <div class="hrcheck-result-row" id="hrcheck-row-3" style="display:none;">
                            <span class="hrcheck-result-label" id="hrcheck-label-3"></span>
                            <span class="hrcheck-result-value" id="hrcheck-val-3"></span>
                        </div>
                    </div>
                </div>

                <!-- HATA / BULUNAMADI -->
                <div class="hrcheck-message" id="hrcheck-message" style="display:none;"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}