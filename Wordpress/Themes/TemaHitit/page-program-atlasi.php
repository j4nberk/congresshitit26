<?php
/**
 * Template Name: Program Atlası (Özel Şablon)
 */

get_header();
?>

<main class="hitit-program-atlas-page">
    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
        <article <?php post_class(); ?>>
            <?php if ( function_exists( 'hitit_kongre_has_page_content' ) && hitit_kongre_has_page_content( get_the_ID() ) ) : ?>
                <?php the_content(); ?>
            <?php else : ?>
                <?php echo hitit_kongre_get_default_program_atlasi_content(); ?>
            <?php endif; ?>
        </article>
    <?php endwhile; endif; ?>
</main>

<?php get_footer(); ?>
