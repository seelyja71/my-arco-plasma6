window.addEventListener("message", handleWindowMessagesInContent, false);

function stopHandlingWindowMessages() {
    window.removeEventListener("message", handleWindowMessagesInContent, false);
}

function handleWindowMessagesInContent(eventData) {
    const event = eventData.data;
    if (event && event.iframeGuid == iframeGuid) {
        if (event.type == stndz.messages.popupUserAction) {

            sendMessageToBackground({
                type: stndz.messages.popupUserAction,
                hostAddress: pageData.hostAddress,
                site: pageData.site,
                topHostAddress: pageData.topHostAddress,
                url: encodeURIComponent(window.location.href),
                popupHost: event.popupHost,
                popupUrl: event.popupUrl ? encodeURIComponent(event.popupUrl) : null,
                option: event.option,
                blockType: event.blockType
            });

        } else if (event.type == stndz.messages.popupBlocked) {

            sendMessageToBackground({
                type: stndz.messages.popupBlocked,
                eventTypeId: stndz.logEventTypes.popupBlocked,
                data: {
                    hostAddress: pageData.hostAddress,
                    site: pageData.site,
                    topHostAddress: pageData.topHostAddress,
                    url: encodeURIComponent(window.location.href),
                    blockType: event.blockType,
                    popupHost: event.popupHost,
                    popupUrl: event.popupUrl ? encodeURIComponent(event.popupUrl) : null
                }
            });

        } else if (event.type == 'ad-block-wall') {
            sendMessageToBackground({
                type: stndz.messages.adBlockWall,
                host: pageData.hostAddress,
                url: event.url
            });
        }

        return;
    }
}

chrome.runtime.onMessage.addListener(handleWindowMessages);

