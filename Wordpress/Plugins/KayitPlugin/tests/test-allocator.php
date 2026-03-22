#!/usr/bin/env php
<?php
/**
 * Kongre Allocator — Bağımsız Test Scripti
 * 
 * WordPress ortamı gerekmez. Mock objeler ile allocator mantığını test eder.
 * 
 * Kullanım: php tests/test-allocator.php
 * 
 * Test senaryoları:
 *  1. İlk tercih — boş atölyelere normal yerleştirme
 *  2. İlk tercih dolu → 2. tercihe geçiş
 *  3. Sabah dolu → akşama geçiş
 *  4. Çift oturumlu bilimsel atölye (6 numara)
 *  5. Çift oturumlu → sosyal atanamaz
 *  6. Bilimsel sabah → sosyal akşam (ters oturum)
 *  7. Bilimsel akşam → sosyal sabah
 *  8. Tüm tercihler dolu → fallback (en boş atölye)
 *  9. Kontenjan sınırı (race condition simülasyonu)
 * 10. Boş tercih listesi
 * 11. Geçersiz atölye numarası
 * 12. Tüm atölyeler dolu → null dönüş
 * 13. Fallback — çift oturuma son çare
 * 14. 100 katılımcı stres testi
 */

// ═══════════════════════════════════════════════════════════════════════════════
//  MOCK ORTAM — WordPress fonksiyonlarını simüle et
// ═══════════════════════════════════════════════════════════════════════════════

define( 'ABSPATH', '/tmp/fake-wp/' );

// WP_Error mock
if ( ! class_exists( 'WP_Error' ) ) {
    class WP_Error {
        public $code;
        public $message;
        public function __construct( $code = '', $message = '' ) {
            $this->code    = $code;
            $this->message = $message;
        }
        public function get_error_message() { return $this->message; }
        public function get_error_code()    { return $this->code; }
    }
}

