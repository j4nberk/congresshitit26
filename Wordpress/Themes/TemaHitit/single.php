<?php get_header(); ?>

<main class="flex-grow pt-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>

            <article <?php post_class(); ?>>
                <!-- Başlık -->
                <header class="mb-8">
                    <h1 class="text-4xl md:text-5xl font-serif text-white mb-4"><?php the_title(); ?></h1>
                    <div class="flex items-center gap-4 text-sm text-gray-500">
                        <time datetime="<?php echo get_the_date('c'); ?>">
                            <i class="fa-regular fa-calendar mr-1"></i>
                            <?php echo get_the_date(); ?>
                        </time>
                        <span>
                            <i class="fa-regular fa-user mr-1"></i>
                            <?php the_author(); ?>
                        </span>
                        <?php if ( has_category() ) : ?>
                            <span>
                                <i class="fa-regular fa-folder mr-1"></i>
                                <?php the_category( ', ' ); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                </header>

                <!-- Öne Çıkan Görsel -->
                <?php if ( has_post_thumbnail() ) : ?>
                    <div class="mb-8 overflow-hidden border border-white/10">
                        <?php the_post_thumbnail( 'large', array( 'class' => 'w-full h-auto' ) ); ?>
                    </div>
                <?php endif; ?>

                <!-- İçerik - Blok editör blokları buraya render edilir -->
                <div class="prose prose-invert prose-lg max-w-none
                    prose-headings:font-serif prose-headings:text-white
                    prose-p:text-gray-300
                    prose-a:text-hititGreen-500 prose-a:no-underline hover:prose-a:text-hititGreen-400
                    prose-strong:text-white
                    prose-blockquote:border-hititGreen-800 prose-blockquote:text-gray-400">
                    <?php the_content(); ?>
                </div>

                <!-- Etiketler -->
                <?php if ( has_tag() ) : ?>
                    <div class="mt-10 pt-6 border-t border-white/10">
                        <div class="flex flex-wrap gap-2">
                            <?php the_tags( '', '', '' ); ?>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Yazı Navigasyonu -->
                <nav class="mt-10 pt-6 border-t border-white/10 flex justify-between">
                    <div class="text-sm">
                        <?php previous_post_link( '<span class="text-gray-500">← Önceki</span><br><span class="text-hititGreen-500">%link</span>' ); ?>
                    </div>
                    <div class="text-sm text-right">
                        <?php next_post_link( '<span class="text-gray-500">Sonraki →</span><br><span class="text-hititGreen-500">%link</span>' ); ?>
                    </div>
                </nav>
            </article>

            <!-- Yorumlar -->
            <?php if ( comments_open() || get_comments_number() ) : ?>
                <div class="mt-12 pt-8 border-t border-white/10">
                    <?php comments_template(); ?>
                </div>
            <?php endif; ?>

        <?php endwhile; endif; ?>

    </div>
</main>

<?php get_footer(); ?>