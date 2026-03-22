<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class HRCheck_Admin {

    public function register() {
        add_action( 'admin_menu', array( $this, 'add_menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    public function add_menu() {
        add_options_page(
            'Kayıt Kontrol Ayarları',
            'Kayıt Kontrol',
            'manage_options',
            'hrcheck-settings',
            array( $this, 'settings_page' )
        );
    }

    public function register_settings() {
        register_setting( 'hrcheck_options', 'hrcheck_settings', array( $this, 'sanitize_settings' ) );

        add_settings_section( 'hrcheck_main', 'Google Sheets Ayarları', null, 'hrcheck-settings' );

        add_settings_field( 'data_source', 'Veri Kaynağı', array( $this, 'field_data_source' ), 'hrcheck-settings', 'hrcheck_main' );
        add_settings_field( 'apps_script_url', 'Apps Script Web App URL', array( $this, 'field_apps_script_url' ), 'hrcheck-settings', 'hrcheck_main' );
        add_settings_field( 'search_column', 'Sorgulama Sütunu', array( $this, 'field_search_column' ), 'hrcheck-settings', 'hrcheck_main' );
        add_settings_field( 'result_col_1', 'Sonuç Sütunu 1', array( $this, 'field_result_col_1' ), 'hrcheck-settings', 'hrcheck_main' );
        add_settings_field( 'result_col_1_label', 'Sonuç 1 Etiketi', array( $this, 'field_result_col_1_label' ), 'hrcheck-settings', 'hrcheck_main' );
        add_settings_field( 'result_col_2', 'Sonuç Sütunu 2', array( $this, 'field_result_col_2' ), 'hrcheck-settings', 'hrcheck_main' );
        add_settings_field( 'result_col_2_label', 'Sonuç 2 Etiketi', array( $this, 'field_result_col_2_label' ), 'hrcheck-settings', 'hrcheck_main' );

        add_settings_section( 'hrcheck_recaptcha', 'reCAPTCHA v2 Ayarları', null, 'hrcheck-settings' );

        add_settings_field( 'recaptcha_site_key', 'Site Key', array( $this, 'field_recaptcha_site_key' ), 'hrcheck-settings', 'hrcheck_recaptcha' );
        add_settings_field( 'recaptcha_secret_key', 'Secret Key', array( $this, 'field_recaptcha_secret_key' ), 'hrcheck-settings', 'hrcheck_recaptcha' );

        add_settings_section( 'hrcheck_texts', 'Metin Ayarları', null, 'hrcheck-settings' );

        add_settings_field( 'title', 'Form Başlığı', array( $this, 'field_title' ), 'hrcheck-settings', 'hrcheck_texts' );
        add_settings_field( 'description', 'Açıklama', array( $this, 'field_description' ), 'hrcheck-settings', 'hrcheck_texts' );
        add_settings_field( 'not_found_msg', 'Bulunamadı Mesajı', array( $this, 'field_not_found_msg' ), 'hrcheck-settings', 'hrcheck_texts' );
    }

    public function sanitize_settings( $input ) {
        $clean = array();
        $clean['data_source']        = sanitize_text_field( $input['data_source'] ?? 'sheets' );
        $clean['db_row_1']           = sanitize_text_field( $input['db_row_1'] ?? 'ad_soyad' );
        $clean['db_row_2']           = sanitize_text_field( $input['db_row_2'] ?? 'paket' );
        $clean['db_row_3']           = sanitize_text_field( $input['db_row_3'] ?? 'atolye' );
        $clean['apps_script_url']    = esc_url_raw( $input['apps_script_url'] ?? '' );
        $clean['search_column']      = strtoupper( preg_replace( '/[^A-Za-z]/', '', $input['search_column'] ?? 'A' ) );
        $clean['result_col_1']       = strtoupper( preg_replace( '/[^A-Za-z]/', '', $input['result_col_1'] ?? 'B' ) );
        $clean['result_col_1_label'] = sanitize_text_field( $input['result_col_1_label'] ?? '' );
        $clean['result_col_2']       = strtoupper( preg_replace( '/[^A-Za-z]/', '', $input['result_col_2'] ?? 'C' ) );
        $clean['result_col_2_label'] = sanitize_text_field( $input['result_col_2_label'] ?? '' );
        $clean['recaptcha_site_key']   = sanitize_text_field( $input['recaptcha_site_key'] ?? '' );
        $clean['recaptcha_secret_key'] = sanitize_text_field( $input['recaptcha_secret_key'] ?? '' );
        $clean['title']         = sanitize_text_field( $input['title'] ?? '' );
        $clean['description']   = sanitize_text_field( $input['description'] ?? '' );
        $clean['not_found_msg'] = sanitize_text_field( $input['not_found_msg'] ?? '' );
        return $clean;
    }

    // ── ALAN RENDER'LARI ──

    private function opt( $key, $default = '' ) {
        $s = get_option( 'hrcheck_settings', array() );
        return $s[ $key ] ?? $default;
    }

    public function field_apps_script_url() {
        $val = $this->opt( 'apps_script_url' );
        $ds  = $this->opt( 'data_source', 'sheets' );
        $style = $ds === 'local_db' ? 'display:none;' : '';
        echo '<div class="hrcheck-sheets-dependant" style="' . $style . '">';
        echo '<input type="url" name="hrcheck_settings[apps_script_url]" value="' . esc_attr( $val ) . '" class="regular-text" placeholder="https://script.google.com/macros/s/...">';
        echo '<p class="description">Google Sheets\'e bağlı Apps Script Web App URL\'si. Aşağıda kurulum rehberi var.</p>';
        echo '</div>';
    }

    public function field_data_source() {
        $val = $this->opt( 'data_source', 'sheets' );
        ?>
        <select name="hrcheck_settings[data_source]" id="hrcheck_data_source">
            <option value="sheets" <?php selected( $val, 'sheets' ); ?>>Google Sheets (Apps Script)</option>
            <option value="local_db" <?php selected( $val, 'local_db' ); ?>>Yerel Veritabanı (Kongre Kayıt)</option>
        </select>
        <p class="description">Verilerin nereden sorgulanacağını seçin. Yerel veritabanı daha hızlıdır.</p>
        
        <div class="hrcheck-db-settings" style="<?php echo $val !== 'local_db' ? 'display:none;' : ''; ?>margin-top:10px;padding:10px;background:#f0f6fc;border:1px solid #cce5ff;border-radius:4px;">
            <strong>Yerel Veritabanı Satır Ayarları</strong>
            <?php
            $options = array(
                'ad_soyad' => 'Ad Soyad',
                'paket'    => 'Paket Bilgisi',
                'atolye'   => 'Atölye Bilgileri (Bilimsel + Sosyal)',
                'durum'    => 'Genel Kayıt Durumu',
                'email'    => 'E-posta',
                'telefon'  => 'Telefon',
                'donem'    => 'Dönem',
            );
            
            for($i=1; $i<=3; $i++) {
                $k = 'db_row_' . $i;
                $v = $this->opt($k, $i==1 ? 'ad_soyad' : ($i==2 ? 'paket' : 'atolye'));
                
                echo '<div style="margin-top:8px;"><label style="display:inline-block;width:60px;">Satır '.$i.':</label>';
                echo '<select name="hrcheck_settings['.$k.']">';
                echo '<option value="">-- Gösterme --</option>';
                foreach($options as $ok => $ov) {
                    echo '<option value="'.$ok.'" '.selected($v, $ok, false).'>'.$ov.'</option>';
                }
                echo '</select></div>';
            }
            ?>
        </div>

        <script>
        jQuery(document).ready(function($){
            $('#hrcheck_data_source').change(function(){
                if($(this).val() === 'local_db') {
                    $('.hrcheck-sheets-dependant').hide();
                    $('.hrcheck-db-settings').show();
                } else {
                    $('.hrcheck-sheets-dependant').show();
                    $('.hrcheck-db-settings').hide();
                }
            });
        });
        </script>
        <?php
    }

    public function field_search_column() {
        $val = $this->opt( 'search_column', 'A' );
        echo '<input type="text" name="hrcheck_settings[search_column]" value="' . esc_attr( $val ) . '" class="small-text" maxlength="2" placeholder="A">';
        echo '<p class="description">Telefon numarasının aranacağı sütun harfi (ör: <code>A</code>)</p>';
    }

    public function field_result_col_1() {
        $val = $this->opt( 'result_col_1', 'B' );
        echo '<input type="text" name="hrcheck_settings[result_col_1]" value="' . esc_attr( $val ) . '" class="small-text" maxlength="2" placeholder="B">';
        echo '<p class="description">Kullanıcıya gösterilecek 1. bilgi sütunu (ör: <code>B</code>)</p>';
    }

    public function field_result_col_1_label() {
        $val = $this->opt( 'result_col_1_label', 'Ad Soyad' );
        echo '<input type="text" name="hrcheck_settings[result_col_1_label]" value="' . esc_attr( $val ) . '" class="regular-text" placeholder="Ad Soyad">';
    }

    public function field_result_col_2() {
        $val = $this->opt( 'result_col_2', 'C' );
        echo '<input type="text" name="hrcheck_settings[result_col_2]" value="' . esc_attr( $val ) . '" class="small-text" maxlength="2" placeholder="C">';
        echo '<p class="description">Kullanıcıya gösterilecek 2. bilgi sütunu (ör: <code>C</code>)</p>';
    }

    public function field_result_col_2_label() {
        $val = $this->opt( 'result_col_2_label', 'Kayıt Durumu' );
        echo '<input type="text" name="hrcheck_settings[result_col_2_label]" value="' . esc_attr( $val ) . '" class="regular-text" placeholder="Kayıt Durumu">';
    }

    public function field_recaptcha_site_key() {
        $val = $this->opt( 'recaptcha_site_key' );
        echo '<input type="text" name="hrcheck_settings[recaptcha_site_key]" value="' . esc_attr( $val ) . '" class="regular-text">';
        echo '<p class="description"><a href="https://www.google.com/recaptcha/admin" target="_blank">Google reCAPTCHA</a> panelinden v2 "I\'m not a robot" tipi anahtarlar oluştur.</p>';
    }

    public function field_recaptcha_secret_key() {
        $val = $this->opt( 'recaptcha_secret_key' );
        echo '<input type="text" name="hrcheck_settings[recaptcha_secret_key]" value="' . esc_attr( $val ) . '" class="regular-text">';
    }

    public function field_title() {
        $val = $this->opt( 'title', 'Kayıt Sorgula' );
        echo '<input type="text" name="hrcheck_settings[title]" value="' . esc_attr( $val ) . '" class="regular-text">';
    }

    public function field_description() {
        $val = $this->opt( 'description', 'Kayıt durumunuzu öğrenmek için telefon numaranızı girin.' );
        echo '<textarea name="hrcheck_settings[description]" class="large-text" rows="2">' . esc_textarea( $val ) . '</textarea>';
    }

    public function field_not_found_msg() {
        $val = $this->opt( 'not_found_msg', 'Bu telefon numarasına ait kayıt bulunamadı.' );
        echo '<input type="text" name="hrcheck_settings[not_found_msg]" value="' . esc_attr( $val ) . '" class="regular-text">';
    }

    // ── AYARLAR SAYFASI ──

    public function settings_page() {
        ?>
        <div class="wrap">
            <h1>Kayıt Kontrol Ayarları</h1>
            <form method="post" action="options.php">
                <?php
                    settings_fields( 'hrcheck_options' );
                    do_settings_sections( 'hrcheck-settings' );
                    submit_button( 'Ayarları Kaydet' );
                ?>
            </form>

            <hr>
            <h2>Kullanım</h2>
            <p>Herhangi bir sayfaya aşağıdaki shortcode'u ekleyin:</p>
            <code style="font-size:14px;padding:8px 14px;background:#f0f0f0;display:inline-block;border-radius:4px;">[kayit_kontrol]</code>

            <hr>
            <h2>Google Apps Script Kurulumu</h2>
            <div style="background:#f0f6ff;border-left:3px solid #2271b1;padding:16px;margin-top:10px;max-width:800px;">
                <ol>
                    <li>Google Sheets dosyasını aç</li>
                    <li><strong>Uzantılar → Apps Script</strong>'e tıkla</li>
                    <li>Mevcut kodu sil, aşağıdaki kodu yapıştır:</li>
                </ol>
<pre style="background:#fff;padding:12px;font-size:12px;overflow-x:auto;border:1px solid #ddd;border-radius:4px;">
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var phone = (e.parameter.phone || '').replace(/\D/g, '');
  var searchCol = e.parameter.searchCol || 'A';
  var resultCol1 = e.parameter.resultCol1 || 'B';
  var resultCol2 = e.parameter.resultCol2 || 'C';

  if (!phone) {
    return jsonResp({found: false, error: 'Telefon numarası gerekli.'});
  }

  var searchIdx = colToIndex(searchCol);
  var res1Idx = colToIndex(resultCol1);
  var res2Idx = colToIndex(resultCol2);

  var data = sheet.getDataRange().getValues();

  for (var i = 1; i &lt; data.length; i++) {
    var cellPhone = String(data[i][searchIdx] || '').replace(/\D/g, '');
    if (cellPhone === phone) {
      return jsonResp({
        found: true,
        result1: String(data[i][res1Idx] || ''),
        result2: String(data[i][res2Idx] || '')
      });
    }
  }

  return jsonResp({found: false});
}

function colToIndex(col) {
  col = col.toUpperCase();
  var idx = 0;
  for (var i = 0; i &lt; col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function jsonResp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
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
                <ol start="4">
                    <li><strong>Deploy → New Deployment → Web App</strong></li>
                    <li>"Who has access" → <strong>Anyone</strong> seç</li>
                    <li>Deploy et, verilen URL'yi yukarıdaki ayara yapıştır</li>
                </ol>
                <p><strong>Not:</strong> Bu script hem form plugin'in <code>doPost</code> (kayıt yazma) hem de bu plugin'in <code>doGet</code> (kayıt okuma) ihtiyacını tek başına karşılar. Mevcut form plugin'inizdeki Apps Script URL'sini de bu yeni deploy ile güncelleyin.</p>
            </div>
        </div>
        <?php
    }
}