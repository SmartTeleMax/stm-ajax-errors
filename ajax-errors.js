/*jslint esversion: 6, -W097, browser: true */
/*global $: true, console: true, _ */

'use strict';

import { notificationCenter } from "../main";
import { currentLanguage } from 'config';
import { errorByStatusCode } from 'gov/status_codes';
import "lib/utils"; // _
import {isMobile} from "gov/detector";

$(document).ready(function() {
    var $body = $(document.body);

    var willUnload = false;
    $(window).on('unload', function() {
        willUnload = true;
        $(document).off('ajaxError');
    });

    // AJAX error handling.
    $(document).ajaxError(function(e, xhr, options, error) {
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
                let message = errorByStatusCode(xhr.status) ||  _('Ошибка загрузки');
                if (xhr.status === 404) {
                    showErrorModal();
                } else {
                    notificationCenter.notify(message + ' ' + $.url().attr('base') + (xhr.url || options.url));
                }
                break;
        }
    });

    function showErrorModal() {
        _preloadErrorDialog(function(data) {
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

            if (isMobile.any()) {
                $('.wrapsite').prepend($('.modal_dialog__error_page'));
            }

            $('.wrapsite__overlay, .modal_dialog__close, .nav__item_error .nav__link, .error_right a, .topline__head').on('click', onClose);
        });
    }

    var loadedErrorDialogData = null;

    function _preloadErrorDialog(callback) {
        var url = (window.config ? window.config.staticUrl : '/static/') + currentLanguage + '/404.html';
        if (!loadedErrorDialogData) {
            // Since it is an error page with status 404 we use 'always'.
            $.get(url).always(function(data) {
                loadedErrorDialogData = data;
                if (typeof callback === 'function') {
                    callback(data);
                }
            });
        } else {
            callback(loadedErrorDialogData);
        }
    }



});