function handleWindowMessages(event) {
    // console.log('getting message in content', event)
    // changed event.data to event
    if (pageData && event && event.type == stndz.messages.contentScriptVersionUpgrade && event.machineId == pageData.machineId && event.iframeGuid != iframeGuid) {
        shutdownBecauseOfUpgrade();
        return;
    }

    if (event.type == 'stndz-show-popup-notification') {
        window.top.postMessage({
            type: 'stndz-show-popup-notification',
            iframeGuid: iframeGuid
        }, '*');
    }

    // if (!event.origin.match(/^http(s)?:\/\/(.*\.)?(localhost|lgblnfidahcdcjddiepkckcfdhpknnjh|lngjmaohjfjlmbggeodkgpokfbdemejg|standsapp.org|stndz.com)(:\d*)?/i))
    //     return;
    if (!event.fromStandsPopup) {
        return
    }

    const responseData = {
        forStandsPopup: true,
    }

    switch (event.type) {
        case 'check-stands-request':
            responseData.type = 'check-stands-response';
            chrome.runtime.sendMessage(responseData)
            // window.postMessage({ type: 'check-stands-response' }, '*');
            break;

        // case stndz.messages.updateUser:
        //     sendMessageToBackground(event, function(result) {
        //         responseData.type = 'update-user-response';
        //         responseData.requestId = event.requestId;
        //         responseData.result = result;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: 'update-user-response', requestId: event.requestId, result: result }, '*');
        //     });
        //     break;

        // case stndz.messages.getUserData:
        //     sendMessageToBackground(event, function(userData) {
        //         responseData.type = stndz.messages.getUserData + '-response';
        //         responseData.userData = userData;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.getUserData + '-response', userData: userData }, '*');
        //     });
        //     break;

        // case stndz.messages.getUserSettings:
        //     sendMessageToBackground(event, function(settings) {
        //         responseData.type = stndz.messages.getUserSettings + '-response';
        //         responseData.settings = settings;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.getUserSettings + '-response', settings: settings }, '*');
        //     });
        //     break;

        // case stndz.messages.updateUserSettings:
        //     sendMessageToBackground(event, function(result) {
        //         responseData.type = stndz.messages.updateUserSettings + '-response';
        //         responseData.requestId = event.requestId;
        //         responseData.result = result;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.updateUserSettings + '-response', requestId: event.requestId, result: result }, '*');
        //     });
        //     break;

        // case stndz.messages.getAppData:
        //     sendMessageToBackground(event, function(stats) {
        //         responseData.type = stndz.messages.getAppData + '-response';
        //         responseData.stats = stats;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.getAppData + '-response', stats: stats }, '*');
        //     });
        //     break;

        // case stndz.messages.getDashboardData:
        //     sendMessageToBackground(event, function(data) {
        //         responseData.type = stndz.messages.getDashboardData + '-response';
        //         responseData.data = data;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.getDashboardData + '-response', data: data }, '*');
        //     });
        //     break;

        // case stndz.messages.setDashboardData:
        //     sendMessageToBackground(event, function() {
        //         responseData.type = stndz.messages.setDashboardData + '-response';
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.setDashboardData + '-response' }, '*');
        //     });
        //     break;

        // case stndz.messages.getBlockingData:
        //     sendMessageToBackground(event, function(data) {
        //         responseData.type = stndz.messages.getBlockingData + '-response';
        //         responseData.data = data;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.getBlockingData + '-response', data: data }, '*');
        //     });
        //     break;

        // case stndz.messages.disableAdBlockers:
        //     sendMessageToBackground(event, function(disabled) {
        //         responseData.type = stndz.messages.disableAdBlockers + '-response';
        //         responseData.requestId = event.requestId;
        //         responseData.disabled = disabled;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.disableAdBlockers + '-response', requestId: event.requestId, disabled: disabled }, '*');
        //     });
        //     break;

        // case stndz.messages.getAdBlocker:
        //     sendMessageToBackground(event, function(adBlockerData) {
        //         responseData.type = stndz.messages.getAdBlocker + '-response';
        //         responseData.adBlockerData = adBlockerData;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.getAdBlocker + '-response', adBlockerData: data }, '*');
        //     });
        //     break;

        // case stndz.messages.deactivatedSitesRequest:
        //     sendMessageToBackground(event, function(success) {
        //         responseData.type = 'deactivated-sites-response';
        //         responseData.requestId = event.requestId;
        //         responseData.success = success;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: 'deactivated-sites-response', requestId: event.requestId, success: success }, '*');
        //     });
        //     break;

        // case stndz.messages.popupSitesRequest:
        //     sendMessageToBackground(event, function(success) {
        //         responseData.type = 'popup-sites-response';
        //         responseData.requestId = event.requestId;
        //         responseData.success = success;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: 'popup-sites-response', requestId: event.requestId, success: success }, '*');
        //     });
        //     break;

        // case stndz.messages.refreshUserData:
        //     sendMessageToBackground(event, function() {
        //         responseData.type = stndz.messages.refreshUserData + '-response';
        //         responseData.requestId = event.requestId;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.refreshUserData + '-response', requestId: event.requestId }, '*');
        //     });
        //     break;

        // case stndz.messages.undoBlockedElements:
        //     sendMessageToBackground(event, function() {
        //         responseData.type = stndz.messages.undoBlockedElements + '-response';
        //         responseData.requestId = event.requestId;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.undoBlockedElements + '-response', requestId: event.requestId }, '*');
        //     });
        //     break;

        // case stndz.messages.countBlockedElements:
        //     sendMessageToBackground(event, function(count) {
        //         responseData.type = stndz.messages.countBlockedElements + '-response';
        //         responseData.count = count;
        //         chrome.runtime.sendMessage(responseData)
        //         // window.postMessage({ type: stndz.messages.countBlockedElements + '-response', count: count }, '*');
        //     });
        //     break;

        // case stndz.messages.refreshCurrentTab:
        // case stndz.messages.reportIssue:
        // case stndz.messages.blockElement:
        //     sendMessageToBackground(event);
        //     break;
    }
}
