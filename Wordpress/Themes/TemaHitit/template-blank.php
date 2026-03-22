<?php
/**
 * Template Name: Boş Sayfa
 * Description: Header ve footer olmadan sadece blok editör içeriği gösterir.
 *              Form sayfaları, landing page'ler için idealdir.
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> class="scroll-smooth">
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class('antialiased'); ?>>
<?php wp_body_open(); ?>

    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
        <?php the_content(); ?>
    <?php endwhile; endif; ?>

    <?php wp_footer(); ?>
</body>
</html>