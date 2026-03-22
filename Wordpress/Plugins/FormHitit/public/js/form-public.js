(function ($) {
    'use strict';

    /* ═══════════════════════════════════
       HİTİT FORM – PUBLIC JS
       Koşullu mantık + AJAX gönderim
       ═══════════════════════════════════ */

    var initForms = function () {
        $('.hitit-form-wrapper').each(function () {
            var $wrapper = $(this);
            if ($wrapper.data('hitit-initialized')) return;
            $wrapper.data('hitit-initialized', true);

            // Skeleton'ı kaldır, formu göster
            $wrapper.removeClass('hitit-form-loading');

            new HititForm(this);
        });
    };

    if (document.readyState === 'complete') {
        initForms();
    } else {
        $(window).on('load', initForms);
    }

    function HititForm(wrapper) {
        this.$wrapper = $(wrapper);
        this.$form = this.$wrapper.find('form.hitit-form');
        this.formId = this.$wrapper.data('form-id');
        this.successMsg = this.$wrapper.data('success') || 'Formunuz başarıyla gönderildi!';
        this.init();
    }

    HititForm.prototype.init = function () {
        // Koşullu alanlar CSS ile gizli başlar ([data-conditions] { display: none })
        // JS sadece kullanıcı etkileşiminde koşulları değerlendirir
        this.touchedFields = {};
        this.bindConditions();
        this.bindSubmit();
        this.bindPhoneMask();
    };

    /* ── KOŞULLARI DİNLE ── */
    HititForm.prototype.bindConditions = function () {
        var self = this;
        this.$form.on('change input', 'input, select, textarea', function () {
            // Değiştirilen alanın name'ini "dokunulmuş" olarak işaretle
            var fieldName = $(this).attr('name');
            if (fieldName) {
                // checkbox[] formatını düzelt
                self.touchedFields[fieldName.replace('[]', '')] = true;
            }
            self.evaluateAll();
        });
    };

    /* ── TÜM KOŞULLARI DEĞERLENDİR ── */
    HititForm.prototype.evaluateAll = function () {
        var self = this;
        // data-conditions attribute'u olan tüm satırları bul
        this.$form.find('.hitit-form-row[data-conditions]').each(function () {
            var $row = $(this);
            var conditions;
            try {
                conditions = JSON.parse($row.attr('data-conditions'));
            } catch (e) {
                return;
            }
            if (!conditions || !conditions.length) {
                // Koşul tanımlı ama boş dizi — her zaman göster
                $row.addClass('hitit-cond-visible').removeClass('hitit-hidden');
                $row.find('input, select, textarea').prop('disabled', false);
                return;
            }

            var show = self.evaluateRules(conditions);
            var wasVisible = $row.hasClass('hitit-cond-visible');

            if (show) {
                $row.addClass('hitit-cond-visible').removeClass('hitit-hidden');
                $row.find('input, select, textarea').prop('disabled', false);
            } else {
                $row.removeClass('hitit-cond-visible').addClass('hitit-hidden');
                $row.find('input, select, textarea').prop('disabled', true);
                // Sadece önceden görünürken gizlenen alanların değerlerini temizle
                if (wasVisible) {
                    $row.find('input[type="text"], input[type="email"], input[type="number"], input[type="tel"], input[type="date"], textarea').val('');
                    $row.find('select').prop('selectedIndex', 0);
                    $row.find('input[type="radio"], input[type="checkbox"]').prop('checked', false);

                    // Bu satır gizlendiği için içindeki alanların "dokunulmuş" durumunu sıfırla.
                    // Böylece buna bağlı zincirleme koşullar (C -> B -> A) otomatikman gizlenir.
                    $row.find('input, select, textarea').each(function () {
                        var name = $(this).attr('name');
                        if (name) {
                            delete self.touchedFields[name.replace('[]', '')];
                        }
                    });
                }
            }
        });
    };

    /* ── KURAL DEĞERLENDİR (AND mantığı) ── */
    HititForm.prototype.evaluateRules = function (rules) {
        for (var i = 0; i < rules.length; i++) {
            if (!this.evaluateRule(rules[i])) return false;
        }
        return true;
    };

    HititForm.prototype.evaluateRule = function (rule) {
        var val = this.getFieldValue(rule.field);
        var target = rule.value || '';

        // Kaynak alan henüz kullanıcı tarafından dokunulmamışsa:
        // Varsayılan değerler (boş veya dolu) koşullu alanları tetiklememeli.
        // Kullanı etkileşimi olmadan hiçbir koşul "sağlandı" sayılmaz.
        if (!this.touchedFields[rule.field]) {
            return false;
        }

        switch (rule.operator) {
            case '==': return val === target;
            case '!=': return val !== target;
            case '>': return parseFloat(val) > parseFloat(target);
            case '<': return parseFloat(val) < parseFloat(target);
            case '>=': return parseFloat(val) >= parseFloat(target);
            case '<=': return parseFloat(val) <= parseFloat(target);
            case 'contains': return val.indexOf(target) !== -1;
            case 'not_contains': return val.indexOf(target) === -1;
            case 'empty': return !val || val === '';
            case 'not_empty': return !!val && val !== '';
            default: return val === target;
        }
    };

    /* ── ALAN DEĞER OKUMA (name attribute'una göre) ── */
    HititForm.prototype.getFieldValue = function (fieldName) {
        if (!fieldName) return '';

        // Radio
        var $radio = this.$form.find('input[type="radio"][name="' + fieldName + '"]:checked');
        if ($radio.length) return $radio.val() || '';

        // Checkbox (çoklu)
        var $checks = this.$form.find('input[type="checkbox"][name="' + fieldName + '[]"]');
        if ($checks.length) {
            return $checks.filter(':checked').map(function () { return $(this).val(); }).get().join(',');
        }

        // Tek checkbox
        var $singleCheck = this.$form.find('input[type="checkbox"][name="' + fieldName + '"]');
        if ($singleCheck.length) {
            return $singleCheck.is(':checked') ? $singleCheck.val() : '';
        }

        // Select, text, textarea, vs.
        var $input = this.$form.find('[name="' + fieldName + '"]');
        return $input.val() || '';
    };

    /* ── FORM GÖNDERİMİ (AJAX) ── */
    HititForm.prototype.bindSubmit = function () {
        var self = this;
        this.$form.on('submit', function (e) {
            e.preventDefault();
            self.clearErrors();

            if (!self.validateRequired()) return;

            var $btn = self.$form.find('.hitit-form-submit');
            var $text = $btn.find('.hitit-form-submit-text');
            var $spin = $btn.find('.hitit-form-spinner');

            $btn.prop('disabled', true);
            $text.hide();
            $spin.show();

            var formData = new FormData(self.$form[0]);
            formData.append('action', 'hitit_form_submit');
            formData.append('nonce', hititForm.nonce);

            $.ajax({
                url: hititForm.ajaxUrl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success) {
                        // Formu yukarı kaydırarak gizle
                        self.$form.slideUp(500, function () {
                            $(this).hide();

                            // Başarı mesajını göster (Yeşil kutu stili)
                            var messageText = res.data.message || self.successMsg;
                            var successHtml = '<div class="hitit-form-message success" style="display:none; margin-top:0;">' +
                                messageText +
                                '</div>';

                            var $msg = $(successHtml);
                            self.$wrapper.append($msg);
                            $msg.fadeIn(500);

                            // Ekranı mesaj hizasına kaydır (biraz daha yukarıdan boşluk bırakarak)
                            $('html, body').animate({ scrollTop: self.$wrapper.offset().top - 150 }, 500);
                        });

                        self.$form[0].reset();

                        if (res.data.redirect) {
                            setTimeout(function () { window.location.href = res.data.redirect; }, 2000);
                        }
                    } else {
                        self.showMessage(res.data.message || 'Bir hata oluştu.', 'error');
                        if (res.data.error_fields && res.data.error_fields.length) {
                            res.data.error_fields.forEach(function (fieldName) {
                                var $input = self.$form.find('[name="' + fieldName + '"], [name="' + fieldName + '[]"]');
                                if ($input.length) {
                                    $input.closest('.hitit-form-row').addClass('hitit-field-error');
                                }
                            });
                        }
                    }
                },
                error: function () {
                    self.showMessage('Sunucu hatası, lütfen tekrar deneyin.', 'error');
                },
                complete: function () {
                    $btn.prop('disabled', false);
                    $spin.hide();
                    $text.show();
                }
            });
        });
    };

    /* ── ZORUNLU ALAN DOĞRULAMA ── */
    HititForm.prototype.validateRequired = function () {
        var self = this;
        var valid = true;

        this.$form.find('.hitit-form-row').each(function () {
            var $row = $(this);
            // Gizli/koşullu gizli satırları atla
            if ($row.hasClass('hitit-hidden')) return;
            if ($row.is('[data-conditions]') && !$row.hasClass('hitit-cond-visible')) return;

            // Dosya alanı validasyonu (tür + boyut)
            var $fileInput = $row.find('input[type="file"].hitit-form-file');
            if ($fileInput.length && $fileInput[0].files.length > 0) {
                var file = $fileInput[0].files[0];
                var allowedTypes = $fileInput.data('file-types');
                var maxSizeMB = $fileInput.data('max-size');

                // Dosya türü kontrolü
                if (allowedTypes) {
                    var extensions = allowedTypes.split(',').map(function (ext) { return ext.trim().toLowerCase().replace(/^\./, ''); });
                    var fileExt = file.name.split('.').pop().toLowerCase();
                    if (extensions.indexOf(fileExt) === -1 && extensions.indexOf('.' + fileExt) === -1) {
                        valid = false;
                        $row.addClass('hitit-field-error');
                        if (!$row.find('.hitit-error-msg').length) {
                            $row.append('<div class="hitit-error-msg">İzin verilen dosya türleri: ' + allowedTypes + '</div>');
                        }
                    }
                }

                // Dosya boyutu kontrolü
                if (maxSizeMB) {
                    var maxBytes = parseFloat(maxSizeMB) * 1024 * 1024;
                    if (file.size > maxBytes) {
                        valid = false;
                        $row.addClass('hitit-field-error');
                        if (!$row.find('.hitit-error-msg').length) {
                            $row.append('<div class="hitit-error-msg">Dosya boyutu en fazla ' + maxSizeMB + ' MB olabilir.</div>');
                        }
                    }
                }
            }

            // Çoklu checkbox grubu kontrolü (name="xxx[]" formatında, required sadece ilk elemanda)
            var $cbGroup = $row.find('.hitit-form-checkbox-group input[type="checkbox"][required]');
            if ($cbGroup.length) {
                var groupName = $cbGroup.first().attr('name');
                var $allInGroup = self.$form.find('input[type="checkbox"][name="' + groupName + '"]');
                if ($allInGroup.filter(':checked').length === 0) {
                    valid = false;
                    $row.addClass('hitit-field-error');
                    if (!$row.find('.hitit-error-msg').length) {
                        $row.append('<div class="hitit-error-msg">En az bir seçenek seçmelisiniz.</div>');
                    }
                }
                // Gruptaki diğer required kontrollerini atla (aşağıda tekrar kontrol edilmesin)
                return;
            }

            var $req = $row.find('[required]');
            if (!$req.length) return;

            $req.each(function () {
                var $el = $(this);
                var name = $el.attr('name');
                var val = '';

                if ($el.is('select')) {
                    val = $el.val() || '';
                } else if ($el.attr('type') === 'radio') {
                    val = self.$form.find('input[name="' + name + '"]:checked').val() || '';
                } else if ($el.attr('type') === 'checkbox') {
                    // Tekli checkbox (name="xxx", value="1")
                    val = $el.is(':checked') ? '1' : '';
                } else {
                    val = ($el.val() || '').trim();
                }

                if (!val) {
                    valid = false;
                    $row.addClass('hitit-field-error');
                    if (!$row.find('.hitit-error-msg').length) {
                        $row.append('<div class="hitit-error-msg">Bu alan zorunludur.</div>');
                    }
                }

                // E-posta format kontrolü
                if ($el.attr('type') === 'email' && val) {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                        valid = false;
                        $row.addClass('hitit-field-error');
                        if (!$row.find('.hitit-error-msg').length) {
                            $row.append('<div class="hitit-error-msg">Geçerli bir e-posta adresi girin.</div>');
                        }
                    }
                }

                // Telefon format kontrolü (05XX XXX XX XX = 11 rakam)
                if ($el.hasClass('hitit-phone-input') && val) {
                    var digits = val.replace(/\D/g, '');
                    if (digits.length !== 11 || !/^05[0-9]{9}$/.test(digits)) {
                        valid = false;
                        $row.addClass('hitit-field-error');
                        if (!$row.find('.hitit-error-msg').length) {
                            $row.append('<div class="hitit-error-msg">Geçerli bir telefon numarası girin (05XX XXX XX XX).</div>');
                        }
                    }
                }
            });
        });

        if (!valid) {
            var $first = this.$form.find('.hitit-field-error').first();
            if ($first.length) {
                $('html, body').animate({ scrollTop: $first.offset().top - 120 }, 300);
            }
        }

        return valid;
    };

    /* ── HATA TEMİZLE ── */
    HititForm.prototype.clearErrors = function () {
        this.$form.find('.hitit-field-error').removeClass('hitit-field-error');
        this.$form.find('.hitit-error-msg').remove();
        this.$wrapper.find('.hitit-form-message').remove();
    };

    /* ── MESAJ GÖSTER ── */
    HititForm.prototype.showMessage = function (msg, type) {
        this.$wrapper.find('.hitit-form-message').remove();
        // Önce tüm HTML'i text olarak escape et, sonra güvenli etiketleri geri koy
        var safeMsg = $('<div>').text(msg).html()
            .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
            .replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>')
            .replace(/&lt;em&gt;/gi, '<em>').replace(/&lt;\/em&gt;/gi, '</em>');
        var $msg = $('<div class="hitit-form-message ' + type + '"></div>').html(safeMsg);
        this.$form.after($msg);
        $('html, body').animate({ scrollTop: $msg.offset().top - 100 }, 300);
    };

    /* ── TELEFON MASKELEME (05XX XXX XX XX) ── */
    HititForm.prototype.bindPhoneMask = function () {
        this.$form.on('input', '.hitit-phone-input', function () {
            var raw = $(this).val().replace(/\D/g, '');     // sadece rakamlar

            // İlk karakter 0 olmalı
            if (raw.length > 0 && raw[0] !== '0') {
                raw = '0' + raw;
            }
            // İkinci karakter 5 olmalı
            if (raw.length > 1 && raw[1] !== '5') {
                raw = raw[0] + '5' + raw.substring(2);
            }

            // Maksimum 11 rakam (05XXXXXXXXX)
            if (raw.length > 11) raw = raw.substring(0, 11);

            // Formatla: 05XX XXX XX XX
            var formatted = '';
            for (var i = 0; i < raw.length; i++) {
                if (i === 4 || i === 7 || i === 9) formatted += ' ';
                formatted += raw[i];
            }

            $(this).val(formatted);

            // Geçerlilik görseli
            var $row = $(this).closest('.hitit-form-row');
            $row.find('.hitit-error-msg').remove();
            $row.removeClass('hitit-field-error hitit-field-valid');

            if (raw.length === 11) {
                $row.addClass('hitit-field-valid');
            } else if (raw.length > 0) {
                $row.addClass('hitit-field-error');
            }
        });

        // Yapıştırma desteği
        this.$form.on('paste', '.hitit-phone-input', function (e) {
            var self = this;
            setTimeout(function () {
                $(self).trigger('input');
            }, 10);
        });

        // Sadece rakam tuşlarına izin ver (harfleri engelle)
        this.$form.on('keypress', '.hitit-phone-input', function (e) {
            var key = e.which || e.keyCode;
            // Backspace, Tab, Enter, ok tuşları ve rakamlar izinli
            if (key < 32 || (key >= 48 && key <= 57)) return true;
            e.preventDefault();
            return false;
        });
    };

})(jQuery);