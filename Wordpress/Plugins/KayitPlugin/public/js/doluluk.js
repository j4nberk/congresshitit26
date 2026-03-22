(function ($) {
    'use strict';

    /* ═══════════════════════════════════════════════
       KONGRE DOLULUK — Formda atölye doluluk gösterimi
       Tercih alanlarının üstüne canlı doluluk tablosu ekler
       ═══════════════════════════════════════════════ */

    var data = null;
    var refreshTimer = null;
    var refreshInterval = 120000;

    $(function () {
        loadDoluluk();

        // Sekme arka plana gidince polling'i durdur, öne gelince yeniden başlat
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
            } else {
                if (!refreshTimer) loadDoluluk();
            }
        });
    });

    function loadDoluluk() {
        $.ajax({
            url: kongreDoluluk.ajaxUrl,
            type: 'POST',
            data: {
                action: 'kongre_doluluk',
                nonce: kongreDoluluk.nonce,
                _: new Date().getTime() // Cache busting
            },
            dataType: 'json',
            success: function (res) {
                if (res.success && res.data) {
                    data = res.data;
                    injectTables();
                    updateKongreTercihPanels();
                }
            },
            complete: function () {
                // Her 2 dakikada doluluk verisini yenile (sadece sekme görünürse)
                if (refreshTimer) clearTimeout(refreshTimer);
                if (!document.hidden) {
                    refreshTimer = setTimeout(loadDoluluk, refreshInterval);
                }
            }
        });
    }

    /**
     * Tercih alanlarını label eşleştirmesiyle bul ve üstüne doluluk tablosu ekle
     */
    function injectTables() {
        if (!data) return;

        var pairs = [
            { label: kongreDoluluk.labelBilimsel, key: 'bilimsel', icon: '📋', title: 'Bilimsel Atölye Doluluk Durumu' },
            { label: kongreDoluluk.labelSosyal, key: 'sosyal', icon: '🎨', title: 'Sosyal Atölye Doluluk Durumu' }
        ];

        pairs.forEach(function (p) {
            // Eğer hitit-form kongre-tercih alanı bu tür için zaten varsa, tekrar ekleme
            if ($('.kongre-tercih-wrapper[data-tur="' + p.key + '"]').length) return;

            var $row = findFieldRow(p.label);
            if (!$row || !$row.length) return;

            var containerId = 'kongre-doluluk-' + p.key;

            // Zaten varsa güncelle, yoksa oluştur
            var $existing = $('#' + containerId);
            if ($existing.length) {
                $existing.replaceWith(buildTable(p, containerId));
            } else {
                // Label'dan sonra, input'tan önce ekle
                $row.find('.hitit-form-label').after(buildTable(p, containerId));
            }
        });
    }

    function updateKongreTercihPanels() {
        if (!data) return;

        $('.kongre-tercih-wrapper').each(function () {
            var $wrapper = $(this);
            var tur = $wrapper.data('tur');
            var items = data[tur] || [];
            var $panel = $wrapper.find('.kongre-tercih-doluluk-grid');

            if (!$panel.length || !items.length) return;

            $panel.empty();

            var oturumMap = {
                'sabah': 'Sabah', 'aksam': 'Akşam', 'sabah+aksam': 'Tam Gün',
                'Sabah': 'Sabah', 'Akşam': 'Akşam', 'Tam Gün': 'Tam Gün'
            };

            items.forEach(function (atolye) {
                var allDolu = true;
                var toplamKalan = 0;

                atolye.oturumlar.forEach(function (ot) {
                    if (!ot.dolu_mu) allDolu = false;
                    toplamKalan += ot.kalan;
                });

                var cls = allDolu ? 'dolu' : (toplamKalan <= 3 ? 'az' : 'musait');
                var html = '<div class="kongre-tercih-doluluk-item ' + cls + '">';
                html += '<div class="kt-card-header">';
                html += '<span class="kt-no">#' + atolye.no + '</span>';
                html += '<span class="kt-ad">' + escHtml(atolye.ad) + '</span>';
                html += '</div>';
                html += '<div class="kt-sessions">';

                atolye.oturumlar.forEach(function (ot) {
                    var otCls = ot.dolu_mu ? 'dolu' : (ot.kalan <= 3 ? 'az' : 'musait');
                    var otText = ot.dolu_mu ? 'DOLU' : (ot.kalan + ' yer');
                    var otLabel = oturumMap[ot.oturum] || ot.oturum;
                    html += '<span class="kt-session-tag ' + otCls + '">' + escHtml(otLabel) + ': ' + otText + '</span>';
                });

                html += '</div>';
                html += '</div>';
                $panel.append(html);
            });
        });
    }

    /**
     * Label metnine göre form satırını bul
     */
    function findFieldRow(labelText) {
        if (!labelText) return null;
        var search = labelText.toLowerCase().trim();
        var $found = null;

        $('.hitit-form-wrapper .hitit-form-label').each(function () {
            var txt = $(this).text().replace('*', '').toLowerCase().trim();
            if (txt === search || txt.indexOf(search) !== -1 || search.indexOf(txt) !== -1) {
                $found = $(this).closest('.hitit-form-row');
                return false;
            }
        });
        return $found;
    }

    /**
     * Doluluk tablosu HTML'i oluştur
     */
    function buildTable(p, containerId) {
        var items = data[p.key] || [];
        if (!items.length) return '';

        var html = '<div id="' + containerId + '" class="kongre-doluluk-panel">';
        html += '<div class="kongre-doluluk-header">';
        html += '<span class="kongre-doluluk-icon">' + p.icon + '</span>';
        html += '<span class="kongre-doluluk-title">' + p.title + '</span>';
        html += '<button type="button" class="kongre-doluluk-toggle" aria-expanded="true" title="Gizle/Göster">▾</button>';
        html += '</div>';
        html += '<div class="kongre-doluluk-body">';
        html += '<div class="kongre-doluluk-grid">';

        items.forEach(function (atolye) {
            atolye.oturumlar.forEach(function (ot) {
                var pct = ot.kontenjan > 0 ? Math.round(((ot.kontenjan - ot.kalan) / ot.kontenjan) * 100) : 100;
                var statusClass = ot.dolu_mu ? 'dolu' : (ot.kalan <= 3 ? 'az' : 'musait');
                var statusText = ot.dolu_mu ? 'DOLU' : (ot.kalan + ' yer');

                html += '<div class="kongre-doluluk-item ' + statusClass + '">';
                html += '<div class="kongre-doluluk-item-header">';
                html += '<span class="kongre-doluluk-no">' + atolye.no + '</span>';
                html += '<span class="kongre-doluluk-badge ' + statusClass + '">' + statusText + '</span>';
                html += '</div>';
                html += '<div class="kongre-doluluk-ad">' + escHtml(atolye.ad) + '</div>';
                html += '<div class="kongre-doluluk-oturum">' + escHtml(ot.oturum) + '</div>';
                html += '<div class="kongre-doluluk-bar">';
                html += '<div class="kongre-doluluk-bar-fill ' + statusClass + '" style="width:' + pct + '%"></div>';
                html += '</div>';
                html += '</div>';
            });
        });

        html += '</div>'; // grid
        html += '<div class="kongre-doluluk-legend">';
        html += '<span class="kongre-doluluk-legend-item musait"><span class="dot"></span> Müsait</span>';
        html += '<span class="kongre-doluluk-legend-item az"><span class="dot"></span> Son birkaç yer</span>';
        html += '<span class="kongre-doluluk-legend-item dolu"><span class="dot"></span> Dolu</span>';
        html += '</div>';
        html += '</div>'; // body
        html += '</div>'; // panel

        return html;
    }

    /**
     * Basit HTML escape
     */
    function escHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    /* ── Toggle: Tabloyu aç/kapa ── */
    $(document).on('click', '.kongre-doluluk-toggle', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $body = $btn.closest('.kongre-doluluk-panel').find('.kongre-doluluk-body');
        var open = $btn.attr('aria-expanded') === 'true';

        if (open) {
            $body.slideUp(200);
            $btn.attr('aria-expanded', 'false').text('▸');
        } else {
            $body.slideDown(200);
            $btn.attr('aria-expanded', 'true').text('▾');
        }
    });

})(jQuery);
