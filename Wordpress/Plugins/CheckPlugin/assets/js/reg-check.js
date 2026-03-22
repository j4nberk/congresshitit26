(function ($) {
    'use strict';

    $(function () {
        var $form = $('#hrcheck-form');
        var $phone = $('#hrcheck-phone');
        var $btn = $('#hrcheck-submit');
        var $btnText = $btn.find('.hrcheck-btn-text');
        var $btnSpin = $btn.find('.hrcheck-btn-spinner');
        var $result = $('#hrcheck-result');
        var $message = $('#hrcheck-message');
        var hasCaptcha = !!hrcheck.siteKey;

        /* ── TELEFON MASKELEME (05XX XXX XX XX) ── */
        $phone.on('input', function () {
            var raw = $(this).val().replace(/\D/g, '');

            if (raw.length > 0 && raw[0] !== '0') raw = '0' + raw;
            if (raw.length > 1 && raw[1] !== '5') raw = raw[0] + '5' + raw.substring(2);
            if (raw.length > 11) raw = raw.substring(0, 11);

            var formatted = '';
            for (var i = 0; i < raw.length; i++) {
                if (i === 4 || i === 7 || i === 9) formatted += ' ';
                formatted += raw[i];
            }
            $(this).val(formatted);

            // Hint güncelle
            var $field = $(this).closest('.hrcheck-field');
            $field.removeClass('hrcheck-valid hrcheck-invalid');
            if (raw.length === 11) {
                $field.addClass('hrcheck-valid');
            } else if (raw.length > 0) {
                $field.addClass('hrcheck-invalid');
            }

            checkCanSubmit();
        });

        $phone.on('keypress', function (e) {
            var key = e.which || e.keyCode;
            if (key < 32 || (key >= 48 && key <= 57)) return true;
            e.preventDefault();
            return false;
        });

        $phone.on('paste', function () {
            var self = this;
            setTimeout(function () { $(self).trigger('input'); }, 10);
        });

        /* ── BUTON AKTİFLİK KONTROLÜ ── */
        function checkCanSubmit() {
            var digits = $phone.val().replace(/\D/g, '');
            var phoneOk = digits.length === 11 && /^05[0-9]{9}$/.test(digits);

            var captchaOk = true;
            if (hasCaptcha) {
                captchaOk = !!grecaptcha && !!grecaptcha.getResponse && grecaptcha.getResponse().length > 0;
            }

            $btn.prop('disabled', !(phoneOk && captchaOk));
        }

        // reCAPTCHA tamamlandığında butonu aktifle
        if (hasCaptcha) {
            // reCAPTCHA callback'i global olmalı
            var checkInterval = setInterval(function () {
                if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
                    clearInterval(checkInterval);
                    // Her 500ms'de captcha durumunu kontrol et
                    setInterval(checkCanSubmit, 500);
                }
            }, 300);
        }

        /* ── FORM GÖNDERİMİ ── */
        $form.on('submit', function (e) {
            e.preventDefault();

            // Telefon doğrula
            var digits = $phone.val().replace(/\D/g, '');
            if (digits.length !== 11 || !/^05[0-9]{9}$/.test(digits)) {
                showMessage('Geçerli bir telefon numarası girin (05XX XXX XX XX).', 'error');
                return;
            }

            // reCAPTCHA doğrula
            var recaptchaVal = '';
            if (hasCaptcha) {
                recaptchaVal = grecaptcha.getResponse();
                if (!recaptchaVal) {
                    showMessage('Lütfen "Ben robot değilim" doğrulamasını tamamlayın.', 'error');
                    return;
                }
            }

            // UI: loading
            $btn.prop('disabled', true);
            $btnText.hide();
            $btnSpin.show();
            $result.slideUp(200);
            $message.slideUp(200);

            $.ajax({
                url: hrcheck.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'hrcheck_query',
                    nonce: hrcheck.nonce,
                    phone: digits,
                    recaptcha: recaptchaVal
                },
                success: function (res) {
                    if (res.success) {
                        showResult(
                            res.data.result1,
                            res.data.result2,
                            res.data.result3,
                            res.data.label3
                        );
                    } else {
                        var type = (res.data && res.data.type === 'not_found') ? 'not-found' : 'error';
                        showMessage(res.data.message || 'Bir hata oluştu.', type);
                    }
                },
                error: function () {
                    showMessage('Sunucu hatası, lütfen tekrar deneyin.', 'error');
                },
                complete: function () {
                    $btn.prop('disabled', false);
                    $btnSpin.hide();
                    $btnText.show();
                    // reCAPTCHA'yı sıfırla
                    if (hasCaptcha && typeof grecaptcha !== 'undefined') {
                        grecaptcha.reset();
                    }
                    checkCanSubmit();
                }
            });
        });

        /* ── SONUÇ GÖSTER ── */
        function showResult(val1, val2, val3, label3) {
            $message.slideUp(200);
            $('#hrcheck-result-icon').html(
                '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>' +
                '<polyline points="22 4 12 14.01 9 11.01"/></svg>'
            );
            $('#hrcheck-val-1').text(val1 || '—');
            $('#hrcheck-val-2').text(val2 || '—');

            // 3. Satır DOM'da yoksa (Cache kaynaklı) oluştur
            if ($('#hrcheck-row-3').length === 0) {
                var $row3 = $('<div class="hrcheck-result-row" id="hrcheck-row-3" style="display:none;">' +
                    '<span class="hrcheck-result-label" id="hrcheck-label-3"></span>' +
                    '<span class="hrcheck-result-value" id="hrcheck-val-3"></span>' +
                    '</div>');
                // Row 2'den sonraya ekle
                $('#hrcheck-row-2').after($row3);
            }

            if (val3) {
                if (label3) $('#hrcheck-label-3').text(label3);
                $('#hrcheck-val-3').html(val3); // HTML desteği (alt satırlar için)
                $('#hrcheck-row-3').show();
            } else {
                $('#hrcheck-row-3').hide();
            }

            $result.removeClass('hrcheck-result-notfound').addClass('hrcheck-result-found').slideDown(300);
            scrollTo($result);
        }

        function showMessage(msg, type) {
            $result.slideUp(200);
            $message.removeClass('hrcheck-msg-error hrcheck-msg-not-found');

            if (type === 'not-found') {
                $message.addClass('hrcheck-msg-not-found');
                $message.html(
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
                    '<span>' + msg + '</span>'
                );
            } else {
                $message.addClass('hrcheck-msg-error');
                $message.html(
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
                    '<span>' + msg + '</span>'
                );
            }

            $message.slideDown(300);
            scrollTo($message);
        }

        function scrollTo($el) {
            if ($el.length) {
                $('html, body').animate({ scrollTop: $el.offset().top - 120 }, 300);
            }
        }
    });
})(jQuery);