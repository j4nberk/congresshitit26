<?php get_header(); ?>

<main class="flex-grow pt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <header class="mb-12">
            <h1 class="text-3xl md:text-4xl font-serif text-white mb-2">
                "<?php echo get_search_query(); ?>" için arama sonuçları
            </h1>
            <p class="text-gray-500"><?php global $wp_query; echo $wp_query->found_posts; ?> sonuç bulundu</p>
        </header>

        <?php if ( have_posts() ) : ?>

            <div class="space-y-6">
                <?php while ( have_posts() ) : the_post(); ?>

                    <article <?php post_class('border-gradient bg-cardBlack p-6 flex gap-6'); ?>>
                        <?php if ( has_post_thumbnail() ) : ?>
                            <a href="<?php the_permalink(); ?>" class="flex-shrink-0 hidden sm:block">
                                <?php the_post_thumbnail( 'thumbnail', array( 'class' => 'w-24 h-24 object-cover' ) ); ?>
                            </a>
                        <?php endif; ?>
                        <div>
                            <h2 class="text-xl font-serif text-white mb-2">
                                <a href="<?php the_permalink(); ?>" class="hover:text-hititGreen-500 transition-colors no-underline text-white">
                                    <?php the_title(); ?>
                                </a>
                            </h2>
                            <p class="text-gray-400 text-sm"><?php the_excerpt(); ?></p>
                        </div>
                    </article>

                <?php endwhile; ?>
            </div>

            <div class="mt-12 flex justify-center">
                <?php the_posts_pagination( array(
                    'mid_size'  => 2,
                    'prev_text' => '&laquo; Önceki',
                    'next_text' => 'Sonraki &raquo;',
                )); ?>
            </div>

        <?php else : ?>

            <div class="text-center py-20">
                <h2 class="text-2xl font-serif text-white mb-4">Sonuç Bulunamadı</h2>
                <p class="text-gray-400 mb-8">Farklı anahtar kelimelerle tekrar deneyin.</p>
                <?php get_search_form(); ?>
            </div>

        <?php endif; ?>

    </div>
</main>

<?php get_footer(); ?>