<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Kongre_Desktop_API {

    const AUTH_OPTION      = 'kongre_desktop_auth';
    const POLL_INTERVAL_MS = 5000;

    public function register() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        register_rest_route( 'kongre-desktop/v1', '/bootstrap', array(
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_bootstrap' ),
            'permission_callback' => array( $this, 'authorize_request' ),
        ) );

        register_rest_route( 'kongre-desktop/v1', '/live', array(
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_live' ),
            'permission_callback' => array( $this, 'authorize_request' ),
            'args'                => array(
                'after_entry_id' => array(
                    'required'          => false,
                    'sanitize_callback' => 'absint',
                    'default'           => 0,
                ),
                'limit' => array(
                    'required'          => false,
                    'sanitize_callback' => 'absint',
                    'default'           => 25,
                ),
            ),
        ) );

        register_rest_route( 'kongre-desktop/v1', '/participants', array(
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_participants' ),
            'permission_callback' => array( $this, 'authorize_request' ),
            'args'                => array(
                'sort' => array(
                    'required'          => false,
                    'sanitize_callback' => array( $this, 'sanitize_sort' ),
                    'default'           => 'basvuru',
                ),
            ),
        ) );

        register_rest_route( 'kongre-desktop/v1', '/workshops', array(
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_workshops' ),
            'permission_callback' => array( $this, 'authorize_request' ),
            'args'                => array(
                'sort' => array(
                    'required'          => false,
                    'sanitize_callback' => array( $this, 'sanitize_sort' ),
                    'default'           => 'basvuru',
                ),
            ),
        ) );
    }

    public function sanitize_sort( $value ) {
        return Kongre_DB::normalize_sort( sanitize_text_field( $value ) );
    }

    public function authorize_request( $request ) {
        $key = $request->get_header( 'X-Hitit-Desktop-Key' );

        if ( ! self::verify_key( $key ) ) {
            return new \WP_Error(
                'kongre_desktop_unauthorized',
                'Geçersiz veya eksik masaüstü API anahtarı.',
                array( 'status' => 401 )
            );
        }

        return true;
    }

    public static function get_auth_settings() {
        $defaults = array(
            'hash'       => '',
            'last4'      => '',
            'created_at' => '',
        );

        return wp_parse_args( get_option( self::AUTH_OPTION, array() ), $defaults );
    }

    public static function has_key() {
        $settings = self::get_auth_settings();
        return ! empty( $settings['hash'] );
    }

    public static function create_key() {
        $raw_key = 'kh_' . wp_generate_password( 48, false, false );
        $stored  = array(
            'hash'       => wp_hash_password( $raw_key ),
            'last4'      => substr( $raw_key, -4 ),
            'created_at' => current_time( 'mysql' ),
        );

        update_option( self::AUTH_OPTION, $stored, false );

        return $raw_key;
    }

    public static function revoke_key() {
        delete_option( self::AUTH_OPTION );
    }

    public static function verify_key( $raw_key ) {
        $raw_key = is_string( $raw_key ) ? trim( $raw_key ) : '';
        if ( $raw_key === '' ) {
            return false;
        }

        $settings = self::get_auth_settings();
        if ( empty( $settings['hash'] ) ) {
            return false;
        }

        return wp_check_password( $raw_key, $settings['hash'] );
    }

    public static function get_target_form() {
        if ( ! class_exists( 'Hitit_Form_DB' ) ) {
            return new \WP_Error( 'kongre_desktop_missing_form_plugin', 'Hitit Form Builder aktif değil.' );
        }

        $map = get_option( 'kongre_field_map', array() );
        $form_id = absint( $map['target_form_id'] ?? 0 );
        if ( ! $form_id ) {
            return new \WP_Error( 'kongre_desktop_missing_target_form', 'Masaüstü uygulaması için Ayarlar ekranından hedef form seçilmelidir.' );
        }

        $form = Hitit_Form_DB::get_form( $form_id );
        if ( ! $form ) {
            return new \WP_Error( 'kongre_desktop_invalid_form', 'Seçilen hedef form bulunamadı.' );
        }

        return $form;
    }

    private function get_participant_submitted_at( $kayit ) {
        if ( ! empty( $kayit->form_created_at ) ) {
            return $kayit->form_created_at;
        }

        return $kayit->created_at;
    }

    public function get_bootstrap( $request ) {
        $form = self::get_target_form();
        if ( is_wp_error( $form ) ) {
            return $form;
        }

        $last_entry_id = class_exists( 'Hitit_Form_DB' ) ? Hitit_Form_DB::get_last_entry_id( $form->id ) : 0;
        $state_token = Kongre_DB::get_state_token_for_form( $form->id );

        return rest_ensure_response( array(
            'form' => array(
                'id'    => (int) $form->id,
                'title' => $form->title,
            ),
            'total_participants' => Kongre_DB::count_kayitlar_for_form( $form->id ),
            'last_entry_id'      => (int) $last_entry_id,
            'state_token'        => $state_token,
            'poll_interval_ms'   => self::POLL_INTERVAL_MS,
            'workshop_summary'   => $this->build_workshop_summary( $form->id ),
            'columns'            => array(
                'participants' => array(
                    'Basvuru No',
                    'Basvuru Tarihi',
                    'Ad Soyad',
                    'Donem',
                    'Telefon',
                    'E-posta',
                    'Paket',
                    'Katilimci Turu',
                    'Bilimsel Atolye',
                    'Sosyal Atolye',
                ),
                'workshop' => array(
                    'Sira',
                    'Ad Soyad',
                    'Donem',
                    'Telefon',
                    'E-posta',
                    'Paket',
                    'Katilimci Turu',
                ),
            ),
            'generated_at' => current_time( 'mysql' ),
        ) );
    }

    public function get_live( $request ) {
        $form = self::get_target_form();
        if ( is_wp_error( $form ) ) {
            return $form;
        }

        $after_entry_id = absint( $request->get_param( 'after_entry_id' ) );
        $limit = min( 100, max( 1, absint( $request->get_param( 'limit' ) ) ) );
        $entries = Hitit_Form_DB::get_entries_after( $form->id, $after_entry_id, $limit );
        $workshop_map = $this->build_workshop_map();
        $kayit_map = Kongre_DB::get_kayitlar_by_form_entry_ids( wp_list_pluck( $entries, 'id' ) );
        $items = array();
        $last_seen = $after_entry_id;
        $state_token = Kongre_DB::get_state_token_for_form( $form->id );

        foreach ( $entries as $entry ) {
            $last_seen = max( $last_seen, (int) $entry->id );
            $kayit = $kayit_map[ (int) $entry->id ] ?? null;

            if ( $kayit ) {
                $items[] = $this->format_participant( $kayit, $workshop_map, $entry->created_at );
                continue;
            }

            $items[] = $this->format_fallback_entry( $entry );
        }

        return rest_ensure_response( array(
            'items'         => $items,
            'count'         => count( $items ),
            'total_participants' => Kongre_DB::count_kayitlar_for_form( $form->id ),
            'last_entry_id' => $last_seen,
            'state_token'   => $state_token,
            'generated_at'  => current_time( 'mysql' ),
        ) );
    }

    public function get_participants( $request ) {
        $form = self::get_target_form();
        if ( is_wp_error( $form ) ) {
            return $form;
        }

        $sort = Kongre_DB::normalize_sort( $request->get_param( 'sort' ) );
        $workshop_map = $this->build_workshop_map();
        $items = array();

        foreach ( Kongre_DB::get_all_kayitlar_for_form( $form->id, $sort ) as $kayit ) {
            $items[] = $this->format_participant(
                $kayit,
                $workshop_map,
                $this->get_participant_submitted_at( $kayit )
            );
        }

        return rest_ensure_response( array(
            'sort'               => $sort,
            'total_participants' => count( $items ),
            'state_token'        => Kongre_DB::get_state_token_for_form( $form->id ),
            'items'              => $items,
            'generated_at'       => current_time( 'mysql' ),
        ) );
    }

    public function get_workshops( $request ) {
        $form = self::get_target_form();
        if ( is_wp_error( $form ) ) {
            return $form;
        }

        $sort = Kongre_DB::normalize_sort( $request->get_param( 'sort' ) );
        $workshops = array();
        $grouped = array();

        foreach ( Kongre_DB::get_all_atolyeler( null, false ) as $atolye ) {
            $group_key = $atolye->tur . ':' . $atolye->atolye_no;
            if ( ! isset( $grouped[ $group_key ] ) ) {
                $grouped[ $group_key ] = array(
                    'tur'      => $atolye->tur,
                    'title'    => $atolye->tur === 'bilimsel' ? 'Bilimsel Atölye' : 'Sosyal Atölye',
                    'no'       => (int) $atolye->atolye_no,
                    'name'     => $atolye->atolye_adi,
                    'sessions' => array(),
                );
            }

            $students = array();
            foreach ( Kongre_DB::get_kayitlar_by_atolye_id_for_form( $form->id, $atolye->id, $sort ) as $kayit ) {
                $students[] = array(
                    'entry_id'        => (int) $kayit->id,
                    'form_entry_id'   => $kayit->form_entry_id ? (int) $kayit->form_entry_id : null,
                    'submitted_at'    => $this->get_participant_submitted_at( $kayit ),
                    'ad_soyad'        => $kayit->ad_soyad,
                    'donem'           => $kayit->donem,
                    'telefon'         => $kayit->telefon,
                    'email'           => $kayit->email,
                    'paket'           => $kayit->paket,
                    'katilimci_turu'  => $kayit->katilimci_turu,
                );
            }

            $grouped[ $group_key ]['sessions'][] = array(
                'id'            => (int) $atolye->id,
                'session'       => $atolye->oturum,
                'session_label' => $this->get_session_label( $atolye ),
                'capacity'      => (int) $atolye->kontenjan,
                'filled'        => (int) $atolye->dolu,
                'remaining'     => max( 0, (int) $atolye->kontenjan - (int) $atolye->dolu ),
                'active'        => (bool) $atolye->aktif,
                'students'      => $students,
            );
        }

        foreach ( $grouped as $item ) {
            usort( $item['sessions'], function( $left, $right ) {
                return strcmp( $left['session'], $right['session'] );
            } );
            $workshops[] = $item;
        }

        usort( $workshops, function( $left, $right ) {
            if ( $left['tur'] === $right['tur'] ) {
                return $left['no'] <=> $right['no'];
            }

            return strcmp( $left['tur'], $right['tur'] );
        } );

        return rest_ensure_response( array(
            'sort'         => $sort,
            'state_token'  => Kongre_DB::get_state_token_for_form( $form->id ),
            'items'        => $workshops,
            'generated_at' => current_time( 'mysql' ),
        ) );
    }

    private function build_workshop_summary( $form_id ) {
        $response = array( 'bilimsel' => array(), 'sosyal' => array() );

        foreach ( array( 'bilimsel', 'sosyal' ) as $tur ) {
            $grouped = array();
            foreach ( Kongre_DB::get_all_atolyeler( $tur, false ) as $atolye ) {
                $no = (int) $atolye->atolye_no;
                $filled = count( Kongre_DB::get_kayitlar_by_atolye_id_for_form( $form_id, $atolye->id, 'basvuru' ) );
                $remaining = max( 0, (int) $atolye->kontenjan - $filled );
                if ( ! isset( $grouped[ $no ] ) ) {
                    $grouped[ $no ] = array(
                        'no'       => $no,
                        'name'     => $atolye->atolye_adi,
                        'sessions' => array(),
                    );
                }

                $grouped[ $no ]['sessions'][] = array(
                    'session'       => $atolye->oturum,
                    'session_label' => ! empty( $atolye->oturum_label ) ? $atolye->oturum_label : $this->translate_session( $atolye->oturum ),
                    'capacity'      => (int) $atolye->kontenjan,
                    'filled'        => $filled,
                    'remaining'     => $remaining,
                    'is_full'       => $remaining <= 0,
                );
            }

            ksort( $grouped );
            $response[ $tur ] = array_values( $grouped );
        }

        return $response;
    }

    private function build_workshop_map() {
        $map = array();
        foreach ( Kongre_DB::get_all_atolyeler( null, false ) as $atolye ) {
            $map[ (int) $atolye->id ] = $atolye;
        }

        return $map;
    }

    private function format_participant( $kayit, $workshop_map, $submitted_at = null ) {
        $submitted_at = $submitted_at ?: $kayit->created_at;
        $bilimsel = $this->format_assignment(
            $workshop_map[ (int) $kayit->bilimsel_atolye_id ] ?? null,
            $kayit->bilimsel_atolye_no,
            $kayit->bilimsel_oturum,
            (bool) $kayit->fallback_bilimsel
        );
        $sosyal = $this->format_assignment(
            $workshop_map[ (int) $kayit->sosyal_atolye_id ] ?? null,
            $kayit->sosyal_atolye_no,
            $kayit->sosyal_oturum,
            (bool) $kayit->fallback_sosyal
        );

        return array(
            'entry_id'               => (int) $kayit->id,
            'form_entry_id'          => $kayit->form_entry_id ? (int) $kayit->form_entry_id : null,
            'submitted_at'           => $submitted_at,
            'ad_soyad'               => $kayit->ad_soyad,
            'email'                  => $kayit->email,
            'telefon'                => $kayit->telefon,
            'donem'                  => $kayit->donem,
            'paket'                  => $kayit->paket,
            'katilimci_turu'         => $kayit->katilimci_turu,
            'bilimsel_atolye'        => $bilimsel['text'],
            'sosyal_atolye'          => $sosyal['text'],
            'bilimsel_atolye_detay'  => $bilimsel,
            'sosyal_atolye_detay'    => $sosyal,
        );
    }

    private function format_fallback_entry( $entry ) {
        $map = get_option( 'kongre_field_map', array() );
        $data = is_array( $entry->data ) ? $entry->data : array();

        return array(
            'entry_id'               => 0,
            'form_entry_id'          => (int) $entry->id,
            'submitted_at'           => $entry->created_at,
            'ad_soyad'               => $this->find_value( $data, $map['label_ad_soyad'] ?? 'Ad Soyad' ),
            'email'                  => $this->find_value( $data, $map['label_email'] ?? 'E-posta' ),
            'telefon'                => $this->find_value( $data, $map['label_telefon'] ?? 'Telefon' ),
            'donem'                  => $this->find_value( $data, $map['label_donem'] ?? 'Dönem' ),
            'paket'                  => $this->find_value( $data, $map['label_paket'] ?? 'Paket' ),
            'katilimci_turu'         => $this->find_value( $data, $map['label_katilimci_turu'] ?? 'Katılımcı Türü' ),
            'bilimsel_atolye'        => 'Yerleştirme bekleniyor',
            'sosyal_atolye'          => 'Yerleştirme bekleniyor',
            'bilimsel_atolye_detay'  => null,
            'sosyal_atolye_detay'    => null,
        );
    }

    private function find_value( $entry_data, $search_label ) {
        $search = function_exists( 'mb_strtolower' ) ? mb_strtolower( trim( (string) $search_label ) ) : strtolower( trim( (string) $search_label ) );
        if ( $search === '' ) {
            return '';
        }

        foreach ( $entry_data as $label => $value ) {
            $normalized = function_exists( 'mb_strtolower' ) ? mb_strtolower( trim( (string) $label ) ) : strtolower( trim( (string) $label ) );
            if ( $normalized === $search ) {
                return is_scalar( $value ) ? (string) $value : '';
            }
        }

        return '';
    }

    private function format_assignment( $workshop, $atolye_no, $session, $fallback ) {
        if ( ! $atolye_no || ! $session ) {
            return array(
                'text'          => '—',
                'no'            => null,
                'name'          => '',
                'session'       => null,
                'session_label' => '',
                'fallback'      => (bool) $fallback,
            );
        }

        $name = $workshop ? $workshop->atolye_adi : sprintf( 'Atölye %d', (int) $atolye_no );
        $session_label = $workshop ? $this->get_session_label( $workshop ) : $this->translate_session( $session );
        $text = sprintf( '#%d - %s (%s)', (int) $atolye_no, $name, $session_label );
        if ( $fallback ) {
            $text .= ' [Fallback]';
        }

        return array(
            'text'          => $text,
            'no'            => (int) $atolye_no,
            'name'          => $name,
            'session'       => $session,
            'session_label' => $session_label,
            'fallback'      => (bool) $fallback,
        );
    }

    private function get_session_label( $workshop ) {
        if ( ! empty( $workshop->oturum_label ) ) {
            return $workshop->oturum_label;
        }

        return $this->translate_session( $workshop->oturum );
    }

    private function translate_session( $session ) {
        if ( $session === 'sabah' ) {
            return 'Sabah';
        }
        if ( $session === 'aksam' ) {
            return 'Akşam';
        }
        if ( $session === 'sabah+aksam' ) {
            return 'Tam Gün';
        }

        return (string) $session;
    }
}
