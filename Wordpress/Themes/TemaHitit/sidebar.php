<?php
/**
 * Sidebar şablonu
 */
if ( ! is_active_sidebar( 'sidebar-1' ) ) {
    return;
}
?>

<aside class="w-full lg:w-80 flex-shrink-0">
    <?php dynamic_sidebar( 'sidebar-1' ); ?>
</aside>