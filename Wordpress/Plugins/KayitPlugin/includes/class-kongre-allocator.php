<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Kongre Atölye Yerleştirme Algoritması
 * 
 * Python yerlestirme26.py mantığını birebir PHP'ye uyarlar.
 * MySQL Transaction + SELECT ... FOR UPDATE ile race condition koruması.
 */
class Kongre_Allocator {

    public static function yerlestir( $bilimsel_tercihler, $sosyal_tercihler ) {
        global $wpdb;
        $t_atolye = Kongre_DB::table_atolyeler();

        $wpdb->query( 'START TRANSACTION' );

        try {
            $all_rows = $wpdb->get_results(
                "SELECT * FROM $t_atolye WHERE aktif = 1 ORDER BY tur, atolye_no, oturum FOR UPDATE"
            );

            if ( empty( $all_rows ) ) {
                $wpdb->query( 'ROLLBACK' );
                return new \WP_Error( 'no_atolye', 'Atölye verileri bulunamadı.' );
            }

            // index: $index['bilimsel'][3]['sabah'] = row object
            $index = array();
            foreach ( $all_rows as $row ) {
                $index[ $row->tur ][ (int) $row->atolye_no ][ $row->oturum ] = $row;
            }

            $bilimsel_sonuc = self::bilimsel_yerlestir( $bilimsel_tercihler, $index );

            $sosyal_sonuc = null;
            if ( $bilimsel_sonuc && $bilimsel_sonuc['oturum'] === 'sabah+aksam' ) {
                $sosyal_sonuc = array(
                    'atolye_id' => null, 'atolye_no' => null, 'oturum' => null,
                    'atolye_adi' => null, 'fallback' => false,
                    'mesaj' => 'Çift oturumlu bilimsel atölye — sosyal atanamaz.',
                );
            } else {
                $hedef = null;
                if ( $bilimsel_sonuc ) {
                    $hedef = ( $bilimsel_sonuc['oturum'] === 'sabah' ) ? 'aksam' : 'sabah';
                }
                $sosyal_sonuc = self::sosyal_yerlestir( $sosyal_tercihler, $index, $hedef );
            }

            // DB güncelle
            if ( $bilimsel_sonuc && $bilimsel_sonuc['atolye_id'] ) {
                $wpdb->query( $wpdb->prepare(
                    "UPDATE $t_atolye SET dolu = dolu + 1 WHERE id = %d", $bilimsel_sonuc['atolye_id']
                ));
            }
            if ( $sosyal_sonuc && $sosyal_sonuc['atolye_id'] ) {
                $wpdb->query( $wpdb->prepare(
                    "UPDATE $t_atolye SET dolu = dolu + 1 WHERE id = %d", $sosyal_sonuc['atolye_id']
                ));
            }

            $wpdb->query( 'COMMIT' );
            return array( 'bilimsel' => $bilimsel_sonuc, 'sosyal' => $sosyal_sonuc );

        } catch ( \Exception $e ) {
            $wpdb->query( 'ROLLBACK' );
            error_log( 'Kongre Allocator hatası: ' . $e->getMessage() );
            return new \WP_Error( 'allocator_error', 'Yerleştirme sırasında hata oluştu.' );
        }
    }

    private static function bilimsel_yerlestir( $tercihler, &$index ) {
        foreach ( $tercihler as $no ) {
            $no = (int) $no;
            if ( ! isset( $index['bilimsel'][ $no ] ) ) continue;
            $oturumlar = $index['bilimsel'][ $no ];

            if ( isset( $oturumlar['sabah+aksam'] ) ) {
                $row = $oturumlar['sabah+aksam'];
                if ( (int) $row->dolu < (int) $row->kontenjan ) {
                    $row->dolu = (int) $row->dolu + 1;
                    return array(
                        'atolye_id' => (int) $row->id, 'atolye_no' => $no,
                        'oturum' => 'sabah+aksam', 'atolye_adi' => $row->atolye_adi,
                        'tercih_sirasi' => array_search( $no, $tercihler ) + 1, 'fallback' => false,
                    );
                }
                continue;
            }

            foreach ( array( 'sabah', 'aksam' ) as $o ) {
                if ( ! isset( $oturumlar[ $o ] ) ) continue;
                $row = $oturumlar[ $o ];
                if ( (int) $row->dolu < (int) $row->kontenjan ) {
                    $row->dolu = (int) $row->dolu + 1;
                    return array(
                        'atolye_id' => (int) $row->id, 'atolye_no' => $no,
                        'oturum' => $o, 'atolye_adi' => $row->atolye_adi,
                        'tercih_sirasi' => array_search( $no, $tercihler ) + 1, 'fallback' => false,
                    );
                }
            }
        }
        return self::fallback_bilimsel( $index );
    }

