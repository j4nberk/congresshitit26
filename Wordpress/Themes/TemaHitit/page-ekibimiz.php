<?php
/**
 * Template Name: Ekibimiz (Özel Şablon)
 */

// ============================================
// EKİP ÜYELERİ LİSTESİ (Burayı Düzenleyin)
// ============================================
// Her üye için bir array() ekleyin.
// 'name'  => İsim Soyisim
// 'title' => Ünvan / Görev (Örn: Kongre Başkanı)
// 'desc'  => Alt Açıklama (Örn: Tıp Fakültesi Dekanı)
// 'image' => Fotoğraf URL'si (Boş bırakırsanız varsayılan ikon çıkar)
// ============================================

$team_members = array(
    // 1. KİŞİ (Sol Üst - Büyük)
    array(
        'name'  => 'Doç. Dr. Veysel Barış TURHAN',
        'title' => 'Kongre Başkanı',
        'desc'  => 'Hitit Üniversitesi Genel Cerrahi',
        'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/VBT.png', // Örn: get_template_directory_uri() . '/assets/images/baskan.jpg'
    ),
    // 2. KİŞİ (Sağ Üst - Büyük)
    array(
        'name'  => 'Doç. Dr. Ertuğrul Gazi ALKURT',
        'title' => 'Kongre Başkan Yardımcısı',
        'desc'  => 'Hitit Üniversitesi Cerrahi Onkoloji',
        'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/EGA.png',
    ),
    // 3. KİŞİ (Alt Liste Başlar...)
    array(
        'name'  => 'Yiğitcan SAÇILIK',
        'title' => 'Kongre Sosyal Program Başkanı',
        'desc'  => 'Tıp Fakültesi',
        'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Yigitcan-Sacilik-e1770992743824.jpg',
    ),
    // Geri kalan 14 kişi (Toplam 17 olması için placeholderlar)
    array( 'name' => 'Cihan Ali ÇOBAN', 'title' => 'Kongre Sosyal Program Başkan Yardımcısı', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Cihan-Ali-Coban-scaled-e1770989733813.jpg' ),
    array( 'name' => 'Ömer Faruk KAYA', 'title' => 'Kongre Bilimsel Program Başkanı', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Omer-Faruk-Kaya-scaled-e1770989837683.jpeg' ),
    array( 'name' => 'Fırat OLAM', 'title' => 'Kongre Bilimsel Program Başkan Yardımcısı', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Firat-Olam-e1770989910253.jpg' ),
    array( 'name' => 'Zeynep Tuana SEZİŞLİ', 'title' => 'Kongre Genel Sekreteri', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Zeynep-Tuana-Sezisli-e1770989966687.jpeg' ),
    array( 'name' => 'Miray Yıldız CİVELEK', 'title' => 'Kongre Genel Sekreteri', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Miray-Yildiz-Civelek-scaled-e1770990015198.jpg' ),
    array( 'name' => 'Feyza DUMAN', 'title' => 'Kongre Akademik Sorumlusu', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Feyza-Duman-scaled-e1770990066218.jpg' ),
    array( 'name' => 'Adem Janberk ERSAN', 'title' => 'Kongre İletişim ve Bilgi-İşlem Sorumlusu', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Adem-Janberk-Ersan-scaled-e1770990105754.jpg' ),
    array( 'name' => 'Nisanur BİLGİN', 'title' => 'Kongre Atölyeler Sorumlusu', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Nisanur-Bilgin-scaled-e1770990166186.jpg' ),
    array( 'name' => 'Hatice Kübra KAZANCI', 'title' => 'Kongre Sosyal Medya Sorumlusu', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Hatice-Kubra-Kazanci-e1770990211247.jpg' ),
    array( 'name' => 'Ayşenur YALÇIN', 'title' => 'Kongre Sosyal Medya Sorumlusu', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Aysenur-Yalcin-e1770990371445.jpg' ),
    array( 'name' => 'Amirtaha SHAHNAVAZI', 'title' => 'Kongre Organizasyon Ekibi Sorumlusu', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Amirtaha-Shahnavazi-e1770990425334.jpeg' ),
    array( 'name' => 'Semih Bera UZ', 'title' => 'Kongre Organizasyon Ekibi Sorumlusu', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Semih-Bera-Uz-scaled-e1770990462977.jpg' ),
    array( 'name' => 'Ebubekir PARLAK', 'title' => 'Hitit Tıp Akademisi Kulübü Başkanı', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Ebubekir-Parlak-e1770990501194.jpg' ),
    array( 'name' => 'Taha ÇİMENLİ', 'title' => 'Hitit Tıp Akademisi Kulübü Başkan Yardımcısı', 'desc' => 'Tıp Fakültesi', 'image' => 'https://congresshitit.com.tr/wp-content/uploads/2026/02/Taha-Cimenli-e1770990564444.jpg' ),
);

// Ayrıştırma
$leaders = array_slice($team_members, 0, 2);
$others  = array_slice($team_members, 2);

get_header(); 
?>

<main class="flex-grow bg-darkBlack text-white">

    <!-- Inline Style to bypass Cache issues -->
    <style>
        .ekibimiz-spacer { padding-top: 10rem !important; } /* Desktop: 160px */
        @media (max-width: 768px) {
            .ekibimiz-spacer { padding-top: 9rem !important; } /* Mobile: 144px (Biraz daha artırdım) */
        }
    </style>
    
    <!-- Hero / Başlık Kısmı -->
    <div class="ekibimiz-spacer pb-12 px-4 text-center">
        <h1 class="text-4xl md:text-5xl font-serif font-bold text-white mb-4 glow-text">Ekibimiz</h1>
        <p class="text-gray-400 text-lg max-w-2xl mx-auto font-light">Kongremizin gerçekleşmesinde emeği geçen düzenleme kurulu ve organizasyon ekibimiz.</p>
        <div class="w-24 h-1 bg-hititGreen-600 mx-auto mt-8 rounded-full"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        <!-- 1. BÖLÜM: Liderler (2 Kişi yan yana) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            <?php foreach ($leaders as $person) : 
                $img_url = !empty($person['image']) ? $person['image'] : get_template_directory_uri() . '/assets/images/placeholder-user.png';
            ?>
            <div class="group relative bg-cardBlack border border-white/10 p-8 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:border-hititGreen-600 hover:shadow-2xl hover:shadow-hititGreen-900/20 text-center">
                <div class="w-40 h-40 mx-auto mb-6 rounded-full border-2 border-hititGreen-600 p-1 bg-hititGreen-950/30 group-hover:bg-hititGreen-900/50 transition-colors">
                    <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr($person['name']); ?>" class="w-full h-full object-cover rounded-full" loading="lazy">
                </div>
                <h3 class="text-2xl font-serif text-white mb-2 group-hover:text-hititGreen-400 transition-colors"><?php echo esc_html($person['name']); ?></h3>
                <p class="text-hititGreen-500 font-medium text-sm result text-uppercase tracking-wider mb-2"><?php echo esc_html($person['title']); ?></p>
                <p class="text-gray-400 font-light text-sm"><?php echo esc_html($person['desc']); ?></p>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- 2. BÖLÜM: Diğer Üyeler (3'lü Grid) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <?php foreach ($others as $person) : 
                $img_url = !empty($person['image']) ? $person['image'] : get_template_directory_uri() . '/assets/images/placeholder-user.png';
            ?>
            <div class="group relative bg-cardBlack border border-white/10 p-6 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:border-hititGreen-600 hover:shadow-xl hover:shadow-hititGreen-900/10 text-center">
                <div class="w-32 h-32 mx-auto mb-4 rounded-full border-2 border-hititGreen-600/50 p-1 bg-hititGreen-950/20 group-hover:bg-hititGreen-900/40 transition-colors">
                    <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr($person['name']); ?>" class="w-full h-full object-cover rounded-full" loading="lazy">
                </div>
                <!-- İsim biraz daha küçük -->
                <h3 class="text-xl font-serif text-white mb-1 group-hover:text-hititGreen-400 transition-colors"><?php echo esc_html($person['name']); ?></h3>
                <p class="text-hititGreen-500/80 font-medium text-xs uppercase tracking-wider mb-2"><?php echo esc_html($person['title']); ?></p>
                <p class="text-gray-500 font-light text-sm"><?php echo esc_html($person['desc']); ?></p>
            </div>
            <?php endforeach; ?>
        </div>

    </div>
</main>

<?php get_footer(); ?>
