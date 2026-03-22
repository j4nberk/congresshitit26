<?php
/**
 * Template Name: Paketlerimiz (Özel Şablon)
 */

get_header();
?>

<main class="flex-grow bg-darkBlack text-white">
    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
        <article <?php post_class( 'hitit-info-page' ); ?>>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header class="hitit-info-page__hero">
                    <p class="hitit-info-page__eyebrow">Kongre Kayıt Paketleri</p>
                    <h1 class="hitit-info-page__title"><?php the_title(); ?></h1>
                    <p class="hitit-info-page__lead">
                        Katılım şekline göre planlanmış paketleri bu sayfada sunabilir, kart içeriklerini WordPress yönetim panelinden dilediğiniz zaman güncelleyebilirsiniz.
                    </p>
                </header>

                <div class="hitit-info-page__body">
                    <?php if ( hitit_kongre_has_page_content( get_the_ID() ) ) : ?>
                        <?php the_content(); ?>
                    <?php else : ?>
                        <?php echo hitit_kongre_get_default_packages_content(); ?>
                    <?php endif; ?>
                </div>
            </div>
        </article>
    <?php endwhile; endif; ?>
</main>

<?php get_footer(); ?>
