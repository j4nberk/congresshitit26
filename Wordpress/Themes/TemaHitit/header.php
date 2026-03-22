<!DOCTYPE html>
<html <?php language_attributes(); ?> class="scroll-smooth">
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- LCP kritik fontları preload — tarayıcı CSS parse'ı beklemeden indirmeye başlar -->
    <link rel="preload" href="<?php echo esc_url( get_template_directory_uri() . '/assets/fonts/playfair-700.woff2' ); ?>" as="font" type="font/woff2" crossorigin fetchpriority="high">
    <link rel="preload" href="<?php echo esc_url( get_template_directory_uri() . '/assets/fonts/inter-400.woff2' ); ?>" as="font" type="font/woff2" crossorigin fetchpriority="high">

    <?php
    // ── Kritik CSS'leri inline olarak yerleştir ──
    $fonts_css    = get_template_directory() . '/assets/css/google-fonts-local.css';
    $fa_css       = get_template_directory() . '/assets/css/fontawesome-local.css';
    $style_css    = get_template_directory() . '/style.css';
    $fonts_dir    = esc_url( get_template_directory_uri() . '/assets/fonts/' );
    $webfonts_dir = esc_url( get_template_directory_uri() . '/assets/webfonts/' );
    ?>
    <style id="hitit-critical-css">
        /* ── CLS önleyici: Tailwind yüklenmeden önce layout garantisi ── */
        .pt-20 { padding-top: 5rem; }
        .flex-grow { flex-grow: 1; }
        .min-h-screen { min-height: 100vh; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .overflow-x-hidden { overflow-x: hidden; }
        .fixed { position: fixed; }
        .w-full { width: 100%; }
        .z-50 { z-index: 50; }
        .h-20 { height: 5rem; }
        .hidden { display: none; }
        .antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

        /* ── Temel renkler ── */
        body { background-color: #050505; color: #e5e5e5; margin: 0; }
        .glow-text { text-shadow: 0 0 20px rgba(22, 101, 52, 0.5); }
        .green-glow-bg { background: radial-gradient(circle at center, rgba(22, 101, 52, 0.25) 0%, rgba(5, 5, 5, 0) 70%); }
        .border-gradient { border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease; }
        .border-gradient:hover { border-color: #166534; background-color: rgba(22, 101, 52, 0.05); }
        .schedule-scroll::-webkit-scrollbar { width: 6px; }
        .schedule-scroll::-webkit-scrollbar-track { background: #0a0a0a; }
        .schedule-scroll::-webkit-scrollbar-thumb { background: #166534; border-radius: 3px; }

        /* ── WordPress menü stiller ── */
        .hitit-nav-menu { list-style: none; display: flex; align-items: center; gap: 1.5rem; margin: 0; padding: 0; }
        .hitit-nav-menu li a { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #d4d4d4; text-decoration: none; transition: color 0.2s; }
        .hitit-nav-menu li a:hover, .hitit-nav-menu li.current-menu-item a, .hitit-nav-menu li.current_page_item a { color: #22c55e; }
        .hitit-mobile-menu { list-style: none; margin: 0; padding: 0; }
        .hitit-mobile-menu li a { display: block; padding: 0.5rem 0.75rem; font-size: 1rem; color: #d4d4d4; text-decoration: none; }
        .hitit-mobile-menu li a:hover, .hitit-mobile-menu li.current-menu-item a, .hitit-mobile-menu li.current_page_item a { color: #ffffff; background: rgba(255,255,255,0.05); }

        /* ── Inline SVG ikon stiller ── */
        .hitit-icon { display: inline-block; vertical-align: middle; fill: currentColor; }

        /* ── Google Fonts — @font-face (inline) ── */
        <?php
        if ( file_exists( $fonts_css ) ) {
            $css = file_get_contents( $fonts_css );
            $css = str_replace( "url('../fonts/", "url('" . $fonts_dir, $css );
            $css = preg_replace( '/\/\*[\s\S]*?\*\//', '', $css );
            echo $css;
        }
        ?>

        /* ── style.css (inline — render-blocking kaldırıldı) ── */
        <?php
        if ( file_exists( $style_css ) ) {
            $css = file_get_contents( $style_css );
            // Theme header comment'i kaldır
            $css = preg_replace( '/\/\*[\s\S]*?\*\//', '', $css, 1 );
            echo $css;
        }
        ?>
    </style>

    <?php wp_head(); ?>
</head>
<body <?php body_class('antialiased overflow-x-hidden flex flex-col min-h-screen'); ?>>
<?php wp_body_open(); ?>

    <nav class="fixed w-full z-50 bg-darkBlack/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">

                <!-- Logo -->
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="flex-shrink-0 flex items-center gap-3 no-underline">
                    <?php
                    $site_icon_id  = get_option( 'site_icon' );
                    $custom_logo   = has_custom_logo();
                    ?>

                    <?php if ( $custom_logo ) : ?>
                        <?php the_custom_logo(); ?>
                    <?php elseif ( $site_icon_id ) : ?>
                        <img src="<?php echo esc_url( wp_get_attachment_image_url( $site_icon_id, 'full' ) ); ?>" alt="<?php bloginfo( 'name' ); ?>" class="h-10 w-auto" width="40" height="40">
                        <div class="hidden md:block">
                            <span id="hitit-header-subtitle" class="block text-sm text-gray-400 font-sans tracking-widest uppercase"><?php echo esc_html( get_theme_mod( 'hitit_header_subtitle', 'Hitit Üniversitesi' ) ); ?></span>
                            <span class="block text-lg font-serif font-bold text-white leading-none"><?php bloginfo( 'name' ); ?></span>
                        </div>
                    <?php else : ?>
                        <?php if ( get_theme_mod( 'hitit_show_logo_icon', true ) ) : ?>
                            <div class="w-10 h-10 border border-hititGreen-800 flex items-center justify-center bg-hititGreen-950">
                                <!-- Staff-snake SVG (inline — FA font dosyası gereksiz) -->
                                <svg class="hitit-icon text-hititGreen-500" width="20" height="20" viewBox="0 0 384 512" aria-hidden="true"><path d="M222.6 43.2l-.1 4.8H288c53 0 96 43 96 96s-43 96-96 96H248V160h40c17.7 0 32-14.3 32-32s-14.3-32-32-32H222.5l-.1 3.2c-.5 20.4-2.1 40.7-4.9 60.8H288c70.7 0 128 57.3 128 128s-57.3 128-128 128H248V336h40c35.3 0 64-28.7 64-64s-28.7-64-64-64H207.5c-6 32.5-14.4 64.3-25.4 95.1c-9.5 26.5-2.3 56.1 17.9 73.6l25 21.6c9.5 8.2 10.5 22.6 2.3 32.1s-22.6 10.5-32.1 2.3l-25-21.6c-33.1-28.6-44.8-76.9-29.3-120.4c10.3-28.9 18.2-58.7 23.5-89.2H128c-70.7 0-128-57.3-128-128S57.3 48 128 48h48.2c2.8-15.5 4.5-31.2 4.9-47.2l.1-4.8 41.4 0zM128 128c-35.3 0-64 28.7-64 64s28.7 64 64 64h50.3c2.2-21.2 3-42.6 2.4-64H128c-17.7 0-32 14.3-32 32s14.3 32 32 32h40v80H128c-53 0-96-43-96-96s43-96 96-96h56.4c-.3-10.6-1-21.2-2-31.8l-.4-4.2H128z"/></svg>
                            </div>
                        <?php endif; ?>
                        <div class="hidden md:block">
                            <span id="hitit-header-subtitle" class="block text-sm text-gray-400 font-sans tracking-widest uppercase"><?php echo esc_html( get_theme_mod( 'hitit_header_subtitle', 'Hitit Üniversitesi' ) ); ?></span>
                            <span class="block text-lg font-serif font-bold text-white leading-none"><?php bloginfo( 'name' ); ?></span>
                        </div>
                    <?php endif; ?>
                </a>

                <!-- Desktop Menü -->
                <div class="hidden lg:flex items-center space-x-6">
                    <?php
                    if ( has_nav_menu( 'primary' ) ) {
                        wp_nav_menu( array(
                            'theme_location' => 'primary',
                            'container'      => false,
                            'menu_class'     => 'hitit-nav-menu',
                            'depth'          => 1,
                        ));
                    } else {
                        echo '<ul class="hitit-nav-menu">';
                        wp_list_pages( array(
                            'title_li' => '',
                            'depth'    => 1,
                            'sort_column' => 'menu_order, post_title',
                        ));
                        echo '</ul>';
                    }

                    $cta_text = get_theme_mod( 'hitit_header_cta_text', '' );
                    $cta_url  = get_theme_mod( 'hitit_header_cta_url', '#' );
                    if ( $cta_text ) : ?>
                        <a id="hitit-header-cta" href="<?php echo esc_url( $cta_url ); ?>" class="ml-4 px-5 py-2 bg-hititGreen-800 border border-hititGreen-700 text-white text-xs uppercase tracking-widest hover:bg-hititGreen-700 transition-colors no-underline">
                            <?php echo esc_html( $cta_text ); ?>
                        </a>
                    <?php endif;
                    ?>
                </div>

                <!-- Mobil Menü Butonu -->
                <div class="lg:hidden">
                    <button id="mobile-menu-btn" class="text-gray-300 hover:text-white focus:outline-none p-2" aria-label="Menü">
                        <!-- Bars SVG (inline — FA font dosyası gereksiz) -->
                        <svg class="hitit-icon" width="24" height="24" viewBox="0 0 448 512" aria-hidden="true"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Mobil Menü -->
        <div id="mobile-menu" class="mobile-menu-transition hidden lg:hidden bg-cardBlack border-b border-white/10 absolute w-full">
            <div class="px-2 pt-2 pb-3">
                <?php
                if ( has_nav_menu( 'mobile' ) ) {
                    wp_nav_menu( array(
                        'theme_location' => 'mobile',
                        'container'      => false,
                        'menu_class'     => 'hitit-mobile-menu',
                        'depth'          => 1,
                    ));
                } else {
                    echo '<ul class="hitit-mobile-menu">';
                    wp_list_pages( array(
                        'title_li' => '',
                        'depth'    => 1,
                        'sort_column' => 'menu_order, post_title',
                    ));
                    echo '</ul>';
                }
                ?>
            </div>
        </div>
    </nav>
