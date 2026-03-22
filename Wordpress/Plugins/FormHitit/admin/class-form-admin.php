<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Hitit_Form_Admin {

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
        add_action( 'wp_ajax_hitit_form_save', array( $this, 'ajax_save_form' ) );
        add_action( 'wp_ajax_hitit_form_delete', array( $this, 'ajax_delete_form' ) );
        add_action( 'wp_ajax_hitit_form_delete_entry', array( $this, 'ajax_delete_entry' ) );
        add_action( 'wp_ajax_hitit_form_bulk_delete_entries', array( $this, 'ajax_bulk_delete_entries' ) );
        add_action( 'wp_ajax_hitit_form_export_csv', array( $this, 'export_csv' ) );
        add_action( 'wp_ajax_hitit_form_get_new_entries', array( $this, 'ajax_get_new_entries' ) );
    }

    public function add_menu() {
        add_menu_page(
            'Hitit Form Builder',
            'Hitit Formlar',
            'manage_options',
            'hitit-forms',
            array( $this, 'page_list' ),
            'dashicons-feedback',
            30
        );
        add_submenu_page( 'hitit-forms', 'Tüm Formlar', 'Tüm Formlar', 'manage_options', 'hitit-forms', array( $this, 'page_list' ) );
        add_submenu_page( 'hitit-forms', 'Yeni Form', 'Yeni Ekle', 'manage_options', 'hitit-form-edit', array( $this, 'page_edit' ) );
        add_submenu_page( 'hitit-forms', 'Gönderimler', 'Gönderimler', 'manage_options', 'hitit-form-entries', array( $this, 'page_entries' ) );
    }

    public function enqueue_assets( $hook ) {
        if ( strpos( $hook, 'hitit-form' ) === false ) return;

        wp_enqueue_style( 'hitit-form-admin', HITIT_FORM_URL . 'admin/css/form-admin.css', array(), HITIT_FORM_VERSION );
        wp_enqueue_script( 'hitit-form-admin', HITIT_FORM_URL . 'admin/js/form-admin.js', array( 'jquery', 'jquery-ui-sortable', 'jquery-ui-draggable', 'jquery-ui-droppable' ), HITIT_FORM_VERSION, true );
        wp_localize_script( 'hitit-form-admin', 'hititFormAdmin', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'hitit_form_admin' ),
        ));
    }

    // ──────────────────────────────────
    // FORM LİSTESİ SAYFASI
    // ──────────────────────────────────
    public function page_list() {
        $forms = Hitit_Form_DB::get_forms();
        ?>
        <div class="wrap hitit-admin-wrap">
            <h1 class="wp-heading-inline">Hitit Formlar</h1>
            <a href="<?php echo admin_url( 'admin.php?page=hitit-form-edit' ); ?>" class="page-title-action">Yeni Form</a>
            <hr class="wp-header-end">

            <?php if ( empty( $forms ) ) : ?>
                <div class="hitit-empty-state">
                    <span class="dashicons dashicons-feedback"></span>
                    <h2>Henüz form oluşturulmamış</h2>
                    <p>"Yeni Form" butonuna tıklayarak ilk formunu oluştur.</p>
                    <a href="<?php echo admin_url( 'admin.php?page=hitit-form-edit' ); ?>" class="button button-primary button-hero">İlk Formu Oluştur</a>
                </div>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width:50px">ID</th>
                            <th>Form Adı</th>
                            <th style="width:200px">Kısa Kod</th>
                            <th style="width:100px">Kayıtlar</th>
                            <th style="width:160px">Tarih</th>
                            <th style="width:180px">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $forms as $f ) :
                            $count = Hitit_Form_DB::count_entries( $f->id );
                        ?>
                        <tr>
                            <td><?php echo $f->id; ?></td>
                            <td><strong><a href="<?php echo admin_url( 'admin.php?page=hitit-form-edit&id=' . $f->id ); ?>"><?php echo esc_html( $f->title ); ?></a></strong></td>
                            <td><code>[hitit_form id="<?php echo $f->id; ?>"]</code></td>
                            <td><a href="<?php echo admin_url( 'admin.php?page=hitit-form-entries&form_id=' . $f->id ); ?>"><?php echo $count; ?> kayıt</a></td>
                            <td><?php echo date_i18n( 'd.m.Y H:i', strtotime( $f->created_at ) ); ?></td>
                            <td>
                                <a href="<?php echo admin_url( 'admin.php?page=hitit-form-edit&id=' . $f->id ); ?>" class="button button-small">Düzenle</a>
                                <a href="<?php echo admin_url( 'admin.php?page=hitit-form-entries&form_id=' . $f->id ); ?>" class="button button-small">Kayıtlar</a>
                                <button class="button button-small hitit-delete-form" data-id="<?php echo $f->id; ?>" style="color:#dc3232;">Sil</button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    // ──────────────────────────────────
    // FORM DÜZENLEME (BUILDER) SAYFASI
    // ──────────────────────────────────
    public function page_edit() {
        $form_id = intval( $_GET['id'] ?? 0 );
        $form = $form_id ? Hitit_Form_DB::get_form( $form_id ) : null;
        $title = $form ? $form->title : '';
        $fields = $form ? $form->fields : array();
        $settings = $form ? ( $form->settings ?: array() ) : array();
        $sheet_id = $form ? $form->google_sheet_id : '';
        ?>
        <div class="wrap hitit-admin-wrap">
            <h1><?php echo $form_id ? 'Formu Düzenle' : 'Yeni Form Oluştur'; ?></h1>

            <div class="hitit-builder-layout">
                <!-- Sol: Alan Paleti -->
                <div class="hitit-builder-sidebar">
                    <div class="hitit-panel">
                        <h3>Alanlar</h3>
                        <p class="description">Sürükleyerek forma ekle</p>
                        <div class="hitit-field-palette">
                            <div class="hitit-palette-item" data-type="text"><span class="dashicons dashicons-editor-textcolor"></span> Metin</div>
                            <div class="hitit-palette-item" data-type="email"><span class="dashicons dashicons-email"></span> E-posta</div>
                            <div class="hitit-palette-item" data-type="tel"><span class="dashicons dashicons-phone"></span> Telefon</div>
                            <div class="hitit-palette-item" data-type="number"><span class="dashicons dashicons-editor-ol"></span> Sayı</div>
                            <div class="hitit-palette-item" data-type="textarea"><span class="dashicons dashicons-editor-paragraph"></span> Uzun Metin</div>
                            <div class="hitit-palette-item" data-type="select"><span class="dashicons dashicons-arrow-down-alt2"></span> Açılır Menü</div>
                            <div class="hitit-palette-item" data-type="radio"><span class="dashicons dashicons-marker"></span> Tekli Seçim</div>
                            <div class="hitit-palette-item" data-type="checkbox"><span class="dashicons dashicons-yes-alt"></span> Çoklu Seçim</div>
                            <div class="hitit-palette-item" data-type="date"><span class="dashicons dashicons-calendar-alt"></span> Tarih</div>
                            <div class="hitit-palette-item" data-type="file"><span class="dashicons dashicons-media-default"></span> Dosya</div>
                            <div class="hitit-palette-item" data-type="heading"><span class="dashicons dashicons-heading"></span> Başlık</div>
                            <div class="hitit-palette-item" data-type="divider"><span class="dashicons dashicons-minus"></span> Ayırıcı</div>
                            <div class="hitit-palette-item" data-type="hidden"><span class="dashicons dashicons-hidden"></span> Gizli Alan</div>
                            <div class="hitit-palette-item" data-type="kongre_tercih"><span class="dashicons dashicons-sort"></span> Atölye Tercih</div>
                        </div>
                    </div>
                </div>

                <!-- Orta: Form Builder Alanı -->
                <div class="hitit-builder-main">
                    <div class="hitit-panel">
                        <div class="hitit-builder-topbar">
                            <input type="text" id="hitit-form-title" value="<?php echo esc_attr( $title ); ?>" placeholder="Form başlığı..." class="hitit-form-title-input">
                            <div class="hitit-builder-actions">
                                <?php if ( $form_id ) : ?>
                                    <span class="hitit-shortcode-badge">[hitit_form id="<?php echo $form_id; ?>"]</span>
                                <?php endif; ?>
                                <button id="hitit-save-form" class="button button-primary button-large">
                                    <span class="dashicons dashicons-saved" style="margin-top:4px;"></span> Kaydet
                                </button>
                            </div>
                        </div>

                        <div id="hitit-builder-canvas" class="hitit-builder-canvas" data-form-id="<?php echo $form_id; ?>">
                            <?php if ( empty( $fields ) ) : ?>
                                <div class="hitit-canvas-empty">
                                    <span class="dashicons dashicons-plus-alt2"></span>
                                    <p>Sol taraftan alanları sürükle veya tıkla</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- Sağ: Alan Ayarları & Form Ayarları -->
                <div class="hitit-builder-settings">
                    <!-- Alan Ayarları (alan seçilince görünür) -->
                    <div id="hitit-field-settings" class="hitit-panel" style="display:none;">
                        <h3>Alan Ayarları</h3>
                        <div class="hitit-settings-body">
                            <div class="hitit-setting-row">
                                <label>Etiket</label>
                                <input type="text" id="hfs-label" class="widefat">
                            </div>
                            <div class="hitit-setting-row">
                                <label>Alan Adı (name)</label>
                                <input type="text" id="hfs-name" class="widefat" pattern="[a-z0-9_]+">
                                <p class="description">Küçük harf, rakam ve _ kullan</p>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Placeholder</label>
                                <input type="text" id="hfs-placeholder" class="widefat">
                            </div>
                            <div class="hitit-setting-row">
                                <label>
                                    <input type="checkbox" id="hfs-required"> Zorunlu alan
                                </label>
                            </div>
                            <div class="hitit-setting-row hitit-unique-row" style="display:none;">
                                <label>
                                    <input type="checkbox" id="hfs-unique"> Benzersiz Değer
                                </label>
                                <p class="description">Bu alanın değeri forma daha önce girilmişse gönderime izin verilmez.</p>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Genişlik</label>
                                <select id="hfs-width" class="widefat">
                                    <option value="100">Tam genişlik</option>
                                    <option value="50">Yarım (50%)</option>
                                    <option value="33">Üçte bir (33%)</option>
                                </select>
                            </div>
                            <div class="hitit-setting-row hitit-options-row" style="display:none;">
                                <label>Seçenekler</label>
                                <div id="hfs-options-list"></div>
                                <button class="button button-small" id="hfs-add-option">+ Seçenek Ekle</button>
                            </div>
                            <div class="hitit-setting-row hitit-default-row" style="display:none;">
                                <label>Varsayılan Değer</label>
                                <input type="text" id="hfs-default" class="widefat">
                            </div>

                            <!-- DOSYA ALANI AYARLARI -->
                            <div class="hitit-setting-row hitit-file-settings-row" style="display:none;">
                                <label>İzin Verilen Dosya Türleri</label>
                                <input type="text" id="hfs-file-types" class="widefat" placeholder=".pdf,.doc,.docx,.jpg,.png">
                                <p class="description">Virgülle ayırarak uzantıları girin. Boş bırakılırsa tüm türler kabul edilir.</p>
                            </div>
                            <div class="hitit-setting-row hitit-file-settings-row" style="display:none;">
                                <label>Maksimum Dosya Boyutu (MB)</label>
                                <input type="number" id="hfs-file-max-size" class="widefat" placeholder="5" min="0.1" step="0.1">
                                <p class="description">Boş bırakılırsa sunucu limiti geçerlidir.</p>
                            </div>

                            <!-- SAYI ALANI AYARLARI -->
                            <div class="hitit-setting-row hitit-number-settings-row" style="display:none;">
                                <label>Minimum Değer</label>
                                <input type="number" id="hfs-number-min" class="widefat" placeholder="Boş = sınırsız">
                            </div>
                            <div class="hitit-setting-row hitit-number-settings-row" style="display:none;">
                                <label>Maksimum Değer</label>
                                <input type="number" id="hfs-number-max" class="widefat" placeholder="Boş = sınırsız">
                            </div>
                            <div class="hitit-setting-row hitit-number-settings-row" style="display:none;">
                                <label>Artış Miktarı (Step)</label>
                                <input type="number" id="hfs-number-step" class="widefat" placeholder="1" min="0.001" step="any">
                                <p class="description">Ondalık için 0.01, tam sayı için 1 girin.</p>
                            </div>

                            <!-- KONGRE TERCİH AYARLARI -->
                            <div class="hitit-setting-row hitit-kongre-tercih-row" style="display:none;">
                                <label>Atölye Türü</label>
                                <select id="hfs-kongre-tercih-type" class="widefat">
                                    <option value="bilimsel">Bilimsel Atölyeler</option>
                                    <option value="sosyal">Sosyal Atölyeler</option>
                                </select>
                                <p class="description">Kongre Kayıt eklentisindeki atölye türünü seç</p>
                            </div>

                            <!-- KOŞULLU MANTIK -->
                            <div class="hitit-setting-row hitit-conditions-section">
                                <h4>Koşullu Gösterim</h4>
                                <p class="description">Bu alan sadece koşullar sağlandığında gösterilir</p>
                                <div id="hfs-conditions-list"></div>
                                <button class="button button-small" id="hfs-add-condition">+ Koşul Ekle</button>
                            </div>
                        </div>
                    </div>

                    <!-- Form Genel Ayarları -->
                    <div class="hitit-panel">
                        <h3>Form Ayarları</h3>
                        <div class="hitit-settings-body">
                            <div class="hitit-setting-row">
                                <label>Gönder Butonu Yazısı</label>
                                <input type="text" id="hitit-setting-submit-text" class="widefat" value="<?php echo esc_attr( $settings['submit_text'] ?? 'Gönder' ); ?>">
                            </div>
                            <div class="hitit-setting-row">
                                <label>Başarı Mesajı</label>
                                <textarea id="hitit-setting-success-msg" class="widefat" rows="2"><?php echo esc_textarea( $settings['success_message'] ?? 'Formunuz başarıyla gönderildi!' ); ?></textarea>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Bildirim E-postası</label>
                                <input type="email" id="hitit-setting-notif-email" class="widefat" value="<?php echo esc_attr( $settings['notification_email'] ?? '' ); ?>" placeholder="admin@site.com">
                                <p class="description">Form gönderildiğinde bu adrese bildirim gider</p>
                            </div>
                            <hr style="margin:20px 0;border-top:1px solid #ddd;">
                            <div class="hitit-setting-row">
                                <label>Başlangıç Zamanı</label>
                                <input type="datetime-local" id="hitit-setting-start-time" class="widefat" value="<?php echo esc_attr( $form->start_time ? date( 'Y-m-d\TH:i', strtotime( $form->start_time ) ) : '' ); ?>">
                                <p class="description">Formun aktif olacağı tarih ve saat. Boş bırakılırsa hemen aktif olur.</p>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Bekleme Mesajı</label>
                                <textarea id="hitit-setting-wait-message" class="widefat" rows="2"><?php echo esc_textarea( $form->wait_message ?? 'Kayıtlar yakında başlayacaktır.' ); ?></textarea>
                                <p class="description">Form aktif olana kadar ziyaretçilere gösterilecek mesaj.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Google Sheets -->
                    <div class="hitit-panel">
                        <h3>Google Sheets</h3>
                        <div class="hitit-settings-body">
                            <div class="hitit-setting-row">
                                <label>Apps Script Web App URL</label>
                                <input type="url" id="hitit-setting-sheet-url" class="widefat" value="<?php echo esc_attr( $sheet_id ); ?>" placeholder="https://script.google.com/macros/s/...">
                                <p class="description">
                                    Google Sheets → Uzantılar → Apps Script → Web App URL'sini yapıştır.
                                    <a href="#" id="hitit-sheets-help-toggle">Nasıl yapılır?</a>
                                </p>
                                <div id="hitit-sheets-help" style="display:none;margin-top:10px;padding:12px;background:#f0f6ff;border-left:3px solid #2271b1;">
                                    <strong>Google Sheets Entegrasyonu:</strong>
                                    <ol style="margin:8px 0 0 16px;">
                                        <li>Google Sheets'te yeni bir tablo aç</li>
                                        <li><strong>Uzantılar → Apps Script</strong>'e tıkla</li>
                                        <li>Aşağıdaki kodu yapıştır ve kaydet:</li>
                                    </ol>
                                    <pre style="background:#fff;padding:8px;font-size:11px;margin:8px 0;overflow-x:auto;">function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) { sheet.appendRow(Object.keys(data)); }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = [];
  for (var i = 0; i &lt; headers.length; i++) { row.push(data[headers[i]] || ''); }
  Object.keys(data).forEach(function(key) {
    if (headers.indexOf(key) === -1) {
      headers.push(key); row.push(data[key]);
      sheet.getRange(1, headers.length).setValue(key);
    }
  });
  sheet.appendRow(row);
  return ContentService.createTextOutput(
    JSON.stringify({status:'ok'})
  ).setMimeType(ContentService.MimeType.JSON);
}</pre>
                                    <ol start="4" style="margin:0 0 0 16px;">
                                        <li><strong>Deploy → New Deployment → Web App</strong></li>
                                        <li>"Who has access" → <strong>Anyone</strong> seç</li>
                                        <li>Deploy et, verilen URL'yi yukarıya yapıştır</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Görünüm Ayarları -->
                    <div class="hitit-panel">
                        <h3>Görünüm Ayarları</h3>
                        <div class="hitit-settings-body">
                            <div class="hitit-setting-row">
                                <label>Font Ailesi</label>
                                <select id="hitit-style-font" class="widefat">
                                    <option value="" <?php selected( $settings['style_font'] ?? '', '' ); ?>>Varsayılan (Inter)</option>
                                    <option value="'Inter', sans-serif" <?php selected( $settings['style_font'] ?? '', "'Inter', sans-serif" ); ?>>Inter</option>
                                    <option value="'Poppins', sans-serif" <?php selected( $settings['style_font'] ?? '', "'Poppins', sans-serif" ); ?>>Poppins</option>
                                    <option value="'Roboto', sans-serif" <?php selected( $settings['style_font'] ?? '', "'Roboto', sans-serif" ); ?>>Roboto</option>
                                    <option value="'Open Sans', sans-serif" <?php selected( $settings['style_font'] ?? '', "'Open Sans', sans-serif" ); ?>>Open Sans</option>
                                    <option value="'Nunito', sans-serif" <?php selected( $settings['style_font'] ?? '', "'Nunito', sans-serif" ); ?>>Nunito</option>
                                    <option value="'Lato', sans-serif" <?php selected( $settings['style_font'] ?? '', "'Lato', sans-serif" ); ?>>Lato</option>
                                    <option value="'Montserrat', sans-serif" <?php selected( $settings['style_font'] ?? '', "'Montserrat', sans-serif" ); ?>>Montserrat</option>
                                    <option value="Georgia, serif" <?php selected( $settings['style_font'] ?? '', 'Georgia, serif' ); ?>>Georgia (Serif)</option>
                                </select>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Form Maks. Genişlik (px)</label>
                                <input type="number" id="hitit-style-max-width" class="widefat" value="<?php echo esc_attr( $settings['style_max_width'] ?? '700' ); ?>" min="300" max="1200" step="10">
                            </div>
                            <div class="hitit-setting-row">
                                <label>Form Arkaplan Rengi</label>
                                <input type="color" id="hitit-style-bg" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_bg'] ?? '#0a0a0a' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-bg" value="<?php echo esc_attr( $settings['style_bg'] ?? '#0a0a0a' ); ?>" placeholder="#0a0a0a" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-bg" data-default="#0a0a0a" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Etiket (Label) Rengi</label>
                                <input type="color" id="hitit-style-label-color" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_label_color'] ?? '#d4d4d4' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-label-color" value="<?php echo esc_attr( $settings['style_label_color'] ?? '#d4d4d4' ); ?>" placeholder="#d4d4d4" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-label-color" data-default="#d4d4d4" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Input Kenarlık Rengi</label>
                                <input type="color" id="hitit-style-border-color" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_border_color'] ?? '#262626' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-border-color" value="<?php echo esc_attr( $settings['style_border_color'] ?? '#262626' ); ?>" placeholder="#262626" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-border-color" data-default="#262626" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Odaklanma (Focus) Rengi</label>
                                <input type="color" id="hitit-style-focus-color" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_focus_color'] ?? '#166534' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-focus-color" value="<?php echo esc_attr( $settings['style_focus_color'] ?? '#166534' ); ?>" placeholder="#166534" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-focus-color" data-default="#166534" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Input Yazı Rengi</label>
                                <input type="color" id="hitit-style-input-color" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_input_color'] ?? '#e5e5e5' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-input-color" value="<?php echo esc_attr( $settings['style_input_color'] ?? '#e5e5e5' ); ?>" placeholder="#e5e5e5" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-input-color" data-default="#e5e5e5" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Buton Arkaplan Rengi</label>
                                <input type="color" id="hitit-style-btn-bg" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_btn_bg'] ?? '#166534' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-btn-bg" value="<?php echo esc_attr( $settings['style_btn_bg'] ?? '#166534' ); ?>" placeholder="#166534" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-btn-bg" data-default="#166534" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Buton Yazı Rengi</label>
                                <input type="color" id="hitit-style-btn-color" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_btn_color'] ?? '#ffffff' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-btn-color" value="<?php echo esc_attr( $settings['style-btn-color'] ?? '#ffffff' ); ?>" placeholder="#ffffff" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-btn-color" data-default="#ffffff" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Buton Hover Rengi</label>
                                <input type="color" id="hitit-style-btn-hover" class="hitit-color-picker" value="<?php echo esc_attr( $settings['style_btn_hover'] ?? '#15803d' ); ?>">
                                <input type="text" class="hitit-color-text" data-target="hitit-style-btn-hover" value="<?php echo esc_attr( $settings['style_btn_hover'] ?? '#15803d' ); ?>" placeholder="#15803d" size="8">
                                <button class="button button-small hitit-color-reset" data-target="hitit-style-btn-hover" data-default="#15803d" title="Sıfırla">↺</button>
                            </div>
                            <div class="hitit-setting-row">
                                <label>Kenarlık Yuvarlaklığı (px)</label>
                                <input type="range" id="hitit-style-radius" min="0" max="20" step="1" value="<?php echo esc_attr( $settings['style_radius'] ?? '0' ); ?>">
                                <span id="hitit-style-radius-val"><?php echo esc_attr( $settings['style_radius'] ?? '0' ); ?>px</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mevcut alanları JSON olarak JS'e aktar -->
        <script>
            var hititFormFields = <?php echo wp_json_encode( $fields, JSON_UNESCAPED_UNICODE ); ?>;
        </script>
        <?php
    }

    // ──────────────────────────────────
    // GÖNDERİMLER SAYFASI
    // ──────────────────────────────────
    public function page_entries() {
        $form_id = intval( $_GET['form_id'] ?? 0 );

        if ( ! $form_id ) {
            $forms = Hitit_Form_DB::get_forms();
            ?>
            <div class="wrap hitit-admin-wrap">
                <h1>Gönderimler</h1>
                <p>Hangi formun gönderimlerini görmek istiyorsun?</p>
                <ul>
                    <?php foreach ( $forms as $f ) : ?>
                        <li><a href="<?php echo admin_url( 'admin.php?page=hitit-form-entries&form_id=' . $f->id ); ?>"><?php echo esc_html( $f->title ); ?> (<?php echo Hitit_Form_DB::count_entries( $f->id ); ?> kayıt)</a></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php
            return;
        }

        $form = Hitit_Form_DB::get_form( $form_id );
        if ( ! $form ) {
            echo '<div class="wrap"><h1>Form bulunamadı.</h1></div>';
            return;
        }

        $page = max( 1, intval( $_GET['paged'] ?? 1 ) );
        $per_page = 20;
        $offset = ( $page - 1 ) * $per_page;
        $total = Hitit_Form_DB::count_entries( $form_id );
        $entries = Hitit_Form_DB::get_entries( $form_id, $per_page, $offset );

        // Tüm alan etiketlerini topla (tablo başlıkları için)
        $columns = array();
        foreach ( $form->fields as $field ) {
            if ( in_array( $field['type'] ?? '', array( 'heading', 'divider', 'html' ), true ) ) continue;
            if ( ! empty( $field['label'] ) ) $columns[] = $field['label'];
        }
        ?>
        <div class="wrap hitit-admin-wrap">
            <h1>
                <?php echo esc_html( $form->title ); ?> – Gönderimler
                <span class="hitit-entry-count">(<?php echo $total; ?> kayıt)</span>
            </h1>

            <div style="margin-bottom:10px;">
                <a href="<?php echo admin_url( 'admin.php?page=hitit-form-edit&id=' . $form_id ); ?>" class="button">← Formu Düzenle</a>
                <button class="button" id="hitit-live-toggle" data-form-id="<?php echo $form_id; ?>" data-active="0">
                    <span class="dashicons dashicons-update" style="margin-top:4px;"></span> <span id="hitit-live-text">Canlı İzleme (Kapalı)</span>
                </button>
                <?php if ( $total > 0 ) : ?>
                    <a href="<?php echo wp_nonce_url( admin_url( 'admin-ajax.php?action=hitit_form_export_csv&form_id=' . $form_id ), 'hitit_form_admin' ); ?>" class="button">CSV İndir</a>
                    <button id="hitit-bulk-delete-entries" class="button" style="color:#dc3232;display:none;">
                        <span class="dashicons dashicons-trash" style="margin-top:4px;"></span> Seçilenleri Sil (<span id="hitit-bulk-count">0</span>)
                    </button>
                <?php endif; ?>
            </div>

            <?php if ( empty( $entries ) ) : ?>
                <p>Henüz gönderim yok.</p>
            <?php else : ?>
                <div class="hitit-entries-table-wrapper">
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th style="width:35px;"><input type="checkbox" id="hitit-select-all-entries"></th>
                                <th style="width:50px">#</th>
                                <?php foreach ( $columns as $col ) : ?>
                                    <th><?php echo esc_html( wp_strip_all_tags( $col ) ); ?></th>
                                <?php endforeach; ?>
                                <th style="width:130px">Tarih</th>
                                <th style="width:60px">Sil</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ( $entries as $entry ) : ?>
                            <tr>
                                <td><input type="checkbox" class="hitit-entry-cb" value="<?php echo $entry->id; ?>"></td>
                                <td><?php echo $entry->id; ?></td>
                                <?php foreach ( $columns as $col ) :
                                    $cell_value = $entry->data[ $col ] ?? '—';
                                    // URL ise tıklanabilir link yap (dosya yüklemeleri vs.)
                                    if ( $cell_value && $cell_value !== '—' && filter_var( $cell_value, FILTER_VALIDATE_URL ) ) :
                                        $file_ext = strtolower( pathinfo( parse_url( $cell_value, PHP_URL_PATH ), PATHINFO_EXTENSION ) );
                                        $is_image = in_array( $file_ext, array( 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg' ), true );
                                    ?>
                                        <td>
                                            <a href="<?php echo esc_url( $cell_value ); ?>" target="_blank" rel="noopener" title="<?php echo esc_attr( $cell_value ); ?>">
                                                <?php if ( $is_image ) : ?>
                                                    <img src="<?php echo esc_url( $cell_value ); ?>" style="max-width:60px;max-height:40px;vertical-align:middle;border-radius:3px;margin-right:4px;">
                                                <?php endif; ?>
                                                <?php echo esc_html( basename( parse_url( $cell_value, PHP_URL_PATH ) ) ); ?>
                                            </a>
                                        </td>
                                    <?php else : ?>
                                        <td><?php echo esc_html( $cell_value ); ?></td>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                                <td><?php echo date_i18n( 'd.m.Y H:i', strtotime( $entry->created_at ) ); ?></td>
                                <td><button class="button button-small hitit-delete-entry" data-id="<?php echo $entry->id; ?>" style="color:#dc3232;">Sil</button></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <?php
                $total_pages = ceil( $total / $per_page );
                if ( $total_pages > 1 ) {
                    echo '<div class="tablenav"><div class="tablenav-pages">';
                    echo paginate_links( array(
                        'base'    => add_query_arg( 'paged', '%#%' ),
                        'format'  => '',
                        'current' => $page,
                        'total'   => $total_pages,
                    ));
                    echo '</div></div>';
                }
                ?>
            <?php endif; ?>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            var liveInterval;
            var lastId = <?php echo ! empty( $entries ) ? intval( $entries[0]->id ) : 0; ?>;
            var formId = <?php echo intval( $form_id ); ?>;
            var nonce = '<?php echo wp_create_nonce( "hitit_form_admin" ); ?>';
            var isLiveUrl = window.location.search.indexOf('live=1') !== -1;
            
            $('#hitit-live-toggle').on('click', function(e) {
                e.preventDefault();
                var $btn = $(this);
                var isActive = $btn.data('active') == '1';
                
                if (isActive) {
                    clearInterval(liveInterval);
                    $btn.data('active', '0');
                    $('#hitit-live-text').text('Canlı İzleme (Kapalı)');
                    $btn.removeClass('button-primary');
                    
                    if (isLiveUrl && window.history.replaceState) {
                        var url = new URL(window.location.href);
                        url.searchParams.delete('live');
                        window.history.replaceState({}, '', url.toString());
                        isLiveUrl = false;
                    }
                } else {
                    $btn.data('active', '1');
                    $('#hitit-live-text').text('Canlı İzleme (Açık)');
                    $btn.addClass('button-primary');
                    
                    if (!isLiveUrl && window.history.replaceState) {
                        var url = new URL(window.location.href);
                        url.searchParams.set('live', '1');
                        window.history.replaceState({}, '', url.toString());
                        isLiveUrl = true;
                    }
                    
                    liveInterval = setInterval(function() {
                        $.post(ajaxurl, {
                            action: 'hitit_form_get_new_entries',
                            form_id: formId,
                            last_id: lastId,
                            nonce: nonce
                        }, function(res) {
                            if (res.success && res.data.count > 0) {
                                lastId = res.data.last_id;
                                
                                if ($('.wp-list-table tbody').length === 0) {
                                    window.location.reload();
                                    return;
                                }
                                
                                var $tbody = $('.wp-list-table tbody');
                                var $newRows = $(res.data.html).hide();
                                $tbody.prepend($newRows);
                                $newRows.fadeIn(800);
                                
                                setTimeout(function() {
                                    $newRows.css('background-color', '');
                                }, 3000);
                                
                                var $countSpan = $('.hitit-entry-count');
                                var currentCount = parseInt($countSpan.text().replace(/[^0-9]/g, '')) || 0;
                                $countSpan.text('(' + (currentCount + res.data.count) + ' kayıt)');
                            }
                        });
                    }, 5000);
                }
            });
            
            if (isLiveUrl) {
                setTimeout(function(){ $('#hitit-live-toggle').click(); }, 300);
            }
        });
        </script>
        <?php
    }

    // ──────────────────────────────────
    // AJAX İŞLEMLERİ
    // ──────────────────────────────────
    public function ajax_save_form() {
        // contentType: application/json ile gönderildiğinde $_POST boş kalır,
        // nonce URL parametresi olarak gelir → $_GET'ten kontrol et
        if ( ! isset( $_GET['nonce'] ) || ! wp_verify_nonce( $_GET['nonce'], 'hitit_form_admin' ) ) {
            wp_send_json_error( 'Güvenlik doğrulaması başarısız.' );
        }
        if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( 'Yetki yok.' );

        $raw = file_get_contents( 'php://input' );
        $data = json_decode( $raw, true );

        if ( empty( $data['title'] ) ) {
            wp_send_json_error( 'Form başlığı zorunludur.' );
        }

        $form_id = Hitit_Form_DB::save_form( $data );
        wp_send_json_success( array( 'id' => $form_id, 'message' => 'Form kaydedildi!' ) );
    }

    public function ajax_delete_form() {
        check_ajax_referer( 'hitit_form_admin', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( 'Yetki yok.' );

        $id = intval( $_POST['id'] ?? 0 );
        if ( $id ) Hitit_Form_DB::delete_form( $id );
        wp_send_json_success();
    }

    public function ajax_delete_entry() {
        check_ajax_referer( 'hitit_form_admin', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( 'Yetki yok.' );

        $id = intval( $_POST['id'] ?? 0 );
        if ( $id ) Hitit_Form_DB::delete_entry( $id );
        wp_send_json_success();
    }

    public function ajax_bulk_delete_entries() {
        check_ajax_referer( 'hitit_form_admin', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( 'Yetki yok.' );

        $ids = isset( $_POST['ids'] ) ? array_map( 'intval', (array) $_POST['ids'] ) : array();
        $ids = array_filter( $ids );

        if ( empty( $ids ) ) {
            wp_send_json_error( 'Silinecek kayıt seçilmedi.' );
        }

        $deleted = Hitit_Form_DB::bulk_delete_entries( $ids );
        wp_send_json_success( array( 'deleted' => $deleted ) );
    }

    public function export_csv() {
        check_admin_referer( 'hitit_form_admin' );
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Yetki yok.' );

        $form_id = intval( $_GET['form_id'] ?? 0 );
        $form = Hitit_Form_DB::get_form( $form_id );
        if ( ! $form ) wp_die( 'Form bulunamadı.' );

        $entries = Hitit_Form_DB::get_entries( $form_id, 99999 );

        $columns = array();
        foreach ( $form->fields as $field ) {
            if ( in_array( $field['type'] ?? '', array( 'heading', 'divider', 'html' ), true ) ) continue;
            if ( ! empty( $field['label'] ) ) $columns[] = wp_strip_all_tags( $field['label'] );
        }

        $filename = sanitize_file_name( $form->title ) . '-' . date( 'Y-m-d' ) . '.csv';
        header( 'Content-Type: text/csv; charset=UTF-8' );
        header( 'Content-Disposition: attachment; filename=' . $filename );
        echo "\xEF\xBB\xBF"; // UTF-8 BOM

        $out = fopen( 'php://output', 'w' );
        fputcsv( $out, array_merge( array( 'ID', 'Tarih' ), $columns ) );

        foreach ( $entries as $entry ) {
            $row = array( $entry->id, $entry->created_at );
            foreach ( $columns as $col ) {
                $row[] = $entry->data[ $col ] ?? '';
            }
            fputcsv( $out, $row );
        }

        fclose( $out );
        exit;
    }

    public function ajax_get_new_entries() {
        check_ajax_referer( 'hitit_form_admin', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( 'Yetkisiz erişim.' );

        $form_id = intval( $_POST['form_id'] ?? 0 );
        $last_id = intval( $_POST['last_id'] ?? 0 );
        $entries = Hitit_Form_DB::get_entries_after( $form_id, $last_id, 50 );

        if ( empty( $entries ) ) {
            wp_send_json_success( array( 'html' => '', 'count' => 0 ) );
        }

        $form = Hitit_Form_DB::get_form( $form_id );
        if ( ! $form ) wp_send_json_error( 'Form bulunamadı.' );

        $columns = array();
        foreach ( $form->fields as $field ) {
            if ( in_array( $field['type'] ?? '', array( 'heading', 'divider', 'html' ), true ) ) continue;
            if ( ! empty( $field['label'] ) ) $columns[] = $field['label'];
        }

        ob_start();
        foreach ( $entries as $entry_obj ) {
            $data = is_array( $entry_obj->data ) ? $entry_obj->data : array();
            
            ?>
            <tr style="background-color: #f1fef1; transition: background-color 2s;">
                <td><input type="checkbox" class="hitit-entry-cb" value="<?php echo $entry_obj->id; ?>"></td>
                <td><?php echo $entry_obj->id; ?></td>
                <?php foreach ( $columns as $col ) :
                    $cell_value = $data[ $col ] ?? '—';
                    if ( $cell_value && $cell_value !== '—' && filter_var( $cell_value, FILTER_VALIDATE_URL ) ) :
                        $file_ext = strtolower( pathinfo( parse_url( $cell_value, PHP_URL_PATH ), PATHINFO_EXTENSION ) );
                        $is_image = in_array( $file_ext, array( 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg' ), true );
                    ?>
                        <td>
                            <a href="<?php echo esc_url( $cell_value ); ?>" target="_blank" rel="noopener" title="<?php echo esc_attr( $cell_value ); ?>">
                                <?php if ( $is_image ) : ?>
                                    <img src="<?php echo esc_url( $cell_value ); ?>" style="max-width:60px;max-height:40px;vertical-align:middle;border-radius:3px;margin-right:4px;">
                                <?php endif; ?>
                                <?php echo esc_html( basename( parse_url( $cell_value, PHP_URL_PATH ) ) ); ?>
                            </a>
                        </td>
                    <?php else : ?>
                        <td><?php echo esc_html( $cell_value ); ?></td>
                    <?php endif; ?>
                <?php endforeach; ?>
                <td><?php echo date_i18n( 'd.m.Y H:i', strtotime( $entry_obj->created_at ) ); ?></td>
                <td><button class="button button-small hitit-delete-entry" data-id="<?php echo $entry_obj->id; ?>" style="color:#dc3232;">Sil</button></td>
            </tr>
            <?php
        }
        $html = ob_get_clean();

        wp_send_json_success( array( 
            'html' => $html, 
            'count' => count( $entries ),
            'last_id' => $entries[0]->id
        ) );
    }
}

new Hitit_Form_Admin();
