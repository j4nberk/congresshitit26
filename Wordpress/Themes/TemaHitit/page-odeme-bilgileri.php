<?php
/**
 * Template Name: Ödeme Bilgileri (Özel Şablon)
 */

get_header();
?>

<main class="flex-grow bg-darkBlack text-white">
    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
        <article <?php post_class( 'hitit-info-page' ); ?>>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header class="hitit-info-page__hero">
                    <p class="hitit-info-page__eyebrow">Kayıt ve Tahsilat</p>
                    <h1 class="hitit-info-page__title"><?php the_title(); ?></h1>
                    <p class="hitit-info-page__lead">
                        Havale, EFT ve ödeme teyit sürecini tek sayfada toplayan bu alan, katılımcıların dekont ve fatura adımlarını daha rahat takip etmesini sağlar.
                    </p>
                </header>

                <div class="hitit-info-page__body">
                    <?php if ( hitit_kongre_is_generated_payment_content( get_post_field( 'post_content', get_the_ID() ) ) ) : ?>
                        <?php echo hitit_kongre_get_default_payment_content(); ?>
                    <?php elseif ( hitit_kongre_has_page_content( get_the_ID() ) ) : ?>
                        <?php the_content(); ?>
                    <?php else : ?>
                        <?php echo hitit_kongre_get_default_payment_content(); ?>
                    <?php endif; ?>
                </div>
            </div>
        </article>
    <?php endwhile; endif; ?>
</main>

<?php get_footer(); ?>
