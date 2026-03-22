/**
 * Hitit Kongre Tema - Ana JavaScript
 */
(function () {
    'use strict';

    // ============================================
    // MOBİL MENÜ TOGGLE (ANİMASYONLU)
    // ============================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            if (mobileMenu.classList.contains('hidden')) {
                // AÇILIŞ
                mobileMenu.classList.remove('hidden');

                // Reflow force et
                void mobileMenu.offsetWidth;

                requestAnimationFrame(() => {
                    mobileMenu.classList.add('is-open');
                });
            } else {
                // KAPANIŞ
                mobileMenu.classList.remove('is-open');

                // Animasyon bitince hidden ekle
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                }, 300);
            }

            // İkon değiştir (Inline SVG için path manipülasyonu gerekebilir veya basitçe class toggle)
            // Ancak şimdilik projenin orijinal yapısındaki inline SVG'yi koruyoruz.
            // SVG path'ini değiştirmek karmaşık olacağından, sadece rotasyon animasyonu ekleyelim.
            const svg = mobileMenuBtn.querySelector('svg');
            if (svg) {
                if (mobileMenu.classList.contains('hidden')) {
                    // Menü kapalı (isHidden true idi, şimdi açılacak) -> Düz dur
                    svg.style.transform = 'rotate(0deg)';
                } else {
                    // Menü açık (isHidden false idi, şimdi kapanacak) -> Dön
                    svg.style.transition = 'transform 0.3s';
                    svg.style.transform = 'rotate(90deg)';
                }
            }
        });

        // Menü dışına tıklayınca kapat
        document.addEventListener('click', function (e) {
            if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.remove('is-open');
                    setTimeout(() => {
                        mobileMenu.classList.add('hidden');
                    }, 300);

                    const svg = mobileMenuBtn.querySelector('svg');
                    if (svg) {
                        svg.style.transform = 'rotate(0deg)';
                    }
                }
            }
        });
    }

    // ============================================
    // SCROLL'DA NAVBAR STİL DEĞİŞİMİ
    // ============================================
    const navbar = document.querySelector('nav.fixed');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                navbar.classList.add('shadow-2xl');
                navbar.style.borderBottomColor = 'rgba(22, 101, 52, 0.3)';
            } else {
                navbar.classList.remove('shadow-2xl');
                navbar.style.borderBottomColor = '';
            }
        });
    }

    // ============================================
    // SMOOTH SCROLL (Anchor linkler için)
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 100; // navbar yüksekliği
                const targetPos = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        });
    });

    // ============================================
    // SAYFA YÜKLENME ANİMASYONU
    // ============================================
    window.addEventListener('load', function () {
        document.body.classList.add('loaded');
    });

    // ============================================
    // ÖDEME TABLOLARI - DROPDOWN PANEL GEÇİŞİ
    // ============================================
    const paymentSwitchers = document.querySelectorAll('[data-payment-switcher]');

    paymentSwitchers.forEach(function (switcher) {
        const buttons = switcher.querySelectorAll('[data-payment-target]');
        const panels = switcher.querySelectorAll('[data-payment-panel]');

        const setPanelState = function (panel, isOpen) {
            if (!panel) return;

            if (isOpen) {
                panel.classList.add('is-open');
                panel.style.maxHeight = panel.scrollHeight + 'px';
            } else {
                panel.classList.remove('is-open');
                panel.style.maxHeight = '0px';
            }
        };

        const openPanel = function (targetId) {
            buttons.forEach(function (button) {
                const isActive = button.getAttribute('data-payment-target') === targetId;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            });

            panels.forEach(function (panel) {
                const isOpen = panel.id === targetId;
                setPanelState(panel, isOpen);
            });
        };

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                openPanel(button.getAttribute('data-payment-target'));
            });
        });

        const initialActiveButton = switcher.querySelector('.hitit-payment-menu__button.is-active') || buttons[0];
        if (initialActiveButton) {
            openPanel(initialActiveButton.getAttribute('data-payment-target'));
        }

        window.addEventListener('resize', function () {
            const activePanel = switcher.querySelector('.hitit-payment-panel.is-open');
            if (activePanel) {
                activePanel.style.maxHeight = activePanel.scrollHeight + 'px';
            }
        });
    });

})();
