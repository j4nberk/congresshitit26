<?php get_header(); ?>

<main class="flex-grow pt-20">

    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>

        <article <?php post_class(); ?>>
            <?php the_content(); ?>
        </article>

    <?php endwhile; endif; ?>

</main>

<?php get_footer(); ?>