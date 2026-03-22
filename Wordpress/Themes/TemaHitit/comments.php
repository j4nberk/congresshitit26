<?php
/**
 * Yorum şablonu
 */
if ( post_password_required() ) {
    return;
}
?>

<div id="comments" class="comments-area">

    <?php if ( have_comments() ) : ?>
        <h2 class="text-2xl font-serif text-white mb-6">
            <?php
            $comment_count = get_comments_number();
            printf(
                _n( '%s Yorum', '%s Yorum', $comment_count, 'hitit-kongre' ),
                number_format_i18n( $comment_count )
            );
            ?>
        </h2>

        <ol class="comment-list">
            <?php
            wp_list_comments( array(
                'style'       => 'ol',
                'short_ping'  => true,
                'avatar_size' => 48,
            ));
            ?>
        </ol>

        <?php the_comments_navigation(); ?>

    <?php endif; ?>

    <?php if ( ! comments_open() && get_comments_number() && post_type_supports( get_post_type(), 'comments' ) ) : ?>
        <p class="no-comments text-gray-500 italic">Yorumlar kapatılmıştır.</p>
    <?php endif; ?>

    <?php
    comment_form( array(
        'title_reply'          => '<span class="text-2xl font-serif text-white">Yorum Yaz</span>',
        'title_reply_to'       => '<span class="text-2xl font-serif text-white">%s için Yanıt Yaz</span>',
        'label_submit'         => 'Yorum Gönder',
        'comment_notes_before' => '<p class="text-gray-500 text-sm mb-4">E-posta adresiniz yayınlanmayacaktır.</p>',
        'class_form'           => 'comment-form space-y-4',
        'class_submit'         => 'submit',
    ));
    ?>

</div>