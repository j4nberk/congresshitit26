(function ($) {
    'use strict';

    /* ═══════════════════════════════════════════════════
       KONGRE TERCİH — Drag & Drop Atölye Sıralama
       Pointer Events API ile masaüstü + mobil destek
       ═══════════════════════════════════════════════════ */

    // Her tercih alanı için ayrı instance
    $(function () {
        $('.kongre-tercih-wrapper').each(function () {
            new KongreTercih(this);
        });
    });

    function KongreTercih(wrapper) {
        this.$wrapper = $(wrapper);
        this.$sortable = this.$wrapper.find('.kongre-tercih-sortable');
        this.$hidden = this.$wrapper.find('.kongre-tercih-hidden');
        this.tur = this.$wrapper.data('tur');      // 'bilimsel' veya 'sosyal'

        this.dragItem = null;
        this.dragClone = null;
        this.placeholder = null;
        this.startY = 0;
        this.startX = 0;

        this.init();
    }

    KongreTercih.prototype.init = function () {
        this.bindDrag();
        this.updateHiddenInput();
    };

    /* ── DRAG & DROP — Pointer Events ── */

    KongreTercih.prototype.bindDrag = function () {
        var self = this;

        // pointerdown → başla
        this.$sortable.on('pointerdown', '.kongre-tercih-item', function (e) {
            // Sadece sol tık veya dokunmatik
            if (e.originalEvent.button && e.originalEvent.button !== 0) return;
            e.preventDefault();

            self.dragStart(this, e.originalEvent);
        });

        // pointermove → sürükle
        $(document).on('pointermove.kongreTercih', function (e) {
            if (!self.dragItem) return;
            e.preventDefault();
            self.dragMove(e.originalEvent);
        });

        // pointerup → bırak
        $(document).on('pointerup.kongreTercih', function (e) {
            if (!self.dragItem) return;
            self.dragEnd();
        });

        // Tarayıcı varsayılan drag'ını engelle
        this.$sortable.on('dragstart', function (e) { e.preventDefault(); });
    };

    KongreTercih.prototype.dragStart = function (el, e) {
        this.dragItem = el;
        var $el = $(el);

        // Konum bilgisi
        var rect = el.getBoundingClientRect();
        this.startY = e.clientY;
        this.startX = e.clientX;
        this.offsetY = e.clientY - rect.top;
        this.offsetX = e.clientX - rect.left;

        // Placeholder oluştur
        this.placeholder = document.createElement('li');
        this.placeholder.className = 'kongre-tercih-item kt-placeholder kt-active';
        this.placeholder.style.height = rect.height + 'px';
        $el.after(this.placeholder);

        // Klon oluştur (sürüklenen görsel)
        this.dragClone = el.cloneNode(true);
        this.dragClone.className += ' kt-dragging';
        this.dragClone.style.position = 'fixed';
        this.dragClone.style.width = rect.width + 'px';
        this.dragClone.style.top = rect.top + 'px';
        this.dragClone.style.left = rect.left + 'px';
        document.body.appendChild(this.dragClone);

        // Orijinali gizle
        $el.css('opacity', '0').css('height', '0').css('padding', '0').css('margin', '0').css('overflow', 'hidden');

        // Pointer capture (mobilde scroll'u engelle)
        if (el.setPointerCapture) {
            try { el.releasePointerCapture(e.pointerId); } catch (ex) { }
        }
    };

    KongreTercih.prototype.dragMove = function (e) {
        if (!this.dragClone) return;

        // Klon pozisyonunu güncelle
        this.dragClone.style.top = (e.clientY - this.offsetY) + 'px';
        this.dragClone.style.left = (e.clientX - this.offsetX) + 'px';

        // Hedef konumu bul
        var items = this.$sortable.children('.kongre-tercih-item:not(.kt-placeholder)').toArray();
        var placeholder = this.placeholder;
        var inserted = false;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item === this.dragItem) continue;
            var itemRect = item.getBoundingClientRect();
            var midY = itemRect.top + itemRect.height / 2;

            if (e.clientY < midY) {
                if (item.previousElementSibling !== placeholder) {
                    this.$sortable[0].insertBefore(placeholder, item);
                }
                inserted = true;
                break;
            }
        }

        if (!inserted && placeholder.nextElementSibling !== null) {
            // En sona ekle (dragItem hariç)
            this.$sortable[0].appendChild(placeholder);
        }
    };

    KongreTercih.prototype.dragEnd = function () {
        if (!this.dragItem) return;

        var $el = $(this.dragItem);

        // Orijinali placeholder yerine koy
        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.parentNode.insertBefore(this.dragItem, this.placeholder);
            this.placeholder.parentNode.removeChild(this.placeholder);
        }

        // Stili geri al
        $el.css('opacity', '').css('height', '').css('padding', '').css('margin', '').css('overflow', '');

        // Klonu kaldır
        if (this.dragClone && this.dragClone.parentNode) {
            this.dragClone.parentNode.removeChild(this.dragClone);
        }

        this.dragItem = null;
        this.dragClone = null;
        this.placeholder = null;

        // Sıra numaralarını ve hidden input'u güncelle
        this.updateRanks();
        this.updateHiddenInput();
    };

    /* ── SIRA GÜNCELLE ── */

    KongreTercih.prototype.updateRanks = function () {
        this.$sortable.children('.kongre-tercih-item').each(function (i) {
            $(this).find('.kt-rank').text(i + 1);
        });
    };

    KongreTercih.prototype.updateHiddenInput = function () {
        var vals = [];
        this.$sortable.children('.kongre-tercih-item').each(function () {
            vals.push($(this).data('atolye-no'));
        });
        this.$hidden.val(vals.join(','));
    };

    /* ── Yardımcı ── */
    function escHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

})(jQuery);
