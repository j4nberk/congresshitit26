<?php get_header(); ?>

<main class="flex-grow pt-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        
        <div class="green-glow-bg py-16">
            <div class="text-8xl font-serif text-hititGreen-800 mb-6">404</div>
            <h1 class="text-3xl md:text-4xl font-serif text-white mb-4">Sayfa Bulunamadı</h1>
            <p class="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            </p>
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>" 
               class="inline-block px-8 py-3 bg-hititGreen-800 hover:bg-hititGreen-700 text-white font-serif italic border border-hititGreen-600 transition-all duration-300 no-underline">
                Ana Sayfaya Dön
            </a>
        </div>

    </div>
</main>

<?php get_footer(); ?>