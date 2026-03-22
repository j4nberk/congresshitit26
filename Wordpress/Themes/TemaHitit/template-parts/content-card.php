<?php
/**
 * Template Part: İçerik Kartı
 * Arşiv ve blog sayfalarında kullanılır
 */
?>
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
        <span class="mx-2">·</span>
        <span><?php the_author(); ?></span>
    </div>

    <p class="text-gray-400 text-sm mb-4"><?php the_excerpt(); ?></p>

    <a href="<?php the_permalink(); ?>" class="text-hititGreen-500 text-sm uppercase tracking-wider hover:text-hititGreen-400 transition-colors no-underline">
        Devamını Oku &rarr;
    </a>
</article>