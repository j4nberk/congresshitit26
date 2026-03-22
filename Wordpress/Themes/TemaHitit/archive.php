<?php get_header(); ?>

<main class="flex-grow pt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <header class="mb-12">
            <h1 class="text-3xl md:text-4xl font-serif text-white mb-2">
                <?php the_archive_title(); ?>
            </h1>
            <?php the_archive_description( '<p class="text-gray-400 text-lg">', '</p>' ); ?>
        </header>

        <?php if ( have_posts() ) : ?>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php while ( have_posts() ) : the_post(); ?>

                    <article <?php post_class('border-gradient bg-cardBlack p-6'); ?>>
                        <?php if ( has_post_thumbnail() ) : ?>
                            <a href="<?php the_permalink(); ?>" class="block mb-4 overflow-hidden">
                                <?php the_post_thumbnail( 'medium_large', array( 'class' => 'w-full h-48 object-cover' ) ); ?>
                            </a>
                        <?php endif; ?>

                        <h2 class="text-xl font-serif text-white mb-2">
                            <a href="<?php the_permalink(); ?>" class="hover:text-hititGreen-500 transition-colors no-underline text-white">
                                <?php the_title(); ?>
                            </a>
                        </h2>

                        <div class="text-xs text-gray-600 mb-3">
                            <time datetime="<?php echo get_the_date('c'); ?>"><?php echo get_the_date(); ?></time>
                        </div>

                        <p class="text-gray-400 text-sm mb-4"><?php the_excerpt(); ?></p>

                        <a href="<?php the_permalink(); ?>" class="text-hititGreen-500 text-sm uppercase tracking-wider hover:text-hititGreen-400 transition-colors no-underline">
                            Devamını Oku &rarr;
                        </a>
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
                <h2 class="text-3xl font-serif text-white mb-4">İçerik Bulunamadı</h2>
                <p class="text-gray-400">Bu kategoride henüz yayınlanmış bir içerik yok.</p>
            </div>

        <?php endif; ?>

    </div>
</main>

<?php get_footer(); ?>