function is_wp_error( $thing ) {
    return $thing instanceof WP_Error;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MOCK $wpdb
// ═══════════════════════════════════════════════════════════════════════════════

class Mock_WPDB {
    public $prefix = 'wp_';
    public $queries = array();
    public $mock_results = array();
    public $updates = array();
    private $in_transaction = false;

    public function query( $sql ) {
        $this->queries[] = $sql;
        if ( stripos( $sql, 'START TRANSACTION' ) !== false ) {
            $this->in_transaction = true;
        }
        if ( stripos( $sql, 'COMMIT' ) !== false || stripos( $sql, 'ROLLBACK' ) !== false ) {
            $this->in_transaction = false;
        }
        // UPDATE dolu = dolu + 1 yakalama
        if ( preg_match( '/UPDATE.*SET dolu = dolu \+ 1 WHERE id = (\d+)/i', $sql, $m ) ) {
            $this->updates[] = (int) $m[1];
        }
        return true;
    }

    public function get_results( $sql ) {
        $this->queries[] = $sql;
        return $this->mock_results;
    }

    public function prepare( $sql, ...$args ) {
        $result = $sql;
        foreach ( $args as $arg ) {
            $pos = strpos( $result, '%d' );
            if ( $pos === false ) $pos = strpos( $result, '%s' );
            if ( $pos !== false ) {
                $result = substr_replace( $result, (string) $arg, $pos, 2 );
            }
        }
        return $result;
    }

    public function reset() {
        $this->queries = array();
        $this->updates = array();
        $this->mock_results = array();
        $this->in_transaction = false;
    }
}

$wpdb = new Mock_WPDB();

// ═══════════════════════════════════════════════════════════════════════════════
//  MOCK Kongre_DB
// ═══════════════════════════════════════════════════════════════════════════════

class Kongre_DB {
    public static function table_atolyeler() {
        global $wpdb;
        return $wpdb->prefix . 'kongre_atolyeler';
    }

    public static function get_all_atolyeler( $tur = null, $only_active = true ) {
        global $wpdb;
        return $wpdb->mock_results;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Allocator'ı Yükle
// ═══════════════════════════════════════════════════════════════════════════════

require_once __DIR__ . '/../includes/class-kongre-allocator.php';

// ═══════════════════════════════════════════════════════════════════════════════
//  YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════════════════════

// Renk sabitleri
define( 'CLR_GREEN',  "\033[32m" );
define( 'CLR_RED',    "\033[31m" );
define( 'CLR_YELLOW', "\033[33m" );
define( 'CLR_CYAN',   "\033[36m" );
define( 'CLR_BOLD',   "\033[1m" );
define( 'CLR_RESET',  "\033[0m" );

$test_count  = 0;
$pass_count  = 0;
$fail_count  = 0;
$fail_details = array();

function make_atolye_row( $id, $tur, $no, $oturum, $kontenjan, $dolu, $adi = '' ) {
    $row = new stdClass();
    $row->id        = $id;
    $row->tur       = $tur;
    $row->atolye_no = $no;
    $row->oturum    = $oturum;
    $row->kontenjan = $kontenjan;
    $row->dolu      = $dolu;
    $row->aktif     = 1;
    $row->atolye_adi = $adi ?: ucfirst( $tur ) . " Atölye $no";
    return $row;
}

/**
 * Gerçekçi tam atölye seti oluştur (Python yerlestirme26.py ile birebir aynı yapı)
 * 11 bilimsel (6 numara çift oturum), 10 sosyal
 */
function build_full_atolye_set( $overrides = array() ) {
    $rows = array();
    $id = 1;

    // Bilimsel: 1-5, 7-11 → sabah + akşam (her biri 16 kont)
    // Bilimsel 6 → sabah+aksam (32 kont)
    for ( $no = 1; $no <= 11; $no++ ) {
        if ( $no === 6 ) {
            $kont = isset( $overrides["b{$no}_kont"] ) ? $overrides["b{$no}_kont"] : 32;
            $dolu = isset( $overrides["b{$no}_dolu"] ) ? $overrides["b{$no}_dolu"] : 0;
            $rows[] = make_atolye_row( $id++, 'bilimsel', $no, 'sabah+aksam', $kont, $dolu, "Bilimsel Atölye $no (Çift Oturum)" );
        } else {
            foreach ( array( 'sabah', 'aksam' ) as $o ) {
                $key_kont = "b{$no}_{$o}_kont";
                $key_dolu = "b{$no}_{$o}_dolu";
                $kont = isset( $overrides[ $key_kont ] ) ? $overrides[ $key_kont ] : 16;
                $dolu = isset( $overrides[ $key_dolu ] ) ? $overrides[ $key_dolu ] : 0;
                $rows[] = make_atolye_row( $id++, 'bilimsel', $no, $o, $kont, $dolu );
            }
        }
    }

    // Sosyal: 1-10 → sabah + akşam (her biri 16 kont)
    for ( $no = 1; $no <= 10; $no++ ) {
        foreach ( array( 'sabah', 'aksam' ) as $o ) {
            $key_kont = "s{$no}_{$o}_kont";
            $key_dolu = "s{$no}_{$o}_dolu";
            $kont = isset( $overrides[ $key_kont ] ) ? $overrides[ $key_kont ] : 16;
            $dolu = isset( $overrides[ $key_dolu ] ) ? $overrides[ $key_dolu ] : 0;
            $rows[] = make_atolye_row( $id++, 'sosyal', $no, $o, $kont, $dolu );
        }
    }

    return $rows;
}

function assert_true( $cond, $msg ) {
    global $test_count, $pass_count, $fail_count, $fail_details;
    $test_count++;
    if ( $cond ) {
        $pass_count++;
        echo CLR_GREEN . "    ✓ " . CLR_RESET . "$msg\n";
    } else {
        $fail_count++;
        $fail_details[] = $msg;
        echo CLR_RED . "    ✗ " . CLR_RESET . "$msg\n";
    }
}

function assert_eq( $expected, $actual, $msg ) {
    global $test_count, $pass_count, $fail_count, $fail_details;
    $test_count++;
    if ( $expected === $actual ) {
        $pass_count++;
        echo CLR_GREEN . "    ✓ " . CLR_RESET . "$msg\n";
    } else {
        $fail_count++;
        $detail = "$msg — beklenen: " . var_export( $expected, true ) . ", gelen: " . var_export( $actual, true );
        $fail_details[] = $detail;
        echo CLR_RED . "    ✗ " . CLR_RESET . "$detail\n";
    }
}

function section( $title ) {
    echo "\n" . CLR_BOLD . CLR_CYAN . "━━━ $title ━━━" . CLR_RESET . "\n";
}

// ═══════════════════════════════════════════════════════════════════════════════
//  T E S T L E R
// ═══════════════════════════════════════════════════════════════════════════════

echo CLR_BOLD . "\n╔══════════════════════════════════════════════════════════════╗" . CLR_RESET;
echo CLR_BOLD . "\n║       KONGRE ALLOCATOR — YERLEŞTİRME ALGORİTMASI TESTİ     ║" . CLR_RESET;
echo CLR_BOLD . "\n╚══════════════════════════════════════════════════════════════╝\n" . CLR_RESET;


// ─── TEST 1: İlk tercih boş — normal yerleştirme ────────────────────────────
section( 'TEST 1: İlk tercih boş → normal yerleştirme' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    $result = Kongre_Allocator::yerlestir( array( 3, 5, 7 ), array( 2, 4, 8 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_eq( 3, $result['bilimsel']['atolye_no'], 'Bilimsel: 1. tercih (atölye 3) yerleşmeli' );
    assert_eq( 'sabah', $result['bilimsel']['oturum'], 'Bilimsel: sabah oturumuna yerleşmeli (ilk boş)' );
    assert_eq( false, $result['bilimsel']['fallback'], 'Bilimsel: fallback olmamalı' );
    assert_eq( 1, $result['bilimsel']['tercih_sirasi'], 'Bilimsel: tercih sırası 1 olmalı' );

    // Sosyal: bilimsel sabahsa → sosyal akşam
    assert_eq( 2, $result['sosyal']['atolye_no'], 'Sosyal: 1. tercih (atölye 2) yerleşmeli' );
    assert_eq( 'aksam', $result['sosyal']['oturum'], 'Sosyal: akşam oturumuna yerleşmeli (bilimsel sabah → sosyal akşam)' );
    assert_eq( false, $result['sosyal']['fallback'], 'Sosyal: fallback olmamalı' );
}


// ─── TEST 2: İlk tercih dolu → 2. tercihe geçiş ────────────────────────────
section( 'TEST 2: İlk tercih tamamen dolu → 2. tercihe kayma' );
{
    $wpdb->reset();
    // Bilimsel 3 tamamen dolu (sabah=16, akşam=16)
    $wpdb->mock_results = build_full_atolye_set( array(
        'b3_sabah_dolu' => 16,
        'b3_aksam_dolu' => 16,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 3, 5, 7 ), array( 2 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_eq( 5, $result['bilimsel']['atolye_no'], 'Bilimsel: 2. tercihe (atölye 5) kaydı' );
    assert_eq( 2, $result['bilimsel']['tercih_sirasi'], 'Bilimsel: tercih sırası 2 olmalı' );
    assert_eq( false, $result['bilimsel']['fallback'], 'Bilimsel: fallback değil, 2. tercih' );
}


// ─── TEST 3: Sabah dolu → akşama geçiş ─────────────────────────────────────
section( 'TEST 3: Sabah oturumu dolu → aynı atölyenin akşamına geçiş' );
{
    $wpdb->reset();
    // Bilimsel 3 sabahı dolu
    $wpdb->mock_results = build_full_atolye_set( array(
        'b3_sabah_dolu' => 16,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 3 ), array( 2 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_eq( 3, $result['bilimsel']['atolye_no'], 'Bilimsel: aynı atölye (3)' );
    assert_eq( 'aksam', $result['bilimsel']['oturum'], 'Bilimsel: akşam oturumuna geçti' );
    assert_eq( 1, $result['bilimsel']['tercih_sirasi'], 'Bilimsel: hâlâ 1. tercih' );

    // Bilimsel akşam → sosyal sabah olmalı
    assert_eq( 'sabah', $result['sosyal']['oturum'], 'Sosyal: sabah oturumuna yerleşmeli (bilimsel akşam → sosyal sabah)' );
}


// ─── TEST 4: Çift oturumlu bilimsel atölye (6 numara) ──────────────────────
section( 'TEST 4: Çift oturumlu bilimsel atölye (atölye 6)' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    $result = Kongre_Allocator::yerlestir( array( 6 ), array( 2, 4 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_eq( 6, $result['bilimsel']['atolye_no'], 'Bilimsel: atölye 6 yerleşti' );
    assert_eq( 'sabah+aksam', $result['bilimsel']['oturum'], 'Bilimsel: sabah+aksam oturumu' );
    assert_eq( false, $result['bilimsel']['fallback'], 'Bilimsel: fallback değil' );
}


// ─── TEST 5: Çift oturum → sosyal atanamaz ──────────────────────────────────
section( 'TEST 5: Çift oturumlu bilimsel → sosyal atölye atanamaz' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    $result = Kongre_Allocator::yerlestir( array( 6 ), array( 2, 4 ) );

    assert_true( $result['sosyal']['atolye_id'] === null, 'Sosyal: atolye_id null olmalı' );
    assert_true( $result['sosyal']['atolye_no'] === null, 'Sosyal: atolye_no null olmalı' );
    assert_true( ! empty( $result['sosyal']['mesaj'] ), 'Sosyal: açıklama mesajı olmalı' );
}


// ─── TEST 6: Bilimsel sabah → sosyal akşam ─────────────────────────────────
section( 'TEST 6: Bilimsel sabah → sosyal akşam (ters oturum kuralı)' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    $result = Kongre_Allocator::yerlestir( array( 1 ), array( 5 ) );

    assert_eq( 'sabah', $result['bilimsel']['oturum'], 'Bilimsel: sabah' );
    assert_eq( 'aksam', $result['sosyal']['oturum'], 'Sosyal: akşam (ters oturum)' );
    assert_eq( 5, $result['sosyal']['atolye_no'], 'Sosyal: tercih edilen atölye 5' );
}


// ─── TEST 7: Bilimsel akşam → sosyal sabah ─────────────────────────────────
section( 'TEST 7: Bilimsel akşam → sosyal sabah (ters oturum kuralı)' );
{
    $wpdb->reset();
    // Bilimsel 1 sabahı dolu → akşama yerleşecek
    $wpdb->mock_results = build_full_atolye_set( array(
        'b1_sabah_dolu' => 16,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 1 ), array( 3 ) );

    assert_eq( 'aksam', $result['bilimsel']['oturum'], 'Bilimsel: akşam' );
    assert_eq( 'sabah', $result['sosyal']['oturum'], 'Sosyal: sabah (ters oturum)' );
}


// ─── TEST 8: Tüm tercihler dolu → fallback ─────────────────────────────────
section( 'TEST 8: Tüm tercihler dolu → fallback (en boş atölyeye atama)' );
{
    $wpdb->reset();
    // Bilimsel 3, 5, 7 tamamen dolu
    $wpdb->mock_results = build_full_atolye_set( array(
        'b3_sabah_dolu' => 16, 'b3_aksam_dolu' => 16,
        'b5_sabah_dolu' => 16, 'b5_aksam_dolu' => 16,
        'b7_sabah_dolu' => 16, 'b7_aksam_dolu' => 16,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 3, 5, 7 ), array( 1 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_true( $result['bilimsel']['fallback'] === true, 'Bilimsel: fallback = true' );
    assert_eq( 0, $result['bilimsel']['tercih_sirasi'], 'Bilimsel: tercih sırası 0 (fallback)' );
    assert_true( $result['bilimsel']['atolye_no'] !== null, 'Bilimsel: bir atölyeye atanmış olmalı' );
    // Fallback çift oturum atölyesine atamamalı (Python kuralı)
    assert_true( $result['bilimsel']['oturum'] !== 'sabah+aksam', 'Bilimsel fallback: çift oturuma atamamalı (Python kuralı)' );
}


// ─── TEST 9: Kontenjan sınırı — bir atölyeye tam kontenjan kadar kişi ───────
section( 'TEST 9: Kontenjan sınırı — tam dolduğunda ret' );
{
    $wpdb->reset();
    // Bilimsel 1 sabah: 15/16 (1 yer kaldı)
    $wpdb->mock_results = build_full_atolye_set( array(
        'b1_sabah_dolu' => 15,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 1 ), array( 2 ) );
    assert_eq( 1, $result['bilimsel']['atolye_no'], 'Bilimsel: son 1 kişilik yer — atölye 1' );
    assert_eq( 'sabah', $result['bilimsel']['oturum'], 'Bilimsel: sabah (15→16)' );

    // Şimdi 16/16 olsaydı?
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set( array(
        'b1_sabah_dolu' => 16,
        'b1_aksam_dolu' => 16,
    ) );
    $result2 = Kongre_Allocator::yerlestir( array( 1 ), array( 2 ) );
    assert_true( $result2['bilimsel']['fallback'] === true, 'Bilimsel: tam dolu → fallback gerekli' );
    assert_true( $result2['bilimsel']['atolye_no'] !== 1, 'Bilimsel: başka atölyeye atandı' );
}


// ─── TEST 10: Boş tercih listesi ────────────────────────────────────────────
section( 'TEST 10: Boş tercih listesi → fallback' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    $result = Kongre_Allocator::yerlestir( array(), array() );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_true( $result['bilimsel']['fallback'] === true, 'Bilimsel: fallback = true (tercih yok)' );
    assert_true( $result['bilimsel']['atolye_no'] !== null, 'Bilimsel: yine de bir yere atanmalı' );
    // Sosyal da fallback olmalı
    assert_true( $result['sosyal']['fallback'] === true, 'Sosyal: fallback = true (tercih yok)' );
}


// ─── TEST 11: Geçersiz atölye numarası → atlanmalı ─────────────────────────
section( 'TEST 11: Geçersiz atölye numarası → atlanıp sonraki tercihe geçmeli' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    // 99 ve 0 geçersiz, 5 geçerli
    $result = Kongre_Allocator::yerlestir( array( 99, 0, 5 ), array( 50, 3 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_eq( 5, $result['bilimsel']['atolye_no'], 'Bilimsel: geçersizler atlanıp atölye 5 yerleşti' );
    assert_eq( 3, $result['sosyal']['atolye_no'], 'Sosyal: geçersizler atlanıp atölye 3 yerleşti' );
}


// ─── TEST 12: Tüm atölyeler tam dolu → null dönüş ──────────────────────────
section( 'TEST 12: TÜM atölyeler tamamen dolu → null dönüş' );
{
    $wpdb->reset();
    $overrides = array();
    // Tüm bilimsel atölyeleri doldur
    for ( $no = 1; $no <= 11; $no++ ) {
        if ( $no === 6 ) {
            $overrides["b{$no}_dolu"] = 32;
        } else {
            $overrides["b{$no}_sabah_dolu"] = 16;
            $overrides["b{$no}_aksam_dolu"] = 16;
        }
    }
    // Tüm sosyal atölyeleri doldur
    for ( $no = 1; $no <= 10; $no++ ) {
        $overrides["s{$no}_sabah_dolu"] = 16;
        $overrides["s{$no}_aksam_dolu"] = 16;
    }
    $wpdb->mock_results = build_full_atolye_set( $overrides );

    $result = Kongre_Allocator::yerlestir( array( 1, 2, 3 ), array( 1, 2, 3 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli (yine de sonuç dönmeli)' );
    assert_true( $result['bilimsel'] === null, 'Bilimsel: null (hiçbir yere sığmadı)' );
    assert_true( $result['sosyal'] === null, 'Sosyal: null (hiçbir yere sığmadı)' );
}


// ─── TEST 13: Fallback son çare — çift oturuma atama ────────────────────────
section( 'TEST 13: Fallback son çare — normal atölyeler dolu, çift oturuma atanmalı' );
{
    $wpdb->reset();
    $overrides = array();
    // Tüm normal bilimsel atölyeleri doldur (1-5, 7-11)
    for ( $no = 1; $no <= 11; $no++ ) {
        if ( $no === 6 ) continue; // çift oturum boş bırak
        $overrides["b{$no}_sabah_dolu"] = 16;
        $overrides["b{$no}_aksam_dolu"] = 16;
    }
    $wpdb->mock_results = build_full_atolye_set( $overrides );

    $result = Kongre_Allocator::yerlestir( array( 1, 2, 3 ), array( 1 ) );

    assert_true( $result['bilimsel']['fallback'] === true, 'Bilimsel: fallback' );
    assert_eq( 6, $result['bilimsel']['atolye_no'], 'Bilimsel: son çare çift oturumlu atölye 6' );
    assert_eq( 'sabah+aksam', $result['bilimsel']['oturum'], 'Bilimsel: sabah+aksam oturumu' );

    // Çift oturuma düştüyse sosyal atanamaz
    assert_true( $result['sosyal']['atolye_id'] === null, 'Sosyal: çift oturum → atanamaz' );
}


// ─── TEST 14: 100 katılımcı stres testi ─────────────────────────────────────
section( 'TEST 14: 100 katılımcı stres testi' );
{
    // Her seferinde taze bir set oluştur, sıralı 100 katılımcıyı yerleştir
    $rows_master = build_full_atolye_set();
    $yerlesme_sayisi = 0;
    $fallback_sayisi = 0;
    $cift_oturum_sayisi = 0;
    $oturum_catisma = 0; // bilimsel ve sosyal aynı oturuma denk gelmesi

    for ( $i = 0; $i < 100; $i++ ) {
        $wpdb->reset();

        // Her iterasyonda taze kopyasını oluştur (önceki yerleştirmeler biriksin)
        $fresh_rows = array();
        foreach ( $rows_master as $row ) {
            $copy = clone $row;
            $fresh_rows[] = $copy;
        }
        $wpdb->mock_results = $fresh_rows;

        // Rastgele tercihler
        $b_tercihleri = array();
        $s_tercihleri = array();
        for ( $j = 0; $j < 3; $j++ ) {
            $b_tercihleri[] = rand( 1, 11 );
            $s_tercihleri[] = rand( 1, 10 );
        }

        $result = Kongre_Allocator::yerlestir( $b_tercihleri, $s_tercihleri );

        if ( is_wp_error( $result ) ) continue;

        if ( $result['bilimsel'] && $result['bilimsel']['atolye_id'] ) {
            $yerlesme_sayisi++;
            if ( $result['bilimsel']['fallback'] ) $fallback_sayisi++;
            if ( $result['bilimsel']['oturum'] === 'sabah+aksam' ) $cift_oturum_sayisi++;

            // Bilimsel yerleştiyse, master'daki dolu sayısını artır (kümülatif simülasyon için)
            foreach ( $rows_master as &$mrow ) {
                if ( (int) $mrow->id === (int) $result['bilimsel']['atolye_id'] ) {
                    $mrow->dolu = (int) $mrow->dolu + 1;
                    break;
                }
            }
            unset( $mrow );
        }

        if ( $result['sosyal'] && $result['sosyal']['atolye_id'] ) {
            foreach ( $rows_master as &$mrow ) {
                if ( (int) $mrow->id === (int) $result['sosyal']['atolye_id'] ) {
                    $mrow->dolu = (int) $mrow->dolu + 1;
                    break;
                }
            }
            unset( $mrow );

            // Oturum çatışması kontrolü
            if ( $result['bilimsel'] && $result['bilimsel']['atolye_id'] ) {
                $b_oturum = $result['bilimsel']['oturum'];
                $s_oturum = $result['sosyal']['oturum'];
                if ( $b_oturum !== 'sabah+aksam' && $b_oturum === $s_oturum ) {
                    $oturum_catisma++;
                }
            }
        }
    }

    // Toplam kontenjan: (10 normal bilimsel × 2 oturum × 16) + (1 çift × 32) + (10 sosyal × 2 × 16) = 672
    echo CLR_YELLOW . "    ℹ Sonuçlar:\n" . CLR_RESET;
    echo "      Toplam bilimsel yerleşen : $yerlesme_sayisi / 100\n";
    echo "      Fallback                 : $fallback_sayisi\n";
    echo "      Çift oturum (atölye 6)   : $cift_oturum_sayisi\n";
    echo "      Oturum çatışması         : $oturum_catisma\n";

    assert_true( $yerlesme_sayisi > 0, "Stres testi: en az bazı katılımcılar yerleşmeli ($yerlesme_sayisi/100)" );
    assert_eq( 0, $oturum_catisma, 'Stres testi: bilimsel ve sosyal aynı oturumda olmamalı (0 çatışma)' );
}


// ─── TEST 15: Sosyal fallback — hedef oturumda en boş atölye ────────────────
section( 'TEST 15: Sosyal fallback — tüm sosyal tercihler dolu → en boş atölyeye' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set( array(
        // Sosyal 2, 4 akşam dolu (bilimsel sabaha yerleşecek → sosyal akşam hedef)
        's2_aksam_dolu' => 16,
        's4_aksam_dolu' => 16,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 1 ), array( 2, 4 ) );

    assert_eq( 'sabah', $result['bilimsel']['oturum'], 'Bilimsel: sabah' );
    assert_true( $result['sosyal']['fallback'] === true, 'Sosyal: fallback' );
    assert_eq( 'aksam', $result['sosyal']['oturum'], 'Sosyal: akşam oturumu (hedef oturum korunmalı)' );
    assert_true( $result['sosyal']['atolye_no'] !== 2 && $result['sosyal']['atolye_no'] !== 4,
        'Sosyal: dolu olmayan başka atölyeye atandı' );
}


// ─── TEST 16: Çift oturumlu atölye dolu → sonraki tercihe ──────────────────
section( 'TEST 16: Çift oturumlu atölye dolu → sonraki tercihe geçmeli' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set( array(
        'b6_dolu' => 32,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 6, 3 ), array( 1 ) );

    assert_true( ! is_wp_error( $result ), 'Hata dönmemeli' );
    assert_eq( 3, $result['bilimsel']['atolye_no'], 'Bilimsel: çift oturum dolu → 2. tercih atölye 3' );
    assert_eq( 2, $result['bilimsel']['tercih_sirasi'], 'Bilimsel: tercih sırası 2' );
}


// ─── TEST 17: DB güncelleme — doğru ID'ler UPDATE edilmeli ──────────────────
section( 'TEST 17: DB güncelleme — doğru atölye ID\'leri UPDATE edilmeli' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    $result = Kongre_Allocator::yerlestir( array( 3 ), array( 5 ) );

    $b_id = $result['bilimsel']['atolye_id'];
    $s_id = $result['sosyal']['atolye_id'];

    assert_true( in_array( $b_id, $wpdb->updates ), "DB: bilimsel atolye_id=$b_id UPDATE edildi" );
    assert_true( in_array( $s_id, $wpdb->updates ), "DB: sosyal atolye_id=$s_id UPDATE edildi" );
    assert_eq( 2, count( $wpdb->updates ), 'DB: tam 2 UPDATE çalıştı (bilimsel + sosyal)' );
}


// ─── TEST 18: Transaction — START/COMMIT varlığı ────────────────────────────
section( 'TEST 18: Transaction — START TRANSACTION + COMMIT çalışmalı' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    Kongre_Allocator::yerlestir( array( 1 ), array( 2 ) );

    $has_start  = false;
    $has_commit = false;
    foreach ( $wpdb->queries as $q ) {
        if ( stripos( $q, 'START TRANSACTION' ) !== false ) $has_start = true;
        if ( stripos( $q, 'COMMIT' ) !== false ) $has_commit = true;
    }
    assert_true( $has_start, 'Transaction: START TRANSACTION çağrıldı' );
    assert_true( $has_commit, 'Transaction: COMMIT çağrıldı' );
}


// ─── TEST 19: FOR UPDATE — satır kilidi kontrolü ────────────────────────────
section( 'TEST 19: FOR UPDATE — race condition koruması' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set();

    Kongre_Allocator::yerlestir( array( 1 ), array( 2 ) );

    $has_for_update = false;
    foreach ( $wpdb->queries as $q ) {
        if ( stripos( $q, 'FOR UPDATE' ) !== false ) $has_for_update = true;
    }
    assert_true( $has_for_update, 'SELECT ... FOR UPDATE kullanılıyor' );
}


// ─── TEST 20: Boş atölye tablosu → WP_Error ────────────────────────────────
section( 'TEST 20: Boş atölye tablosu → WP_Error dönmeli' );
{
    $wpdb->reset();
    $wpdb->mock_results = array(); // boş

    $result = Kongre_Allocator::yerlestir( array( 1, 2 ), array( 3 ) );

    assert_true( is_wp_error( $result ), 'WP_Error dönmeli' );
    assert_eq( 'no_atolye', $result->get_error_code(), 'Hata kodu: no_atolye' );
}


// ─── TEST 21: Doluluk özeti ─────────────────────────────────────────────────
section( 'TEST 21: get_doluluk_ozeti() doğru çıktı yapısı' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set( array(
        'b1_sabah_dolu' => 10,
        's3_aksam_dolu' => 5,
    ) );

    $ozet = Kongre_Allocator::get_doluluk_ozeti();

    assert_true( isset( $ozet['bilimsel'] ) && isset( $ozet['sosyal'] ), 'Özet: bilimsel ve sosyal anahtarları var' );

    $b1_sabah = null;
    foreach ( $ozet['bilimsel'] as $a ) {
        if ( $a['atolye_no'] === 1 && $a['oturum'] === 'sabah' ) { $b1_sabah = $a; break; }
    }
    assert_true( $b1_sabah !== null, 'Özet: Bilimsel 1 sabah bulundu' );
    assert_eq( 10, $b1_sabah['dolu'], 'Özet: Bilimsel 1 sabah dolu=10' );
    assert_eq( 6, $b1_sabah['kalan'], 'Özet: Bilimsel 1 sabah kalan=6' );
    assert_eq( false, $b1_sabah['dolu_mu'], 'Özet: Bilimsel 1 sabah dolu_mu=false' );
}


// ─── TEST 22: Tercih sırası doğruluğu ──────────────────────────────────────
section( 'TEST 22: Tercih sırası doğruluğu (3. tercihte yerleşme)' );
{
    $wpdb->reset();
    $wpdb->mock_results = build_full_atolye_set( array(
        'b2_sabah_dolu' => 16, 'b2_aksam_dolu' => 16,
        'b7_sabah_dolu' => 16, 'b7_aksam_dolu' => 16,
    ) );

    $result = Kongre_Allocator::yerlestir( array( 2, 7, 9 ), array( 1 ) );

    assert_eq( 9, $result['bilimsel']['atolye_no'], 'Bilimsel: 3. tercih atölye 9' );
    assert_eq( 3, $result['bilimsel']['tercih_sirasi'], 'Bilimsel: tercih_sirasi = 3' );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  SONUÇ
// ═══════════════════════════════════════════════════════════════════════════════

echo "\n" . CLR_BOLD . "══════════════════════════════════════════════════════════════" . CLR_RESET;
echo "\n" . CLR_BOLD . "  SONUÇ" . CLR_RESET;
echo "\n" . CLR_BOLD . "══════════════════════════════════════════════════════════════" . CLR_RESET;
echo "\n";

echo "  Toplam test : $test_count\n";
echo CLR_GREEN . "  Başarılı     : $pass_count" . CLR_RESET . "\n";
if ( $fail_count > 0 ) {
    echo CLR_RED . "  Başarısız    : $fail_count" . CLR_RESET . "\n";
    echo "\n" . CLR_RED . CLR_BOLD . "  BAŞARISIZ TESTLER:" . CLR_RESET . "\n";
    foreach ( $fail_details as $idx => $d ) {
        echo CLR_RED . "    " . ( $idx + 1 ) . ". $d" . CLR_RESET . "\n";
    }
}

echo "\n";

if ( $fail_count === 0 ) {
    echo CLR_GREEN . CLR_BOLD . "  ✅ TÜM TESTLER BAŞARILI!" . CLR_RESET . "\n\n";
    exit( 0 );
} else {
    echo CLR_RED . CLR_BOLD . "  ❌ $fail_count TEST BAŞARISIZ!" . CLR_RESET . "\n\n";
    exit( 1 );
}
