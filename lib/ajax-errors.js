/*jslint esversion: 6, -W097, browser: true */
/*global $: true, console: true */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.errorByStatusCode = errorByStatusCode;
exports.setUpErrors = setUpErrors;

var _stmDetector = require('stm-detector');

function errorByStatusCode(_, statusCode) {
    try {
        statusCode = parseInt(statusCode, 10);
    } catch (e) {}

    var message;
    switch (statusCode) {
        case 400:
            message = _('Неверный запрос');
            break;
        case 403:
            message = _('Отказано в доступе');
            break;
        case 404:
            message = _('Не найдено');
            break;
        case 405:
            message = _('Метод не поддерживается');
            break;
        case 413:
            message = _('Размер запроса превышает максимальный допустимый');
            break;
        case 429:
            message = _('Слишком много запросов');
            break;
        case 500:
            message = _('Внутренняя ошибка сервера');
            break;
        case 502:
            message = _('Неверный шлюз');
            break;
        case 503:
            message = _('Сервис недоступен');
            break;
        case 504:
            message = _('Шлюз не отвечает');
            break;
    }
    return message;
}

function setUpErrors(options) {

    var notificationCenter = options.notificationCenter || { notify: alert };
    var _ = options.gettext || nullTranslation;
    var language = options.language || 'en';
    var pathTemplate = options.pathTemplate || '/static/{LANG}/{STATUS}.html';
    var show404Page = options.show404Page == undefined ? true : options.show404Page;

    var $body = $(document.body);

    var willUnload = false;
    $(window).on('unload', function () {
        willUnload = true;
        $(document).off('ajaxError');
    });

    // AJAX error handling.
    $(document).ajaxError(function (e, xhr, options, error) {
        // Should not handle all current requests errors when unloading/refreshing the page.
        if (willUnload) {
            return;
        }
        switch (error) {
            case 'timeout':
                notificationCenter.notify(_('Превышено время ожидания ответа'));
                break;
            case 'abort':
                // No operations.
                break;
            default:
                console.log('An error with XHR', e, xhr, options, error);
                var message = errorByStatusCode(_, xhr.status) || _('Ошибка загрузки');
                if (xhr.status === 404 && show404Page) {
                    showErrorModal();
                } else {
                    notificationCenter.notify(message + ' ' + $.url().attr('base') + (xhr.url || options.url));
                }
                break;
        }
    });

    function showErrorModal() {
        _preloadErrorDialog(function (data) {
            var $modal = $($.parseHTML(data)).filter('.modal_dialog__error_page'),
                wrapsiteOverlay = $('.wrapsite__overlay');

            $modal.find('.modal_dialog__close').removeAttr('href');
            $body.addClass('error_page');
            wrapsiteOverlay.show();
            $body.append($modal);

            function onClose() {
                $body.removeClass('error_page');
                $modal.remove();
                wrapsiteOverlay.hide();
                wrapsiteOverlay.off('click', onClose);
            }

            if (_stmDetector.isMobile.any()) {
                $('.wrapsite').prepend($('.modal_dialog__error_page'));
            }

            $('.wrapsite__overlay, .modal_dialog__close, .nav__item_error .nav__link, .error_right a, .topline__head').on('click', onClose);
        });
    }

    var loadedErrorDialogData = null;

    function _preloadErrorDialog(callback) {
        var url = pathTemplate.replace('{LANG}', language).replace('{STATUS}', '404');
        if (!loadedErrorDialogData) {
            // Since it is an error page with status 404 we use 'always'.
            $.get(url).always(function (data) {
                loadedErrorDialogData = data;
                if (typeof callback === 'function') {
                    callback(data);
                }
            });
        } else {
            callback(loadedErrorDialogData);
        }
    }
}

function nullTranslation(x) {
    return x;
}