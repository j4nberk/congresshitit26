(function ($) {
    'use strict';

    // ─────────────────────────────────
    // GLOBAL STATE
    // ─────────────────────────────────
    var fields = [];
    var selectedIndex = -1;
    var fieldCounter = 0;

    var fieldDefaults = {
        text: { label: 'Metin Alanı', placeholder: '', icon: 'editor-textcolor' },
        email: { label: 'E-posta', placeholder: 'ornek@mail.com', icon: 'email' },
        tel: { label: 'Telefon', placeholder: '05xx xxx xx xx', icon: 'phone' },
        number: { label: 'Sayı', placeholder: '', icon: 'editor-ol' },
        textarea: { label: 'Uzun Metin', placeholder: '', icon: 'editor-paragraph' },
        select: { label: 'Açılır Menü', placeholder: 'Seçiniz...', options: ['Seçenek 1', 'Seçenek 2'], icon: 'arrow-down-alt2' },
        radio: { label: 'Tekli Seçim', options: ['Seçenek 1', 'Seçenek 2'], icon: 'marker' },
        checkbox: { label: 'Çoklu Seçim', options: ['Seçenek 1', 'Seçenek 2'], icon: 'yes-alt' },
        date: { label: 'Tarih', placeholder: '', icon: 'calendar-alt' },
        file: { label: 'Dosya Yükleme', icon: 'media-default' },
        heading: { label: 'Bölüm Başlığı', icon: 'heading' },
        divider: { label: '', icon: 'minus' },
        hidden: { label: 'Gizli Alan', icon: 'hidden' },
        kongre_tercih: { label: 'Atölye Tercihi', icon: 'sort' }
    };

    // ─────────────────────────────────
    // INIT
    // ─────────────────────────────────
    $(document).ready(function () {
        // Mevcut alanları yükle
        if (typeof hititFormFields !== 'undefined' && Array.isArray(hititFormFields) && hititFormFields.length) {
            fields = hititFormFields;
            fieldCounter = fields.length;
            renderCanvas();
        }

        initSortable();
        bindEvents();
    });

    // ─────────────────────────────────
    // SÜRÜKLE-BIRAK (Sortable)
    // ─────────────────────────────────
    function initSortable() {
        // Canvas içindeki alanları sırala + paletten bırakılanı yakala
        $('#hitit-builder-canvas').sortable({
            handle: '.hitit-field-handle',
            placeholder: 'hitit-field-placeholder',
            tolerance: 'pointer',
            items: '> .hitit-field-card',
            update: function (e, ui) {
                // Paletten gelen öğe ise receive zaten halleder, burada atla
                if (ui.item.hasClass('hitit-palette-item')) return;
                reorderFields();
            },
            receive: function (e, ui) {
                // Paletten sürüklenip bırakılan öğe
                var type = ui.item.data('type');
                if (type) {
                    // Bırakılan pozisyonu hesapla
                    var insertIndex = ui.item.index();
                    ui.item.remove(); // Palette clone'unu kaldır
                    addField(type, insertIndex);
                }
            }
        });

        // Paletten canvas'a sürükle
        $('.hitit-palette-item').draggable({
            helper: 'clone',
            connectToSortable: '#hitit-builder-canvas',
            revert: 'invalid',
            zIndex: 10000,
            start: function (e, ui) {
                ui.helper.addClass('hitit-dragging');
                // Sürükleme başladığını işaretle (tıklama çakışmasını önlemek için)
                $(this).data('dragging', true);
            },
            stop: function () {
                var $el = $(this);
                // Kısa gecikme ile dragging flag'ini temizle (click event'inden sonra)
                setTimeout(function () {
                    $el.data('dragging', false);
                }, 100);
            }
        });
    }

    // ─────────────────────────────────
    // ALAN EKLEME
    // ─────────────────────────────────
    function addField(type, insertIndex) {
        var def = fieldDefaults[type] || fieldDefaults.text;
        fieldCounter++;

        var field = {
            type: type,
            label: def.label,
            name: type + '_' + fieldCounter,
            placeholder: def.placeholder || '',
            required: false,
            unique: false,
            width: '100',
            options: def.options ? def.options.slice() : [],
            conditions: [],
            content: '',
            default: '',
            file_types: '',
            file_max_size: '',
            number_min: '',
            number_max: '',
            number_step: '',
            kongre_tercih_type: 'bilimsel'
        };

        if (typeof insertIndex === 'number') {
            fields.splice(insertIndex, 0, field);
        } else {
            fields.push(field);
        }

        renderCanvas();
        selectField(typeof insertIndex === 'number' ? insertIndex : fields.length - 1);
    }

    // ─────────────────────────────────
    // CANVAS RENDER
    // ─────────────────────────────────
    function renderCanvas() {
        var $canvas = $('#hitit-builder-canvas');
        $canvas.find('.hitit-canvas-empty').remove();

        // Mevcut field kartlarını temizle
        $canvas.find('.hitit-field-card').remove();

        if (!fields.length) {
            $canvas.html('<div class="hitit-canvas-empty"><span class="dashicons dashicons-plus-alt2"></span><p>Sol taraftan alanları sürükle veya tıkla</p></div>');
            return;
        }

        fields.forEach(function (field, idx) {
            var def = fieldDefaults[field.type] || fieldDefaults.text;
            var icon = def.icon || 'admin-generic';
            var condBadge = field.conditions && field.conditions.length
                ? '<span class="hitit-cond-badge" title="Koşullu alan">⚡</span>'
                : '';
            var reqBadge = field.required
                ? '<span class="hitit-req-badge">*</span>'
                : '';
            var widthLabel = field.width !== '100' ? '<span class="hitit-width-badge">' + field.width + '%</span>' : '';

            var html = '<div class="hitit-field-card' + (idx === selectedIndex ? ' selected' : '') + '" data-index="' + idx + '">';
            html += '<div class="hitit-field-handle"><span class="dashicons dashicons-move"></span></div>';
            html += '<div class="hitit-field-info">';
            html += '<span class="dashicons dashicons-' + icon + ' hitit-field-icon"></span>';
            html += '<span class="hitit-field-label">' + escHtml(field.label || field.type) + '</span>';
            html += reqBadge + condBadge + widthLabel;
            html += '<span class="hitit-field-type">' + field.type + '</span>';
            html += '</div>';
            html += '<div class="hitit-field-actions">';
            html += '<button class="hitit-field-duplicate" data-index="' + idx + '" title="Kopyala"><span class="dashicons dashicons-admin-page"></span></button>';
            html += '<button class="hitit-field-delete" data-index="' + idx + '" title="Sil"><span class="dashicons dashicons-trash"></span></button>';
            html += '</div>';
            html += '</div>';

            $canvas.append(html);
        });

        // Sortable'ı yenile (DOM yeniden oluşturulduğu için)
        if ($canvas.data('ui-sortable') || $canvas.data('uiSortable')) {
            $canvas.sortable('refresh');
        }
    }

    // ─────────────────────────────────
    // ALAN SIRALAMA (sürükleme sonrası)
    // ─────────────────────────────────
    function reorderFields() {
        var newOrder = [];
        $('#hitit-builder-canvas .hitit-field-card').each(function () {
            var idx = parseInt($(this).data('index'));
            if (fields[idx]) newOrder.push(fields[idx]);
        });
        fields = newOrder;
        renderCanvas();
    }

    // ─────────────────────────────────
    // ALAN SEÇ → AYAR PANELİ
    // ─────────────────────────────────
    function selectField(index) {
        selectedIndex = index;
        var field = fields[index];
        if (!field) return;

        renderCanvas();

        var $panel = $('#hitit-field-settings');
        $panel.show();

        $('#hfs-label').val(field.label);
        $('#hfs-name').val(field.name);
        $('#hfs-placeholder').val(field.placeholder || '');
        $('#hfs-required').prop('checked', !!field.required);
        $('#hfs-unique').prop('checked', !!field.unique);
        $('#hfs-width').val(field.width || '100');

        // Benzersiz değer ayarı gösterimi
        var canBeUnique = ['text', 'email', 'tel', 'number'].indexOf(field.type) !== -1;
        $('.hitit-unique-row').toggle(canBeUnique);
        $('#hfs-default').val(field.default || '');

        // Seçenek tipi alanlar
        var hasOptions = ['select', 'radio', 'checkbox'].indexOf(field.type) !== -1;
        $('.hitit-options-row').toggle(hasOptions);
        if (hasOptions) {
            renderOptions(field.options || []);
        }

        // Gizli alan default göster
        $('.hitit-default-row').toggle(field.type === 'hidden');

        // Dosya alanı ayarları
        var isFile = field.type === 'file';
        $('.hitit-file-settings-row').toggle(isFile);
        if (isFile) {
            $('#hfs-file-types').val(field.file_types || '');
            $('#hfs-file-max-size').val(field.file_max_size || '');
        }

        // Sayı alanı ayarları
        var isNumber = field.type === 'number';
        $('.hitit-number-settings-row').toggle(isNumber);
        if (isNumber) {
            $('#hfs-number-min').val(field.number_min !== undefined ? field.number_min : '');
            $('#hfs-number-max').val(field.number_max !== undefined ? field.number_max : '');
            $('#hfs-number-step').val(field.number_step !== undefined ? field.number_step : '');
        }

        // Koşulları render et
        renderConditions(field.conditions || []);

        // Kongre tercih ayarları
        var isKongreTercih = field.type === 'kongre_tercih';
        $('.hitit-kongre-tercih-row').toggle(isKongreTercih);
        if (isKongreTercih) {
            $('#hfs-kongre-tercih-type').val(field.kongre_tercih_type || 'bilimsel');
        }
    }

    // ─────────────────────────────────
    // SEÇENEK LİSTESİ RENDER
    // ─────────────────────────────────
    function renderOptions(options) {
        var $list = $('#hfs-options-list');
        $list.empty();

        options.forEach(function (opt, i) {
            var html = '<div class="hitit-option-item">';
            html += '<input type="text" value="' + escAttr(opt) + '" class="hitit-option-input widefat" data-oidx="' + i + '">';
            html += '<button class="button button-small hitit-option-remove" data-oidx="' + i + '">✕</button>';
            $list.append(html);
        });
    }

    // ─────────────────────────────────
    // KOŞUL LİSTESİ RENDER
    // ─────────────────────────────────
    function renderConditions(conditions) {
        var $list = $('#hfs-conditions-list');
        $list.empty();

        // Mevcut alanların listesi (koşul hedefi olarak)
        var fieldOptions = '';
        fields.forEach(function (f, i) {
            if (i !== selectedIndex && f.name) {
                fieldOptions += '<option value="' + escAttr(f.name) + '">' + escHtml(f.label || f.name) + '</option>';
            }
        });

        conditions.forEach(function (cond, ci) {
            var html = '<div class="hitit-condition-item" data-cidx="' + ci + '">';
            html += '<select class="hitit-cond-field widefat" data-cidx="' + ci + '">';
            html += '<option value="">Alan seç...</option>';
            html += fieldOptions;
            html += '</select>';
            html += '<select class="hitit-cond-operator" data-cidx="' + ci + '">';
            html += '<option value="==" ' + (cond.operator === '==' ? 'selected' : '') + '>Eşittir</option>';
            html += '<option value="!=" ' + (cond.operator === '!=' ? 'selected' : '') + '>Eşit değil</option>';
            html += '<option value="contains" ' + (cond.operator === 'contains' ? 'selected' : '') + '>İçerir</option>';
            html += '<option value="not_empty" ' + (cond.operator === 'not_empty' ? 'selected' : '') + '>Dolu</option>';
            html += '<option value="empty" ' + (cond.operator === 'empty' ? 'selected' : '') + '>Boş</option>';
            html += '</select>';
            html += '<input type="text" class="hitit-cond-value widefat" data-cidx="' + ci + '" value="' + escAttr(cond.value || '') + '" placeholder="Değer">';
            html += '<button class="button button-small hitit-cond-remove" data-cidx="' + ci + '">✕</button>';
            html += '</div>';
            $list.append(html);

            // Seçili alanı işaretle
            $list.find('.hitit-cond-field[data-cidx="' + ci + '"]').val(cond.field || '');
        });
    }

    // ─────────────────────────────────
    // TÜM EVENTS
    // ─────────────────────────────────
    function bindEvents() {

        // Paletten tıklayarak ekleme
        $(document).on('click', '.hitit-palette-item', function (e) {
            if ($(e.target).closest('.ui-draggable-dragging').length) return;
            // Sürüklemeden geliyorsa tıklamayı yoksay
            if ($(this).data('dragging')) return;
            var type = $(this).data('type');
            addField(type);
        });

        // Alan kartına tıkla → seç
        $(document).on('click', '.hitit-field-card', function (e) {
            if ($(e.target).closest('.hitit-field-delete, .hitit-field-duplicate').length) return;
            var idx = parseInt($(this).data('index'));
            selectField(idx);
        });

        // Alan sil
        $(document).on('click', '.hitit-field-delete', function (e) {
            e.stopPropagation();
            var idx = parseInt($(this).data('index'));
            if (!confirm('Bu alanı silmek istediğinize emin misiniz?')) return;
            fields.splice(idx, 1);
            selectedIndex = -1;
            $('#hitit-field-settings').hide();
            renderCanvas();
        });

        // Alan kopyala
        $(document).on('click', '.hitit-field-duplicate', function (e) {
            e.stopPropagation();
            var idx = parseInt($(this).data('index'));
            var clone = JSON.parse(JSON.stringify(fields[idx]));
            fieldCounter++;
            clone.name = clone.type + '_' + fieldCounter;
            clone.label = clone.label + ' (kopya)';
            fields.splice(idx + 1, 0, clone);
            renderCanvas();
            selectField(idx + 1);
        });

        // ── ALAN AYARLARI DEĞİŞİKLİKLERİ ──

        // Label değişimi
        $('#hfs-label').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].label = $(this).val();
            renderCanvas();
        });

        // Name değişimi
        $('#hfs-name').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].name = $(this).val().replace(/[^a-z0-9_]/g, '');
        });

        // Placeholder
        $('#hfs-placeholder').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].placeholder = $(this).val();
        });

        // Required
        $('#hfs-required').on('change', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].required = $(this).is(':checked');
            renderCanvas();
        });

        // Unique
        $('#hfs-unique').on('change', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].unique = $(this).is(':checked');
            renderCanvas();
        });

        // Width
        $('#hfs-width').on('change', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].width = $(this).val();
            renderCanvas();
        });

        // Default (hidden)
        $('#hfs-default').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].default = $(this).val();
        });

        // ── DOSYA ALAN AYARLARI ──

        // Dosya türleri
        $('#hfs-file-types').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].file_types = $(this).val();
        });

        // Dosya boyut sınırı
        $('#hfs-file-max-size').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].file_max_size = $(this).val();
        });

        // ── SAYI ALAN AYARLARI ──

        // Minimum değer
        $('#hfs-number-min').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].number_min = $(this).val();
        });

        // Maksimum değer
        $('#hfs-number-max').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].number_max = $(this).val();
        });

        // Step değer
        $('#hfs-number-step').on('input', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].number_step = $(this).val();
        });

        // ── KONGRE TERCİH AYARLARI ──
        $('#hfs-kongre-tercih-type').on('change', function () {
            if (selectedIndex < 0) return;
            fields[selectedIndex].kongre_tercih_type = $(this).val();
        });

        // ── SEÇENEK İŞLEMLERİ ──

        // Seçenek değeri değiştir
        $(document).on('input', '.hitit-option-input', function () {
            if (selectedIndex < 0) return;
            var oidx = parseInt($(this).data('oidx'));
            fields[selectedIndex].options[oidx] = $(this).val();
        });

        // Seçenek sil
        $(document).on('click', '.hitit-option-remove', function () {
            if (selectedIndex < 0) return;
            var oidx = parseInt($(this).data('oidx'));
            fields[selectedIndex].options.splice(oidx, 1);
            renderOptions(fields[selectedIndex].options);
        });

        // Seçenek ekle
        $('#hfs-add-option').on('click', function () {
            if (selectedIndex < 0) return;
            if (!fields[selectedIndex].options) fields[selectedIndex].options = [];
            fields[selectedIndex].options.push('Yeni seçenek');
            renderOptions(fields[selectedIndex].options);
        });

        // ── KOŞUL İŞLEMLERİ ──

        // Koşul alanı değiştir
        $(document).on('change', '.hitit-cond-field', function () {
            if (selectedIndex < 0) return;
            var ci = parseInt($(this).data('cidx'));
            fields[selectedIndex].conditions[ci].field = $(this).val();
        });

        // Koşul operatörü değiştir
        $(document).on('change', '.hitit-cond-operator', function () {
            if (selectedIndex < 0) return;
            var ci = parseInt($(this).data('cidx'));
            fields[selectedIndex].conditions[ci].operator = $(this).val();
        });

        // Koşul değeri değiştir
        $(document).on('input', '.hitit-cond-value', function () {
            if (selectedIndex < 0) return;
            var ci = parseInt($(this).data('cidx'));
            fields[selectedIndex].conditions[ci].value = $(this).val();
        });

        // Koşul ekle
        $('#hfs-add-condition').on('click', function () {
            if (selectedIndex < 0) return;
            if (!fields[selectedIndex].conditions) fields[selectedIndex].conditions = [];
            fields[selectedIndex].conditions.push({ field: '', operator: '==', value: '' });
            renderConditions(fields[selectedIndex].conditions);
            renderCanvas();
        });

        // Koşul sil
        $(document).on('click', '.hitit-cond-remove', function () {
            if (selectedIndex < 0) return;
            var ci = parseInt($(this).data('cidx'));
            fields[selectedIndex].conditions.splice(ci, 1);
            renderConditions(fields[selectedIndex].conditions);
            renderCanvas();
        });

        // ── FORM KAYDET ──
        $('#hitit-save-form').on('click', function () {
            saveForm();
        });

        // Ctrl+S ile kaydet
        $(document).on('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveForm();
            }
        });

        // ── FORM SİL (liste sayfasında) ──
        $(document).on('click', '.hitit-delete-form', function () {
            if (!confirm('Bu formu ve tüm gönderimlerini silmek istediğinize emin misiniz?')) return;
            var id = $(this).data('id');
            var $row = $(this).closest('tr');

            $.post(hititFormAdmin.ajaxUrl, {
                action: 'hitit_form_delete',
                nonce: hititFormAdmin.nonce,
                id: id
            }, function (res) {
                if (res.success) {
                    $row.fadeOut(300, function () { $(this).remove(); });
                }
            });
        });

        // ── GÖNDERİM SİL ──
        $(document).on('click', '.hitit-delete-entry', function () {
            if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
            var id = $(this).data('id');
            var $row = $(this).closest('tr');

            $.post(hititFormAdmin.ajaxUrl, {
                action: 'hitit_form_delete_entry',
                nonce: hititFormAdmin.nonce,
                id: id
            }, function (res) {
                if (res.success) {
                    $row.fadeOut(300, function () {
                        $(this).remove();
                        updateBulkDeleteButton();
                        // Kalan yoksa sayfayı yenile
                        if ($('.hitit-entry-cb').length === 0) {
                            location.reload();
                        }
                    });
                } else {
                    alert('Hata: ' + (res.data || 'Bilinmeyen hata'));
                }
            });
        });

        // ── TOPLU GÖNDERİM SİL ──

        // Tümünü seç/bırak
        $(document).on('change', '#hitit-select-all-entries', function () {
            var checked = $(this).is(':checked');
            $('.hitit-entry-cb').prop('checked', checked);
            updateBulkDeleteButton();
        });

        // Tekil checkbox değişimi
        $(document).on('change', '.hitit-entry-cb', function () {
            var total = $('.hitit-entry-cb').length;
            var selected = $('.hitit-entry-cb:checked').length;
            $('#hitit-select-all-entries').prop('checked', total === selected && total > 0);
            updateBulkDeleteButton();
        });

        // Toplu sil butonu
        $(document).on('click', '#hitit-bulk-delete-entries', function () {
            var ids = $('.hitit-entry-cb:checked').map(function () { return $(this).val(); }).get();
            if (!ids.length) return;
            if (!confirm(ids.length + ' kaydı silmek istediğinize emin misiniz?')) return;

            var $btn = $(this);
            $btn.prop('disabled', true).text('Siliniyor...');

            $.post(hititFormAdmin.ajaxUrl, {
                action: 'hitit_form_bulk_delete_entries',
                nonce: hititFormAdmin.nonce,
                ids: ids
            }, function (res) {
                if (res.success) {
                    $('.hitit-entry-cb:checked').closest('tr').fadeOut(300, function () {
                        $(this).remove();
                        updateBulkDeleteButton();
                        // Kalan yoksa sayfayı yenile
                        if ($('.hitit-entry-cb').length === 0) {
                            location.reload();
                        }
                    });
                } else {
                    alert('Hata: ' + (res.data || 'Bilinmeyen hata'));
                }
            }).always(function () {
                $btn.prop('disabled', false);
                updateBulkDeleteButton();
            });
        });

        // Google Sheets yardım toggle
        $(document).on('click', '#hitit-sheets-help-toggle', function (e) {
            e.preventDefault();
            $('#hitit-sheets-help').slideToggle(200);
        });

        // ── GÖRÜNÜM AYARLARI EVENT'LERİ ──

        // Renk picker → text input senkronizasyonu
        $(document).on('input', '.hitit-color-picker', function () {
            var id = $(this).attr('id');
            $('.hitit-color-text[data-target="' + id + '"]').val($(this).val());
        });

        // Text input → renk picker senkronizasyonu
        $(document).on('input', '.hitit-color-text', function () {
            var target = $(this).data('target');
            var val = $(this).val();
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                $('#' + target).val(val);
            }
        });

        // Sıfırla butonu
        $(document).on('click', '.hitit-color-reset', function () {
            var target = $(this).data('target');
            var def = $(this).data('default');
            $('#' + target).val(def);
            $('.hitit-color-text[data-target="' + target + '"]').val(def);
        });

        // Range slider değer gösterimi
        $('#hitit-style-radius').on('input', function () {
            $('#hitit-style-radius-val').text($(this).val() + 'px');
        });
    }

    // ─────────────────────────────────
    // FORMU KAYDET
    // ─────────────────────────────────
    function saveForm() {
        var title = $('#hitit-form-title').val().trim();
        if (!title) {
            alert('Lütfen form başlığını girin.');
            $('#hitit-form-title').focus();
            return;
        }

        var formId = $('#hitit-builder-canvas').data('form-id') || 0;

        var data = {
            nonce: hititFormAdmin.nonce,
            action: 'hitit_form_save',
            id: formId,
            title: title,
            fields: fields,
            settings: {
                submit_text: $('#hitit-setting-submit-text').val(),
                success_message: $('#hitit-setting-success-msg').val(),
                notification_email: $('#hitit-setting-notif-email').val(),
                // Görünüm ayarları
                style_font: $('#hitit-style-font').val(),
                style_max_width: $('#hitit-style-max-width').val(),
                style_bg: $('#hitit-style-bg').val(),
                style_label_color: $('#hitit-style-label-color').val(),
                style_border_color: $('#hitit-style-border-color').val(),
                style_focus_color: $('#hitit-style-focus-color').val(),
                style_input_color: $('#hitit-style-input-color').val(),
                style_btn_bg: $('#hitit-style-btn-bg').val(),
                style_btn_color: $('#hitit-style-btn-color').val(),
                style_btn_hover: $('#hitit-style-btn-hover').val(),
                style_radius: $('#hitit-style-radius').val()
            },
            google_sheet_id: $('#hitit-setting-sheet-url').val(),
            start_time: $('#hitit-setting-start-time').val(),
            wait_message: $('#hitit-setting-wait-message').val()
        };

        var $btn = $('#hitit-save-form');
        $btn.prop('disabled', true).text('Kaydediliyor...');

        $.ajax({
            url: hititFormAdmin.ajaxUrl + '?action=hitit_form_save&nonce=' + hititFormAdmin.nonce,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (res) {
                if (res.success) {
                    // Yeni form ise URL'yi güncelle
                    if (!formId && res.data.id) {
                        window.history.replaceState({}, '', window.location.href + '&id=' + res.data.id);
                        $('#hitit-builder-canvas').data('form-id', res.data.id);

                        // Shortcode badge göster
                        var badge = '<span class="hitit-shortcode-badge">[hitit_form id="' + res.data.id + '"]</span>';
                        if (!$('.hitit-shortcode-badge').length) {
                            $btn.before(badge);
                        }
                    }
                    showNotice('✓ ' + (res.data.message || 'Kaydedildi!'), 'success');
                } else {
                    showNotice('Hata: ' + (res.data || 'Bilinmeyen hata'), 'error');
                }
            },
            error: function () {
                showNotice('Sunucu hatası oluştu.', 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html('<span class="dashicons dashicons-saved" style="margin-top:4px;"></span> Kaydet');
            }
        });
    }

    // ─────────────────────────────────
    // BİLDİRİM
    // ─────────────────────────────────
    function showNotice(msg, type) {
        var cls = type === 'error' ? 'notice-error' : 'notice-success';
        var html = '<div class="notice ' + cls + ' is-dismissible hitit-notice"><p>' + msg + '</p></div>';
        $('.hitit-notice').remove();
        $('.hitit-admin-wrap > h1').after(html);
        setTimeout(function () { $('.hitit-notice').fadeOut(300); }, 3000);
    }

    // ─────────────────────────────────
    // YARDIMCI
    // ─────────────────────────────────
    function escHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }
    function escAttr(str) {
        return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function updateBulkDeleteButton() {
        var selected = $('.hitit-entry-cb:checked').length;
        var $btn = $('#hitit-bulk-delete-entries');
        if (selected > 0) {
            $btn.show();
            $('#hitit-bulk-count').text(selected);
        } else {
            $btn.hide();
        }
    }

})(jQuery);