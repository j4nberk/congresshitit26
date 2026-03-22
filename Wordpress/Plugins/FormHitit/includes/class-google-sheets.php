<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Hitit_Google_Sheets {

    private $access_token;
    private $spreadsheet_id;

    /**
     * Google Sheets'e veri gönder
     * Google Apps Script Web App URL üzerinden çalışır (API key gerektirmez)
     */
    public static function send_to_sheet( $form ) {
        $sheet_url = $form->google_sheet_id;

        if ( empty( $sheet_url ) ) {
            return false;
        }

        return $sheet_url;
    }

    /**
     * Google Apps Script Web App'e veri POST et
     *
     * Nasıl çalışır:
     * 1. Google Sheets aç → Uzantılar → Apps Script
     * 2. Aşağıdaki kodu yapıştır → Deploy → Web App → "Herkes erişebilir" seç
     * 3. Web App URL'sini forma yapıştır
     *
     * Apps Script kodu:
     *
     * // ── KAYIT YAZMA (Form Plugin) ──
     * function doPost(e) {
     *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     *   var data = JSON.parse(e.postData.contents);
     *   var row = [];
     *   if (sheet.getLastRow() === 0) {
     *     sheet.appendRow(Object.keys(data));
     *   }
     *   var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
     *   for (var i = 0; i < headers.length; i++) {
     *     row.push(data[headers[i]] || '');
     *   }
     *   Object.keys(data).forEach(function(key) {
     *     if (headers.indexOf(key) === -1) {
     *       headers.push(key);
     *       row.push(data[key]);
     *       sheet.getRange(1, headers.length).setValue(key);
     *     }
     *   });
     *   sheet.appendRow(row);
     *   return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
     *     .setMimeType(ContentService.MimeType.JSON);
     * }
     *
     * // ── KAYIT SORGULAMA (Kayıt Kontrol Plugin) ──
     * function doGet(e) {
     *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     *   var phone = (e.parameter.phone || '').replace(/\D/g, '');
     *   var searchCol  = e.parameter.searchCol  || 'A';
     *   var resultCol1 = e.parameter.resultCol1 || 'B';
     *   var resultCol2 = e.parameter.resultCol2 || 'C';
     *
     *   if (!phone) {
     *     return jsonResp({found: false, error: 'Telefon numarası gerekli.'});
     *   }
     *
     *   var searchIdx = colToIndex(searchCol);
     *   var res1Idx   = colToIndex(resultCol1);
     *   var res2Idx   = colToIndex(resultCol2);
     *   var data = sheet.getDataRange().getValues();
     *
     *   for (var i = 1; i < data.length; i++) {
     *     var cellPhone = String(data[i][searchIdx] || '').replace(/\D/g, '');
     *     if (cellPhone === phone) {
     *       return jsonResp({
     *         found: true,
     *         result1: String(data[i][res1Idx] || ''),
     *         result2: String(data[i][res2Idx] || '')
     *       });
     *     }
     *   }
     *   return jsonResp({found: false});
     * }
     *
     * // ── YARDIMCI FONKSİYONLAR ──
     * function colToIndex(col) {
     *   col = col.toUpperCase();
     *   var idx = 0;
     *   for (var i = 0; i < col.length; i++) {
     *     idx = idx * 26 + (col.charCodeAt(i) - 64);
     *   }
     *   return idx - 1;
     * }
     *
     * function jsonResp(obj) {
     *   return ContentService.createTextOutput(JSON.stringify(obj))
     *     .setMimeType(ContentService.MimeType.JSON);
     * }
     */
    public static function post_entry( $web_app_url, $entry_data ) {
        if ( empty( $web_app_url ) || ! filter_var( $web_app_url, FILTER_VALIDATE_URL ) ) {
            return new WP_Error( 'invalid_url', 'Geçersiz Google Apps Script URL' );
        }

        // Tarih/saat bilgisi ekle (kuyruktan gelmediyse)
        if ( ! isset( $entry_data['Gönderim Tarihi'] ) ) {
            $entry_data['Gönderim Tarihi'] = current_time( 'd.m.Y H:i' );
        }

        $response = wp_remote_post( $web_app_url, array(
            'timeout'     => 30,
            'httpversion' => '1.1',
            'headers'     => array( 'Content-Type' => 'application/json' ),
            'body'        => wp_json_encode( $entry_data, JSON_UNESCAPED_UNICODE ),
        ));

        if ( is_wp_error( $response ) ) {
            error_log( 'Hitit Form - Google Sheets hatası: ' . $response->get_error_message() );
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        if ( $code !== 200 && $code !== 302 ) {
            error_log( 'Hitit Form - Google Sheets HTTP hatası: ' . $code );
            return new WP_Error( 'http_error', 'Google Sheets yanıt kodu: ' . $code );
        }

        return true;
    }
}