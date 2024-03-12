function showNotificationsInterval() {
    if (isLastMinutes(lastActivity, 1) == false)
        return;

    getCurrentWindow(function(currentWindow) {
        if (!currentWindow || !currentWindow.focused)
            return;

        var currentHour = utcTimeGetter().getHours();
        var activityDays = $stats.getActivityDays();
        if (currentHour <= 12 || currentHour >= 19 || extensionNotifications.canShowNotifications() == false || activityDays < 3)
            return;

        $st.onUserReady(function(userData) {
            if (userData.chromeNotifications && userData.chromeNotifications.length) {
                var notification = userData.chromeNotifications[0];
                callUrl({
                    url: stndz.resources.setReadNotification.replace('[USERID]', userData.privateUserId).replace('[ID]', notification.id),
                    method: 'PUT'
                }, function() {
                    if (extensionNotifications.wasSeen(notification.id) == false) {
                        extensionNotifications.markAsSeen(notification.id);
                        showCustomNotification(notification.title, notification.text, notification.button, notification.url);
                    }

                    refreshUserData();
                });
                return;
            }

            if (extensionNotifications.wasSeen("rate-request"))
                return;

            var donations = $stats.getTotalDonations();
            if (hasAdBlocker == false && stndz.settings.adsEnabled && donations > 0 && userData.stands && userData.stands.length) {

                var title = chrome.i18n.getMessage('you_raised_donations', [getNormalizedNumber(donations), userData.stands[0].causes[0].causeName]);
                var message = chrome.i18n.getMessage('rate_fairads');
                var url = getRateUrl(fairAdsExtensionId);
                showRateNotification(title, message, url, 'donations');
                extensionNotifications.markAsSeen("rate-request");

            } else {

                var stats = $stats.getSummary();
                var title = chrome.i18n.getMessage('you_blocked_ads_popups_and_saved', [getNormalizedNumber(stats.blocking.total.adServersBlocks), getNormalizedNumber(stats.blocking.total.popupBlocks), getNormalizedTime(stats.loadTimes.total.timeSaved)]);
                var message = chrome.i18n.getMessage('would_rate');
                showRateNotification(title, message, rateUrl, 'blocks');
                extensionNotifications.markAsSeen("rate-request");

            }
        });
    });
}

