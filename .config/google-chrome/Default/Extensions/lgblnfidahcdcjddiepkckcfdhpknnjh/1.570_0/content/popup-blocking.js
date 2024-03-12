function blockPopupsFunc(popupBlockMessage, showNotification, extensionId, rules) {
    var popupAllowedRegex = /^(http(s)?:)?\/\/([^\/]*\.)?(pinterest\.com|paid\.outbrain\.com|twitter\.com|paypal\.com|yahoo\.com|facebook\.com|linkedin\.com|salesforce\.com|amazon\.co|google\.co)/i;
    var popupAllowHosts = /^http(s):\/\/([^\/]*\.)?(search\.yahoo\.com|linkedin\.com|facebook\.com|google\.com)/i;
    var anchorPopupsExcludedHosts = { 'sh.st': true };
    var popupRegexRules = null;
    var stndz = {
        active: true,
        originalWindowOpen: window.open,
        originalDocumentCreateElement: document.createElement
    };

    function isPopup(url) {
        if (!url)
            return null;

        if (popupAllowedRegex.test(url))
            return false;

        if (popupRegexRules == null) {
            popupRegexRules = [];
            for (var i = 0; i < rules.length; i++) {
                popupRegexRules.push(new RegExp(rules[i], "i"));
            }
        }

        for (var i = 0; i < popupRegexRules.length; i++) {
            if (popupRegexRules[i].test(url))
                return true;
        }

        if (popupAllowHosts.test(location.href))
            return false;

        return null;
    }

    window.open = function() {
        if (stndz.active == false) {
            return stndz.originalWindowOpen.apply(window, arguments);
        }

        var popupArguments = arguments;
        var openPopupFunc = function() {
            return stndz.originalWindowOpen.apply(window, popupArguments);
        };

        var popupUrl = arguments.length >= 1 && arguments[0] && typeof arguments[0] == "string" ? arguments[0] : null;
        var block = isPopup(popupUrl);
        if (block) {
            showPopupNotificationWindow('ad-popup', popupUrl, openPopupFunc);
            return {};
        } else if (block == false) {
            return openPopupFunc();
        }

        if (popupUrl && popupUrl.indexOf('data:') == 0) {
            showPopupNotificationWindow('data-popup', popupUrl, openPopupFunc);
            return {};
        }

        var targetName = arguments.length >= 2 ? arguments[1] : null;
        if (targetName == '_parent' || targetName == '_self' || targetName == '_top')
            return openPopupFunc();

        if (!window.event)
            return openPopupFunc();

        if (popupUrl) {
            try {
                if (popupUrl.indexOf("/") == 0 && popupUrl.indexOf("//") != 0)
                    return openPopupFunc();

                var windowOpenUrl = new URL(popupUrl);
                if (windowOpenUrl.host.indexOf(window.location.host) > -1 || (windowOpenUrl.host != "" && window.location.host.indexOf(windowOpenUrl.host) > -1))
                    return openPopupFunc();
            } catch(e) { }
        }

        var currentTargetValid = window.event &&
            window.event.currentTarget &&
            window.event.currentTarget !== window &&
            window.event.currentTarget !== document &&
            window.event.currentTarget !== document.body;

        var targetValid = window.event &&
            window.event.target &&
            window.event.target.tagName == 'A' &&
            window.event.target.href.indexOf('http') == 0;

        if (currentTargetValid || targetValid)
            return openPopupFunc();

        if (showNotification)
            showPopupNotificationWindow('not-user-initiated', popupUrl, openPopupFunc);

        return {};
    };

    document.createElement = function() {
        var element = stndz.originalDocumentCreateElement.apply(document, arguments);
        if (element.tagName == 'A') {
            var createTime = new Date();
            var handleAnchorClick = function(event) {
                if (stndz.active == false)
                    return;

                if (element.href == "")
                    return;

                if (anchorPopupsExcludedHosts[document.location.host]) {
                    element.target = "_top";
                } else {
                    var now = new Date();
                    var block = isPopup(element.href);
                    if (block || (now - createTime < 50 && block == null && window.location.hostname.indexOf(element.hostname || null) == -1)) {
                        event.preventDefault();
                        showPopupNotificationWindow('create-link', element.href, function() { element.click(); });
                    }
                }
            };

            element.addEventListener('click', handleAnchorClick, true);
        }

        return element;
    };

    window.addEventListener("message", function(event) {
        switch (event.data.type) {
            case 'stndz-show-popup-notification':
                if (window !== window.top || stndz.active == false || event.data.iframeGuid != popupBlockMessage.iframeGuid)
                    return;

                stndz.stndzPopupActionWindow = event.source;
                stndz.stndzPopupClicked = function(option) {
                    stndz.hidePopupNotification();
                    stndz.stndzPopupActionWindow.postMessage({type: 'stndz-popup-action', option: option}, event.origin);
                };

                if (stndz.popupNotificationOpen) {
                    stndz.highlightPopupNotification();
                } else if (stndz.popupNotificationOpen === false) { // if it was previously opened just show it, the delegate to open the new window was created above
                    stndz.showPopupNotification();
                } else {
                    var notificationElement = createNotificationOnPage();
                    var helpOpen = false;

                    stndz.showPopupNotification = function() {
                        stndz.popupNotificationOpen = true;

                        notificationElement.style.top = '0px';

                        var hidePopupNotificationId;
                        stndz.hidePopupNotification = function() {
                            stndz.popupNotificationOpen = false;
                            notificationElement.style.top = '-300px';
                            if (helpOpen) {
                                stndz.togglePopupNotificationHelp()
                            }
                            clearTimeout(hidePopupNotificationId);
                        };

                        hidePopupNotificationId = setTimeout(stndz.hidePopupNotification, 30 * 1000);
                        notificationElement.onmouseover = function() {
                            clearTimeout(hidePopupNotificationId);
                        };
                    };

                    var originalBackgroundColor = notificationElement.style.backgroundColor;
                    stndz.highlightPopupNotification = function() {
                        notificationElement.style.backgroundColor = '#FFFBCC';
                        setTimeout(function() {
                            notificationElement.style.backgroundColor = originalBackgroundColor;
                        }, 1000);

                        // notificationElement.style.height = '120px';
                        // helpOpen = true;
                    };

                    stndz.togglePopupNotificationHelp = function() {
                        const elem = document.getElementsByClassName("stndz-info")[0];
                        elem.style.top = helpOpen ? '-200px' : '50px';
                        elem.style.opacity = helpOpen ? '0' : '1';
                        helpOpen = !helpOpen;
                    };

                    stndz.showPopupNotification();
                }

                break;

            case 'stndz-popup-action':
                // stndz.stndzPopupAction && stndz.stndzPopupAction(event.data.option);
                window.postMessage({
                    type: 'popup-user-action',
                    iframeGuid: popupBlockMessage.iframeGuid,
                    popupHost: '',
                    popupUrl: '',
                    option: event.data.option,
                    blockType: ''
                }, '*');
    
                if (event.data.option == 'once' || event.data.option == 'allow') {
                    stndz.active = false;
                } else {
                    showNotification = false;
                }               
                  
                break;

            case 'stndz-popup-update':
                if (event.data.shutdown && event.data.machineId == popupBlockMessage.machineId && event.data.iframeGuid != popupBlockMessage.iframeGuid) {
                    stndz.active = false;
                } else if (event.data.iframeGuid == popupBlockMessage.iframeGuid && event.data.active != null) {
                    stndz.active = event.data.active;
                }
                break;
        }
    }, false);

    function showPopupNotificationWindow(blockType, popupUrl, openPopupFunc) {
        if (!showNotification)
            return;

        var popupHost = null;
        try {
            if (popupUrl == "about:blank") {
                popupHost = "about:blank";
            } else {
                var urlDetails = new URL(popupUrl);
                popupHost = urlDetails.host.indexOf('www.') == 0 ? urlDetails.host.substring(4) : urlDetails.host;
            }
        } catch(e) { }

        stndz.stndzPopupAction = function(option) {
            window.postMessage({
                type: 'popup-user-action',
                iframeGuid: popupBlockMessage.iframeGuid,
                popupHost: popupHost,
                popupUrl: popupUrl,
                option: option,
                blockType: blockType
            }, '*');

            if (option == 'once' || option == 'allow') {
                stndz.active = false;
                openPopupFunc && openPopupFunc();
            } else {
                showNotification = false;
            }
        };

        window.top.postMessage({
            type: 'stndz-show-popup-notification',
            iframeGuid: popupBlockMessage.iframeGuid
        }, '*');

        window.postMessage({
            type: 'popup-blocked',
            iframeGuid: popupBlockMessage.iframeGuid,
            blockType: blockType,
            popupHost: popupHost,
            popupUrl: popupUrl
        }, '*');
    }

    function createNotificationOnPage() {
        var style = document.createElement('style');
        style.textContent = '.stndz-popup-notification {' +
            'box-sizing: border-box;' +
            'background-color: #484a54;' +
            'color: white;' +
            'height: 50px;' +
            'padding: 0 2vw;' +
            'align-items: center;' +
            'justify-content: space-between;' +
            'font-size: 14px;' +
            'z-index: 100000;' +
            'position: fixed;' +
            'display: flex;' +
            'top: 0;' +
            'width: 100%;' +
            'font-family: "DMSans", Inter, sans-serif;' +
        '}' +
        '.stndz-button {' +
            'color: #4f567c;' +
            'background-color: white;' +
            'height: 28px;' +
            'min-width: 28px;' +
            'border-radius: 6px;' +
            'font-size: 14px;' +
            'position: relative;' +
            'display: inline-block;' +
            'padding: 0 8px;' +
            'margin: 0;' +
            'white-space: nowrap;' +
            'font-family: sans-serif;' +
            'line-height: normal;' +
            'text-decoration: none;' +
            'text-align: center;' +
            'vertical-align: middle;' +
            'border: 1px solid #c4c7cf;' +
            'outline: 0;' +
            'box-shadow: none;' +
            'cursor: pointer;' +
            'box-sizing: border-box;' +
            'overflow: visible;' +
            'user-select: none;' +
            'touch-action: manipulation;' +
            'font-weight: 500;' +
            'align-items: center;' +
            'justify-content: center;' +
        '}' +
        '.stndz-button:hover {' +
            'background-color: rgb(207,207,207);' +
        '}' + 
        '.stndz-icon {' +
            'position: relative;' +
            'width: 25px;' +
            'height: 30px;' +
        '}' + 
        '.stndz-popup-main {' +
            'z-index: 10001;' +
            'position: relative;' +
            'gap: 14px;' +
            'height: 50px;' +
            'align-items: center;' +
            'display: flex;' +
            'color: white;' +
        '}' +
        '.stndz-popup-main-header {' +
            'padding: 0;' +
            'margin: 0;' +
        '}' +
        '.stndz-help {' +
            'width: 20px;' +
            'height: 20px;' +
            'cursor: pointer;' +
        '}' + 
        '.stndz-close {' +
            'position: relative;' +
            'width: 22px;' +
            'height: 22px;' +
            'cursor: pointer;' +
        '}' + 
        '.stndz-info {' +
            'background-color: #484a54;' +
            'position: absolute;' +
            'top: -200px;' +
            'left: -2vw;' +
            'width: 104vw;' +
            'border-radius: 6px;' +
            'border: 1px solid #c4c7cf;' +
            'line-height: 22px;' +
            'text-align: center;' + 
            'padding: 5px 10px 10px;' +
            'transition: opacity 0.5s;' +
        '}';
        document.documentElement.appendChild(style);

        var div = document.createElement('div');
        div.setAttribute('class', 'stndz-popup-notification');
        div.innerHTML = '<div class="stndz-info">' + 
                'The site tried to open a popup and Stands blocked it.' +
                '<br/>If you don\'t trust this site you should click <b>"Block always"</b>, if you do - click <b>"Allow always"</b>.' +
                '<br/>If you\'re not sure - click <b>"Allow once"</b> which will open the popup and pause popup blocking for the current page visit.' +
                '<br/>You can always change your settings in the application window.' + 
            '</div>' + 
            '<img src="chrome-extension://' + extensionId + 
                '/views/web_accessible/images/icon.png" class="stndz-icon" alt="icon">' +
            '<div class="stndz-popup-main">' +
                '<span class="stndz-popup-main-header"> Site popup blocking settings: </span>' +
                '<div class="stndz-popup-main">' +
                    '<button id="stndz-popup-allow-once" class="stndz-button"> Allow once </button>' +
                    '<button id="stndz-popup-allow" class="stndz-button"> Allow always </button>' +
                    '<button id="stndz-popup-block" class="stndz-button"> Block always </button>' +
                    '<a id="stndz-popup-help">' + 
                        '<img src="chrome-extension://' + extensionId + 
                            '/views/web_accessible/images/help.png" class="stndz-help" alt="help"/>' + 
                    '</a>' +
                '</div>' +
            '</div>' +
            '<a href="javascript:void(0)" id="stndz-popup-close">' + 
                '<img src="chrome-extension://' + extensionId + 
				'/views/web_accessible/images/close.png" class="stndz-close" alt="close"/>' + 
            '</a>';
        document.body.appendChild(div);

        document.getElementById("stndz-popup-allow-once").addEventListener("click", function(event) { event.preventDefault(); stndz.stndzPopupClicked("once") }, true);
        document.getElementById("stndz-popup-allow").addEventListener("click", function(event) { event.preventDefault(); stndz.stndzPopupClicked("allow") }, true);
        document.getElementById("stndz-popup-block").addEventListener("click", function(event) { event.preventDefault(); stndz.stndzPopupClicked("block") }, true);
        document.getElementById("stndz-popup-help").addEventListener("click", function(event) { event.preventDefault(); stndz.togglePopupNotificationHelp() }, true);
        document.getElementById("stndz-popup-close").addEventListener("click", function(event) { event.preventDefault(); stndz.hidePopupNotification(); }, true);

        return div;
    }

    try {
        Object.defineProperty(window,"ExoLoader",{configurable:false,get:function(){return null;},set:function(){return null;}});
        Object.defineProperty(window,"_pao",{configurable:false,get:function(){throw '';},set:function(){throw '';}});

        Object.defineProperty(window,"BetterJsPop",{configurable:false,get:function(){throw '';},set:function(){throw '';}});
        Object.defineProperty(window,"popnsKiller",{configurable:false,get:function(){throw '';},set:function(){throw '';}});
        Object.defineProperty(window,"popns",{configurable:false,get:function(){return 'popnsKiller';},set:function(){return 'popnsKiller';}});
    } catch(e) {}
}