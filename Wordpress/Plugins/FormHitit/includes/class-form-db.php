<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Hitit_Form_DB {

    const UNIQUE_TABLE_SUFFIX = 'hitit_form_unique_values';

    /**
     * DB satırının data alanını array'e çevir.
     */
    private static function decode_entry_rows( array $rows ) {
        foreach ( $rows as &$row ) {
            $row->data = json_decode( $row->data, true );
            if ( ! is_array( $row->data ) ) {
                $row->data = array();
            }
        }

        return $rows;
    }

    /**
     * Form kaydet (yeni veya güncelle)
     */
    public static function save_form( $data ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_forms';

        $fields = array(
            'title'              => sanitize_text_field( $data['title'] ),
            'fields'             => wp_json_encode( $data['fields'], JSON_UNESCAPED_UNICODE ),
            'settings'           => wp_json_encode( isset( $data['settings'] ) ? $data['settings'] : array(), JSON_UNESCAPED_UNICODE ),
            'google_sheet_id'    => sanitize_text_field( isset( $data['google_sheet_id'] ) ? $data['google_sheet_id'] : '' ),
            'google_credentials' => isset( $data['google_credentials'] ) ? $data['google_credentials'] : '',
            'start_time'         => ! empty( $data['start_time'] ) ? sanitize_text_field( $data['start_time'] ) : null,
            'wait_message'       => sanitize_textarea_field( isset( $data['wait_message'] ) ? $data['wait_message'] : '' ),
        );

        if ( ! empty( $data['id'] ) ) {
            $wpdb->update( $table, $fields, array( 'id' => intval( $data['id'] ) ) );
            return intval( $data['id'] );
        } else {
            $wpdb->insert( $table, $fields );
            return $wpdb->insert_id;
        }
    }

    /**
     * Tek form getir
     */
    public static function get_form( $id ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_forms';
        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $id ) );
        if ( $row ) {
            $row->fields   = json_decode( $row->fields, true );
            $row->settings = json_decode( $row->settings, true );
        }
        return $row;
    }

    /**
     * Tüm formları getir
     */
    public static function get_forms() {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_forms';
        return $wpdb->get_results( "SELECT id, title, created_at, updated_at FROM $table ORDER BY id DESC" );
    }

    /**
     * Form sil
     */
    public static function delete_form( $id ) {
        global $wpdb;
        $wpdb->delete( $wpdb->prefix . 'hitit_forms', array( 'id' => intval( $id ) ) );
        $wpdb->delete( $wpdb->prefix . 'hitit_form_entries', array( 'form_id' => intval( $id ) ) );
        $wpdb->delete( self::unique_table(), array( 'form_id' => intval( $id ) ) );
    }

    /**
     * Form gönderimi kaydet
     */
    public static function save_entry( $form_id, $data ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_form_entries';

        $unique_fields = array();
        if ( isset( $data['__unique_fields'] ) && is_array( $data['__unique_fields'] ) ) {
            $unique_fields = $data['__unique_fields'];
            unset( $data['__unique_fields'] );
        }

        $wpdb->query( 'START TRANSACTION' );

        try {
            $inserted = $wpdb->insert( $table, array(
                'form_id'    => intval( $form_id ),
                'data'       => wp_json_encode( $data, JSON_UNESCAPED_UNICODE ),
                'ip_address' => self::get_client_ip(),
            ));

            if ( ! $inserted ) {
                throw new RuntimeException( 'entry_insert_failed' );
            }

            $entry_id = (int) $wpdb->insert_id;

            foreach ( $unique_fields as $claim ) {
                $claimed = $wpdb->insert(
                    self::unique_table(),
                    array(
                        'form_id'          => (int) $form_id,
                        'entry_id'         => $entry_id,
                        'field_name'       => sanitize_key( $claim['field_name'] ?? '' ),
                        'field_label'      => sanitize_text_field( $claim['field_label'] ?? '' ),
                        'field_value'      => (string) ( $claim['field_value'] ?? '' ),
                        'normalized_value' => self::normalize_unique_value(
                            (string) ( $claim['field_value'] ?? '' ),
                            (string) ( $claim['field_type'] ?? 'text' )
                        ),
                    ),
                    array( '%d', '%d', '%s', '%s', '%s', '%s' )
                );

                if ( ! $claimed ) {
                    if ( self::is_duplicate_unique_error( $wpdb ) ) {
                        $wpdb->query( 'ROLLBACK' );
                        return new WP_Error(
                            'duplicate_unique',
                            sprintf(
                                '"%s" alanına daha önce "%s" değeri kaydedilmiş. Lütfen farklı bir değer girin.',
                                $claim['field_label'] ?? $claim['field_name'] ?? 'Alan',
                                $claim['field_value'] ?? ''
                            ),
                            array(
                                'field_name' => $claim['field_name'] ?? '',
                            )
                        );
                    }

                    throw new RuntimeException( 'unique_claim_failed' );
                }
            }

            $wpdb->query( 'COMMIT' );
            return $entry_id;
        } catch ( Throwable $e ) {
            $wpdb->query( 'ROLLBACK' );
            return false;
        }
    }

    /**
     * Gönderileri getir
     */
    public static function get_entries( $form_id, $limit = 50, $offset = 0 ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_form_entries';
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE form_id = %d ORDER BY id DESC LIMIT %d OFFSET %d",
            $form_id, $limit, $offset
        ));
        return self::decode_entry_rows( $rows );
    }

    /**
     * Tek gönderiyi getir.
     */
    public static function get_entry( $id ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_form_entries';
        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            intval( $id )
        ) );

        if ( ! $row ) {
            return null;
        }

        $rows = self::decode_entry_rows( array( $row ) );
        return $rows[0] ?? null;
    }

    /**
     * Belirli bir ID'den sonra gelen gönderileri getir.
     */
    public static function get_entries_after( $form_id, $last_id = 0, $limit = 50 ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_form_entries';
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE form_id = %d AND id > %d ORDER BY id DESC LIMIT %d",
            $form_id,
            max( 0, intval( $last_id ) ),
            max( 1, intval( $limit ) )
        ) );

        return self::decode_entry_rows( $rows );
    }

    /**
     * Formun son gönderi ID'sini getir.
     */
    public static function get_last_entry_id( $form_id ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_form_entries';

        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT MAX(id) FROM $table WHERE form_id = %d",
            $form_id
        ) );
    }

    /**
     * Gönderi sayısı
     */
    public static function count_entries( $form_id ) {
        global $wpdb;
        $table = $wpdb->prefix . 'hitit_form_entries';
        return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $table WHERE form_id = %d", $form_id ) );
    }

    /**
     * Tek gönderi sil
     */
    public static function delete_entry( $id ) {
        global $wpdb;
        $entry = self::get_entry( $id );
        $deleted = $wpdb->delete( $wpdb->prefix . 'hitit_form_entries', array( 'id' => intval( $id ) ) );

        if ( $deleted && $entry ) {
            self::delete_unique_claims_by_entry_id( (int) $id );
            do_action( 'hitit_form_entry_deleted', (int) $entry->id, (int) $entry->form_id, $entry->data );
        }

        return $deleted;
    }

    /**
     * Toplu gönderi sil
     */
    public static function bulk_delete_entries( $ids ) {
        global $wpdb;
        if ( empty( $ids ) || ! is_array( $ids ) ) return 0;

        $table = $wpdb->prefix . 'hitit_form_entries';
        $ids   = array_map( 'intval', $ids );
        $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE id IN ($placeholders)",
            ...$ids
        ) );
        $entries = self::decode_entry_rows( $rows );

        $deleted = $wpdb->query( $wpdb->prepare(
            "DELETE FROM $table WHERE id IN ($placeholders)",
            ...$ids
        ) );

        if ( $deleted && ! empty( $entries ) ) {
            foreach ( $ids as $id ) {
                self::delete_unique_claims_by_entry_id( (int) $id );
            }
            foreach ( $entries as $entry ) {
                do_action( 'hitit_form_entry_deleted', (int) $entry->id, (int) $entry->form_id, $entry->data );
            }
        }

        return $deleted;
    }

    /**
     * IP adresi al
     */
    private static function get_client_ip() {
        return hitit_form_get_client_ip();
    }

    public static function unique_table() {
        global $wpdb;
        return $wpdb->prefix . self::UNIQUE_TABLE_SUFFIX;
    }

    public static function normalize_unique_value( $value, $field_type = 'text' ) {
        $value = trim( (string) $value );

        if ( $field_type === 'tel' ) {
            return preg_replace( '/\D+/', '', $value );
        }

        if ( $field_type === 'email' ) {
            return strtolower( $value );
        }

        return function_exists( 'mb_strtolower' ) ? mb_strtolower( $value ) : strtolower( $value );
    }

    private static function delete_unique_claims_by_entry_id( $entry_id ) {
        global $wpdb;
        return $wpdb->delete( self::unique_table(), array( 'entry_id' => (int) $entry_id ) );
    }

    private static function is_duplicate_unique_error( $wpdb ) {
        $last_error = (string) ( $wpdb->last_error ?? '' );
        return strpos( $last_error, 'Duplicate entry' ) !== false;
    }
}