    private static function sosyal_yerlestir( $tercihler, &$index, $hedef_oturum ) {
        foreach ( $tercihler as $no ) {
            $no = (int) $no;
            if ( ! isset( $index['sosyal'][ $no ] ) ) continue;
            $oturumlar = $index['sosyal'][ $no ];

            $dene = $hedef_oturum ? array( $hedef_oturum ) : array( 'sabah', 'aksam' );
            foreach ( $dene as $o ) {
                if ( ! isset( $oturumlar[ $o ] ) ) continue;
                $row = $oturumlar[ $o ];
                if ( (int) $row->dolu < (int) $row->kontenjan ) {
                    $row->dolu = (int) $row->dolu + 1;
                    return array(
                        'atolye_id' => (int) $row->id, 'atolye_no' => $no,
                        'oturum' => $o, 'atolye_adi' => $row->atolye_adi,
                        'tercih_sirasi' => array_search( $no, $tercihler ) + 1, 'fallback' => false,
                    );
                }
            }
        }
        return self::fallback_sosyal( $index, $hedef_oturum );
    }

    private static function fallback_bilimsel( &$index ) {
        if ( ! isset( $index['bilimsel'] ) ) return null;
        $en_bos = null; $en_bos_yer = 0;

        foreach ( $index['bilimsel'] as $no => $oturumlar ) {
            foreach ( $oturumlar as $o => $row ) {
                if ( $o === 'sabah+aksam' ) continue;
                $bos = (int) $row->kontenjan - (int) $row->dolu;
                if ( $bos > $en_bos_yer ) { $en_bos_yer = $bos; $en_bos = $row; }
            }
        }
        if ( $en_bos && $en_bos_yer > 0 ) {
            $en_bos->dolu = (int) $en_bos->dolu + 1;
            return array(
                'atolye_id' => (int) $en_bos->id, 'atolye_no' => (int) $en_bos->atolye_no,
                'oturum' => $en_bos->oturum, 'atolye_adi' => $en_bos->atolye_adi,
                'tercih_sirasi' => 0, 'fallback' => true,
            );
        }
        // Son çare: çift oturum
        foreach ( $index['bilimsel'] as $no => $oturumlar ) {
            if ( isset( $oturumlar['sabah+aksam'] ) ) {
                $row = $oturumlar['sabah+aksam'];
                if ( (int) $row->dolu < (int) $row->kontenjan ) {
                    $row->dolu = (int) $row->dolu + 1;
                    return array(
                        'atolye_id' => (int) $row->id, 'atolye_no' => (int) $row->atolye_no,
                        'oturum' => 'sabah+aksam', 'atolye_adi' => $row->atolye_adi,
                        'tercih_sirasi' => 0, 'fallback' => true,
                    );
                }
            }
        }
        return null;
    }

    private static function fallback_sosyal( &$index, $hedef_oturum ) {
        if ( ! isset( $index['sosyal'] ) ) return null;
        $en_bos = null; $en_bos_yer = 0;
        $dene = $hedef_oturum ? array( $hedef_oturum ) : array( 'sabah', 'aksam' );

        foreach ( $index['sosyal'] as $no => $oturumlar ) {
            foreach ( $dene as $o ) {
                if ( ! isset( $oturumlar[ $o ] ) ) continue;
                $row = $oturumlar[ $o ];
                $bos = (int) $row->kontenjan - (int) $row->dolu;
                if ( $bos > $en_bos_yer ) { $en_bos_yer = $bos; $en_bos = $row; }
            }
        }
        if ( $en_bos && $en_bos_yer > 0 ) {
            $en_bos->dolu = (int) $en_bos->dolu + 1;
            return array(
                'atolye_id' => (int) $en_bos->id, 'atolye_no' => (int) $en_bos->atolye_no,
                'oturum' => $en_bos->oturum, 'atolye_adi' => $en_bos->atolye_adi,
                'tercih_sirasi' => 0, 'fallback' => true,
            );
        }
        return null;
    }

    public static function get_doluluk_ozeti() {
        $atolyeler = Kongre_DB::get_all_atolyeler();
        $ozet = array( 'bilimsel' => array(), 'sosyal' => array() );
        foreach ( $atolyeler as $a ) {
            $kalan = max( 0, (int) $a->kontenjan - (int) $a->dolu );
            $ozet[ $a->tur ][] = array(
                'id' => (int) $a->id, 'atolye_no' => (int) $a->atolye_no,
                'atolye_adi' => $a->atolye_adi, 'oturum' => $a->oturum,
                'oturum_label' => $a->oturum_label ?? '',
                'kontenjan' => (int) $a->kontenjan, 'dolu' => (int) $a->dolu,
                'kalan' => $kalan, 'dolu_mu' => $kalan <= 0,
            );
        }
        return $ozet;
    }
}