function showCustomNotification(title, message, buttonText, url) {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: title,
        message: message,
        priority: 2,
        requireInteraction: true,
        buttons: [
            {
                title: buttonText
            },
            {
                title: chrome.i18n.getMessage('close')
            }
        ]
    };

    var details = {
        type: "custom",
        url: url
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function showRateNotification(title, message, url, variant) {
    var options = {
        type: "basic",
        iconUrl: "icons/38.png",
        title: title,
        message: message,
        priority: 2,
        requireInteraction: true,
        buttons: [
            {
                title: "Rate",
                iconUrl: "/icons/rate-star.png"
            },
            {
                title: chrome.i18n.getMessage('close')
            }
        ]
    };

    var details = {
        type: "rate-request",
        url: url
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
    updateUserAttributes({
        rateRequestTime: getLocalDateAndMinuteString(utcTimeGetter()),
        utcRateRequestTime: getUtcDateAndMinuteString(utcTimeGetter()),
        rateRequestVariant: variant
    });
}

function showReactivateNotification() {
    if (stndz.settings.enabled)
        return;

    getStorageValue(stndz.constants.pauseConfirmedTime, function(exists, value) {
        if (exists && value)
            return;

        var options = {
            type: "basic",
            iconUrl: "icons/48.png",
            title: chrome.i18n.getMessage('turn_on_fair_adblocking'),
            message: chrome.i18n.getMessage('stands_turned_off_would_turn'),
            priority: 2,
            requireInteraction: true,
            buttons: [
                {
                    title: chrome.i18n.getMessage('turn_on'),
                    iconUrl: "/icons/turn-on.png"
                },
                {
                    title: chrome.i18n.getMessage('keep_off')
                }
            ]
        };

        var details = {
            type: "reactivate-request",
            rand: getRandom()
        };

        createNotification(JSON.stringify(details), options, function(notificationId) { });
        //updateUserAttributes({
        //    reactivateRequestTime: getLocalDateAndSecondString(utcTimeGetter())
        //});

    });
}

function showAdBlockersDisabledNotification() {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: chrome.i18n.getMessage('other_disabled'),
        message: "",
        priority: 2,
        buttons: [
            {
                title: chrome.i18n.getMessage('close')
            }
        ]
    };

    var details = {
        type: "ad-blockers-disabled-ack",
        rand: getRandom()
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function showEnableDisableStandsNotification() {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: stndz.settings.enabled ? 
            chrome.i18n.getMessage('stands_back_on'): 
            chrome.i18n.getMessage('stands_turned_off'),
        message: chrome.i18n.getMessage('refresh_take_effect'),
        priority: 2,
        buttons: [
            {
                title: chrome.i18n.getMessage('refresh'),
                iconUrl: "/icons/refresh.png"
            },
            {
                title: chrome.i18n.getMessage('close'),
                iconUrl: "/icons/close.png"
            }
        ]
    };

    var details = {
        type: "enable-disable-stands",
        tabId: activeTabId,
        rand: getRandom()
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function showEnableDisableStandsCurrentSiteNotification(tabId, enable, host) {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: enable ? 
            chrome.i18n.getMessage('blocking_resumed', host) : 
            chrome.i18n.getMessage('the_site_was_whitelisted', host),
        message: chrome.i18n.getMessage('refresh_take_effect'),
        priority: 2,
        buttons: [
            {
                title: chrome.i18n.getMessage('refresh'),
                iconUrl: "/icons/refresh.png"
            },
            {
                title: chrome.i18n.getMessage('close')
            }
        ]
    };

    var details = {
        type: "enable-disable-stands-current-site",
        tabId: tabId,
        rand: getRandom()
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function showUnblockElementsNotification(elementsCount) {
    const elems = elementsCount > 1 ? 
        chrome.i18n.getMessage('elements') : 
        chrome.i18n.getMessage('element');
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: elementsCount > 0 ? 
            chrome.i18n.getMessage('you_unblocked_on_this_page', [elementsCount, elems]) :
            chrome.i18n.getMessage('no_blocked_on_this_page'),
        message: "",
        priority: 2,
        buttons: [
            {
                title: chrome.i18n.getMessage('close')
            }
        ]
    };

    var details = {
        type: "unblock-elements",
        rand: getRandom()
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function showAdBlockWallNotification(tabId, host, goToUrl) {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: chrome.i18n.getMessage('this_site_shows'),
        message: chrome.i18n.getMessage('would_bypass'),
        priority: 2,
        buttons: [
            {
                title: chrome.i18n.getMessage('bypass')
            },
            {
                title: chrome.i18n.getMessage('whitelist')
            }
        ]
    };

    var details = {
        type: "ad-block-wall",
        tabId: tabId,
        host: host,
        goToUrl: goToUrl,
        rand: getRandom()
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function showBypassWithAdBlockerNotification(tabId, host, goToUrl, bypass) {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: bypass ? 
            chrome.i18n.getMessage('other_prevents') : 
            chrome.i18n.getMessage('other_blocks'),
        message: chrome.i18n.getMessage('would_disable_other'),
        priority: 2,
        buttons: [
            {
                title: chrome.i18n.getMessage('disable_other')
            },
            {
                title: chrome.i18n.getMessage('dismiss')
            }
        ]
    };

    var details = {
        type: "ad-block-wall-disable-adblock",
        tabId: tabId,
        host: host,
        goToUrl: goToUrl,
        rand: getRandom()
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function showFrequentClosedPopupsNotification(counter) {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: chrome.i18n.getMessage('has_closed_popups', counter),
        message: chrome.i18n.getMessage('would_stop'),
        priority: 2,
        requireInteraction: true,
        buttons: [
            {
                title: chrome.i18n.getMessage('continue')
            },
            {
                title: chrome.i18n.getMessage('stop_closing')
            }
        ]
    };

    var details = {
        type: closePopupsSettings.notificationKey
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
    //updateUserAttributes({ closedPopupNotificationTime: getLocalDateAndSecondString(utcTimeGetter()) });
    extensionNotifications.markAsSeen(closePopupsSettings.notificationKey);
}

function showDonateNotification() {
    var options = {
        type: "basic",
        iconUrl: "icons/48.png",
        title: chrome.i18n.getMessage('donation_settings_title'),
        message: chrome.i18n.getMessage('donation_notification_text', ['Stands']),
        priority: 2,
        requireInteraction: true,
        buttons: [
            {
                title: chrome.i18n.getMessage('donate'),
            },
            {
                title: chrome.i18n.getMessage('close'),
            },
        ]
    };

    var details = {
        type: "donate",
        url: 'https://www.standsapp.org/donate/?utm_source=organic&utm_medium=pushnotification&utm_campaign=donate'
    };

    createNotification(JSON.stringify(details), options, function(notificationId) { });
}

function onNotificationButtonClick(notificationId, buttonIndex) {
    var details = JSON.parse(notificationId);
    switch (details.type) {
        case "rate-request":
            if (buttonIndex == 0) {
                openTabWithUrl(details.url);
                updateUserAttributes({ rateRequestAgreeTime: getLocalDateAndSecondString(utcTimeGetter()) });
            } else if (buttonIndex == 1) {
                updateUserAttributes({ rateRequestCloseTime: getLocalDateAndSecondString(utcTimeGetter()) });
            }
            break;

        case "enable-disable-stands":
        case "enable-disable-stands-current-site":
            if (buttonIndex == 0) {
                reloadTab(details.tabId);
            }
            break;

        case "reactivate-request":
            if (buttonIndex == 0) {
                toggleStandsStateClicked("Notification");
            } else if (buttonIndex == 1) {
                setSingleStorageValue(stndz.constants.pauseConfirmedTime, true);
                //updateUserAttributes({ pauseConfirmedTime: getLocalDateAndSecondString(utcTimeGetter()) });
            }
            break;

        case "ad-block-wall":
            if (buttonIndex == 0) {
                updateJsRuleParameters(details.host, {bypass:true});
                if (hasAdBlocker) {
                    showBypassWithAdBlockerNotification(details.tabId, details.host, details.goToUrl, true);
                } else {
                    setTimeout(function() {
                        if (details.goToUrl)
                            updateTabUrl(details.tabId, details.goToUrl, true);
                        else
                            reloadTab(details.tabId);
                    }, 500);
                }

                //updateUserAttributes({
                //    lastAdBlockWallBypass: getUtcDateAndMinuteString(utcTimeGetter())
                //});

                reportAnonymousData('adblock-wall-bypass', {
                    host: details.host
                });

            } else if (buttonIndex == 1) {
                sendMessageToBackground({
                    type: stndz.messages.deactivatedSitesRequest,
                    hosts: [{
                        hostAddress: details.host,
                        deactivate: true
                    }]
                }, function() {
                    if (hasAdBlocker)
                        showBypassWithAdBlockerNotification(details.tabId, details.host, details.goToUrl, false);
                    else {
                        setTimeout(function() {
                            if (details.goToUrl)
                                updateTabUrl(details.tabId, details.goToUrl, true);
                            else
                                reloadTab(details.tabId);
                        }, 500);
                    }
                });

                //updateUserAttributes({
                //    lastAdBlockWallWhitelist: getUtcDateAndMinuteString(utcTimeGetter())
                //});

                reportAnonymousData('adblock-wall-whitelist', {
                    host: details.host
                });
            }
            break;

        case "ad-block-wall-disable-adblock":
            if (buttonIndex == 0) {
                sendMessageToBackground({
                    type: stndz.messages.disableAdBlockers,
                    source: 'bypass'
                }, function(disabled) {
                    if (disabled) {
                        setTimeout(function() {
                            if (details.goToUrl)
                                updateTabUrl(details.tabId, details.goToUrl, true);
                            else
                                reloadTab(details.tabId);
                        }, 500);
                    }
                });
            }
            break;

        case closePopupsSettings.notificationKey:
            if (buttonIndex == 1) {
                sendMessageToBackground({
                    type: stndz.messages.updateUserSettings,
                    settings: { closePopups: false }
                });
            }
            break;

        case "custom":
            if (buttonIndex == 0) {
                openTabWithUrl(details.url);
            }
            break;

        case 'donate':
            if (buttonIndex === 0) {
                openTabWithUrl(details.url);
            }
            break;
    }

    clearNotification(notificationId);
}

function onNotificationClick(notificationId) {
    var details = JSON.parse(notificationId);
    switch (details.type) {
        case "rate-request":
            openTabWithUrl(details.url);
            updateUserAttributes({ rateRequestAgreeTime: getLocalDateAndSecondString(utcTimeGetter()) });
            break;

        case "enable-disable-stands":
        case "enable-disable-stands-current-site":
            reloadTab(details.tabId);
            break;

        case "reactivate-request":
            toggleStandsStateClicked("Notification");
            break;

        case "ad-block-wall":
            updateJsRuleParameters(details.host, {dismiss: true});
            break;

        case "ad-block-wall-disable-adblock":
            updateJsRuleParameters(details.host, {dismiss: true});
            break;

        case "custom":
            openTabWithUrl(details.url);
            break;

        case 'donate':
            openTabWithUrl(details.url);
            break;
    }

    clearNotification(notificationId);
}

function onNotificationClosed(notificationId, byUser) {
    var details = JSON.parse(notificationId);
    switch (details.type) {
        case "rate-request":
            //byUser && updateUserAttributes({ rateRequestCloseTime: getLocalDateAndSecondString(utcTimeGetter()) });
            break;

        case "ad-block-wall":
            //byUser && updateJsRuleParameters(details.host, {dismiss: true});
            break;
    }
}
