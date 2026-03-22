<footer class="bg-cardBlack border-t border-white/10 pt-16 pb-8 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div class="col-span-1 md:col-span-2">
                    <h3 class="text-2xl font-serif text-white mb-4"><?php bloginfo( 'name' ); ?></h3>
                    <p id="hitit-footer-desc" class="text-gray-500 text-sm max-w-sm mb-6">
                        <?php
                        $footer_desc = get_theme_mod( 'hitit_footer_description', '' );
                        echo esc_html( $footer_desc ? $footer_desc : get_bloginfo( 'description' ) );
                        ?>
                    </p>

                    <?php
                    // Sosyal medya ikonları (Customizer'dan)
                    $socials = array(
                        'instagram' => 'fa-instagram',
                        'twitter'   => 'fa-x-twitter',
                        'youtube'   => 'fa-youtube',
                        'linkedin'  => 'fa-linkedin-in',
                        'facebook'  => 'fa-facebook-f',
                    );
                    $has_social = false;
                    foreach ( $socials as $key => $icon ) {
                        if ( get_theme_mod( 'hitit_social_' . $key, '' ) ) { $has_social = true; break; }
                    }
                    if ( $has_social ) : ?>
                        <div class="flex space-x-4 mb-6">
                            <?php foreach ( $socials as $key => $icon ) :
                                $url = get_theme_mod( 'hitit_social_' . $key, '' );
                                if ( $url ) : ?>
                                    <a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener noreferrer" class="w-9 h-9 border border-white/10 flex items-center justify-center text-gray-400 hover:text-hititGreen-500 hover:border-hititGreen-700 transition-colors no-underline">
                                        <i class="fa-brands <?php echo esc_attr( $icon ); ?>"></i>
                                    </a>
                                <?php endif;
                            endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <?php if ( has_nav_menu( 'footer' ) ) : ?>
                        <?php
                        wp_nav_menu( array(
                            'theme_location' => 'footer',
                            'container'      => false,
                            'menu_class'     => 'flex space-x-4 text-sm',
                            'fallback_cb'    => false,
                            'depth'          => 1,
                        ));
                        ?>
                    <?php endif; ?>
                </div>

                <div class="col-span-1 md:col-span-2">
                    <h4 class="text-white font-serif text-lg mb-6">İletişim</h4>
                    <?php if ( is_active_sidebar( 'footer-widgets' ) ) : ?>
                        <?php dynamic_sidebar( 'footer-widgets' ); ?>
                    <?php else : ?>
                        <address class="not-italic text-sm text-gray-400 space-y-4">
                            <?php $address = get_theme_mod( 'hitit_footer_address', 'Çorum Hitit Üniversitesi Erol Olçok Eğitim ve Araştırma Hastanesi' ); ?>
                            <?php if ( $address ) : ?>
                                <div class="flex items-start gap-3">
                                    <i class="fa-solid fa-location-dot text-hititGreen-600 mt-1"></i>
                                    <span id="hitit-footer-address"><?php echo esc_html( $address ); ?></span>
                                </div>
                            <?php endif; ?>

                            <?php $email = get_theme_mod( 'hitit_footer_email', 'iletisim@hitittipkongresi.com' ); ?>
                            <?php if ( $email ) : ?>
                                <div class="flex items-center gap-3">
                                    <i class="fa-solid fa-envelope text-hititGreen-600"></i>
                                    <a id="hitit-footer-email" href="mailto:<?php echo esc_attr( $email ); ?>" class="text-gray-400 hover:text-hititGreen-500 transition-colors no-underline"><?php echo esc_html( $email ); ?></a>
                                </div>
                            <?php endif; ?>

                            <?php $phone = get_theme_mod( 'hitit_footer_phone', '' ); ?>
                            <?php if ( $phone ) : ?>
                                <div class="flex items-center gap-3">
                                    <i class="fa-solid fa-phone text-hititGreen-600"></i>
                                    <a id="hitit-footer-phone" href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $phone ) ); ?>" class="text-gray-400 hover:text-hititGreen-500 transition-colors no-underline"><?php echo esc_html( $phone ); ?></a>
                                </div>
                            <?php endif; ?>
                        </address>
                    <?php endif; ?>
                </div>
            </div>
            <div class="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-6">
                    <?php $footer_logo = get_theme_mod( 'hitit_footer_logo', '' ); ?>
                    <?php if ( $footer_logo ) : ?>
                        <img src="<?php echo esc_url( $footer_logo ); ?>" alt="<?php bloginfo( 'name' ); ?>" class="h-10 md:h-12 w-auto opacity-70">
                    <?php endif; ?>
                    
                    <div class="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-gray-500">
                        <?php 
                        $agreement_text = get_theme_mod( 'hitit_footer_agreement_text', 'Mesafeli Satış Sözleşmesi' );
                        $agreement_url  = get_theme_mod( 'hitit_footer_agreement_url', '' );
                        if ( $agreement_url && $agreement_text ) : ?>
                            <a href="<?php echo esc_url( $agreement_url ); ?>" class="hover:text-hititGreen-500 transition-colors" target="_blank"><?php echo esc_html( $agreement_text ); ?></a>
                        <?php endif; ?>

                        <?php 
                        $kvkk_text = get_theme_mod( 'hitit_footer_kvkk_text', 'KVKK Aydınlatma Metni' );
                        $kvkk_url  = get_theme_mod( 'hitit_footer_kvkk_url', '' );
                        if ( $kvkk_url && $kvkk_text ) : ?>
                            <a href="<?php echo esc_url( $kvkk_url ); ?>" class="hover:text-hititGreen-500 transition-colors" target="_blank"><?php echo esc_html( $kvkk_text ); ?></a>
                        <?php endif; ?>
                    </div>
                </div>

                <p id="hitit-footer-copyright" class="text-xs text-gray-600 text-center md:text-right">
                    <?php
                    $copyright = get_theme_mod( 'hitit_footer_copyright', '' );
                    if ( $copyright ) {
                        echo esc_html( $copyright );
                    } else {
                        echo '&copy; ' . date('Y') . ' ' . get_bloginfo( 'name' ) . '. Tüm hakları saklıdır.';
                    }
                    ?>
                </p>
            </div>
        </div>
    </footer>
    
    <?php wp_footer(); ?>
</body>
</html>