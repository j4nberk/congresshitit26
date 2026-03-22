/**
 * Hitit Kongre - Customizer Canlı Önizleme
 * Görünüm → Özelleştir'de değişiklikler anında sayfada görünür.
 */
( function( $ ) {

    // Header - Logo üstü yazı
    wp.customize( 'hitit_header_subtitle', function( value ) {
        value.bind( function( newVal ) {
            $( '#hitit-header-subtitle' ).text( newVal );
        });
    });

    // Header - CTA Buton yazısı
    wp.customize( 'hitit_header_cta_text', function( value ) {
        value.bind( function( newVal ) {
            var $btn = $( '#hitit-header-cta' );
            if ( newVal ) {
                $btn.text( newVal ).show();
            } else {
                $btn.hide();
            }
        });
    });

    // Footer - Açıklama
    wp.customize( 'hitit_footer_description', function( value ) {
        value.bind( function( newVal ) {
            $( '#hitit-footer-desc' ).text( newVal || '' );
        });
    });

    // Footer - Adres
    wp.customize( 'hitit_footer_address', function( value ) {
        value.bind( function( newVal ) {
            $( '#hitit-footer-address' ).text( newVal );
        });
    });

    // Footer - E-posta
    wp.customize( 'hitit_footer_email', function( value ) {
        value.bind( function( newVal ) {
            $( '#hitit-footer-email' ).text( newVal ).attr( 'href', 'mailto:' + newVal );
        });
    });

    // Footer - Telefon
    wp.customize( 'hitit_footer_phone', function( value ) {
        value.bind( function( newVal ) {
            $( '#hitit-footer-phone' ).text( newVal ).attr( 'href', 'tel:' + newVal.replace( /[^0-9+]/g, '' ) );
        });
    });

    // Footer - Telif hakkı
    wp.customize( 'hitit_footer_copyright', function( value ) {
        value.bind( function( newVal ) {
            if ( newVal ) {
                $( '#hitit-footer-copyright' ).text( newVal );
            }
        });
    });

})( jQuery );