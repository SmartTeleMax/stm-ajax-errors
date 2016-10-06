/*jslint esversion: 6, -W097, browser: true */
/*global console: true */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.errorByStatusCode = errorByStatusCode;
exports.setUpErrors = setUpErrors;

var _stmDetector = require('stm-detector');

var $ = require('jquery');

var locales = {
    ru: {
        errors: {
            400: 'Неверный запрос',
            403: 'Отказано в доступе',
            404: 'Не найдено',
            405: 'Метод не поддерживается',
            413: 'Размер запроса превышает максимальный допустимый',
            429: 'Слишком много запросов',
            500: 'Внутренняя ошибка сервера',
            502: 'Неверный шлюз',
            503: 'Сервис недоступен',
            504: 'Шлюз не отвечает',
            "default": 'Ошибка загрузки'
        },
        timeout: 'Превышено время ожидания ответа'
    },
    en: {
        400: 'Bad Request',
        403: 'Forbidden',
        404: 'Not found',
        405: 'Method Not Allowed',
        413: 'Request Entity Too Large',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        "default": 'Error while loading'
    },
    timeout: 'The connection has timed out'
};

function errorByStatusCode(statusCode) {
    var language = $('html').prop('lang') || 'en';
    try {
        statusCode = parseInt(statusCode, 10);
    } catch (e) {}

    var errors = locales[language].errors;
    return [statusCode + ''] || errors["default"];
}

function setUpErrors(options) {

    var notificationCenter = options.notificationCenter || { notify: alert };
    var pathTemplate = options.pathTemplate || '/static/{LANG}/{STATUS}.html';
    var show404Page = options.show404Page == undefined ? true : options.show404Page;

    var language = $('html').prop('lang') || 'en';
    language = language.split('_')[0];
    var locale = locales[language];

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
                notificationCenter.notify(locale.timeout);
                break;
            case 'abort':
                // No operations.
                break;
            default:
                console.log('An error with XHR', e, xhr, options, error);
                var message = errorByStatusCode(xhr.status);
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