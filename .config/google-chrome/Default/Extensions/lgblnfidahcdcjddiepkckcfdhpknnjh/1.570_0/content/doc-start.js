var currentWindow = window;
var currentDocument = currentWindow.document;
var iframeGuid = createGuid();
var pageData;
var extended_rules;
var pageDataReadyDelegates = [];
var pageDataUpdateDelegates = [];
var pageActionRunning = false;
var pageLoadedInDisabledState = false;
var pageActive = true;
var pubAdsKiller = 'if(window.googletag){var proxy=new Proxy(window.googletag,{get:function(a,b,c){return"pubads"==b||"display"==b?function(){return{}}:a[b]}});window.googletag=proxy}else{var pak;Object.defineProperty(window,"googletag",{configurable:!1,get:function(){return pak&&(pak.pubads=function(){return{}}),pak},set:function(a){return pak=a}})}';
var malwareKiller = 'var tmp;Object.defineProperty(window, "websredir",{configurable:false,get:function(){return tmp;},set:function(obj){if(obj instanceof Array)throw "";else tmp=obj;return tmp;}});';
var suppressUnloadScript = 'window.onbeforeunload=null;Object.defineProperty(window, "onbeforeunload",{configurable:false,get:function(){},set:function(){}});';
var basePageJs = '(function(){' + pubAdsKiller + malwareKiller + '})();';
var whitelistedEasylistDomains = [
    'www.arkadium.com',
    'www.foxnews.com',
    'weather.com'
]
sendMessageToBackground({
    type: stndz.messages.pageData,
    url: location.href,
    referrer: document.referrer
}, initPage, true);

function parseExtendedRules(rules) {
    const result = {};

    for (const key in rules) {
        result[key] = rules[key].map(ruleParser);
    }

    return result;
}

if (window.top == window) {
    document.onreadystatechange = function () {
        if (document.readyState == "interactive") {
            callIn(reportPageInteractive, 0);
        }

        if (document.readyState === 'complete' && extended_rules) {
            document.onreadystatechange = null;
      
            // one-time
            ruleApplier(extended_rules);

            let timeout;

            const debounce = (callback) => (...args) => {
                clearTimeout(timeout);
                timeout = window.setTimeout(() => callback(...args), 100);
            };

            const debouncedRuleApplier = debounce(ruleApplier);

            // and every time
            observeDomChanges(() => {
                debouncedRuleApplier(extended_rules);
            });
          }
    };
}

function reportPageInteractive() {
    sendMessageToBackground({
        type: stndz.messages.pageLoadCompleted,
        ms: window.performance.timing.domInteractive - window.performance.timing.navigationStart
    });
}

function onPageDataReady(delegate) {
    if (pageData) {
        delegate();
    } else {
        pageDataReadyDelegates.push(delegate);
    }
}

function onPageDataUpdate(delegate) {
    pageDataUpdateDelegates.push(delegate);
}

function initPage(message) {


    if (message) {
        message.isEnabled && !message.isDeactivated && !message.isStndzFrame && setPageData(message.pageData);
        message.isStndzFrame && clearLocalStorageIfExpired();
        pageLoadedInDisabledState = !message.pageData.hasStands;
    }
}

function setPageData(data) {
    pageData = data;
    while (pageDataReadyDelegates.length > 0) {
        runSafely(pageDataReadyDelegates.pop());
    }

    if (!pageData.isWhitelisted) {
        collapseBlockedElements();
    }

    currentWindow.styleElement = currentDocument.getElementById('stndz-style') || currentDocument.createElement('style');

    //currentWindow.styleElement2 = currentDocument.getElementById('stndz-style2') || currentDocument.createElement('link');
    //currentWindow.styleElement2.setAttribute('rel', 'stylesheet')
    //currentWindow.styleElement2.setAttribute("type", "text/css")
    //currentWindow.styleElement2.setAttribute('href', 'http://127.0.0.1:8008/static/style.css')
    // //currentWindow.load
    //addElementToHead(currentWindow.styleElement2);
    if (!currentWindow.styleElement.parentElement) {
        currentWindow.styleElement.id = 'stndz-style';
        addElementToHead(currentWindow.styleElement);
    }
    // if (!currentWindow.styleElement2.parentElement) {
    //     currentWindow.styleElement2.id = 'stndz-styl2e';
    //     //addElementToHead(currentWindow.styleElement2);
    // }

    setPageCss(pageData, pageData.customCss);
    pageData.blockPopups && !pageData.isTested && blockPopups(pageData.showBlockedPopupNotification);

    var pageJs = (pageData.js ? "(function(iframeGuid, params){" + pageData.js + "})('" + iframeGuid + "', " + JSON.stringify(pageData.jsParams ? pageData.jsParams : {}) + ");" : "") + (pageData.suppressUnload ? suppressUnloadScript : "");
    addScriptToHead(basePageJs + pageJs);
}

function addDomainToLists(host, blacklist, whitelist) {
    const domains = [];
    const domainParts = host.split('.');
  
    for (let i = 0; i < domainParts.length - 1; i++) {
      domains.push(domainParts.slice(i).join('.'));
    }
  
    const domainInBlackList = domains.find((domain) =>
      blacklist.hasOwnProperty(domain)
    );
    const domainInWhiteList = domains.find((domain) =>
      whitelist.hasOwnProperty(domain)
    );
  
    if (domainInBlackList) {
      blacklist[host] = blacklist[domainInBlackList];
    }
  
    if (domainInWhiteList) {
      whitelist[host] = whitelist[domainInWhiteList];
    }
}

function blockSponsoredStoriesBlocked(blacklist) {
    blacklist['ebay.de'] = blacklist['ebay.de'] || [];
  
    Object.keys(blacklist).forEach((key) => {
        if (key.startsWith('ebay')) {
            blacklist[key].push('.x-ads-placements');
        }
    });
}

function getEasylistCss(pageData) {
    var promise = new Promise(function (resolve, reject) {
        chrome.storage.local.get('easylistCssList', function (res) {
            if (!pageData) {
                resolve([])
            }
            
            var css = res['easylistCssList']['css_rules']
            var blacklist = css.blacklist || {}
            var whitelist = css.whitelist || {}

            extended_rules = parseExtendedRules(css.extended_rules);

            if (pageData.isSponsoredStoriesBlocked) {
                blockSponsoredStoriesBlocked(blacklist);
            }
            
            const host = pageData.topHostAddress || pageData.hostAddress || '';
            addDomainToLists(host, blacklist, whitelist);
            
            var currentPageEasylistCss = []
            var all_css = []
            if (blacklist.hasOwnProperty(host)) {
                currentPageEasylistCss.push(blacklist[host])
            }
            if (blacklist.hasOwnProperty('*')) {
                all_css = blacklist['*']//currentPageEasylistCss.push({'*': blacklist['*']})
            }
            if (whitelist.hasOwnProperty(host)) {
                all_css = all_css.filter(val => !whitelist[host].includes(val))

            }
            resolve([...currentPageEasylistCss, ...all_css])
        })
    })

    return promise;
}

function updatePageData(data) {
    var previousPageData = pageData;
    pageData = data;

    setPageCss(pageData, pageData.customCss);

    if (pageData.blockPopups && !previousPageData.blockPopups)
        blockPopups(pageData.showBlockedPopupNotification);
    else if (!pageData.blockPopups && previousPageData.blockPopups)
        stopBlockingPopups();

    for (var i = 0; i < pageDataUpdateDelegates.length; i++) {
        pageDataUpdateDelegates[i](pageData, previousPageData);
    }
}

registerToMessages(function (message, sender, sendResponse) {
    switch (message.type) {
        case stndz.messages.hideElement:
            var retry = 3;
            var hideInterval = setInterval(function () {
                retry--;
                var result = markAndHideElement(currentDocument, message.url, message.tag);
                if (!result) {
                    var iframes = currentDocument.getElementsByTagName('iframe');
                    forEach(iframes, function (iframe) {
                        try {
                            result = markAndHideElement(iframe.contentDocument, message.url, message.tag);
                        } catch (e) {
                        }
                    });
                }

                if (result || retry == 0)
                    clearInterval(hideInterval);
            }, 300);
            break;

        case stndz.messages.reportIssueForm:
            currentWindow == currentWindow.top && openReportIssueForm(message.source);
            break;

        case stndz.messages.updatePageData:
            if (pageData) {
                updatePageData(message.pageData);
            } else {
                pageLoadedInDisabledState = true;
                initPage(message);
                hideAllRelevantElements(currentDocument);
            }
            break;
    }
});

var popupScriptEmbedded = false;

function blockPopups(showNotification) {
    var scriptContent = popupScriptEmbedded ? 'window.postMessage({type: "stndz-popup-update", iframeGuid: "' + iframeGuid + '", active: true}, "*");' :
        '(' + blockPopupsFunc.toString() + ')(' + JSON.stringify({
            type: stndz.messages.popupUserAction,
            machineId: pageData.machineId,
            iframeGuid: iframeGuid
        }) + ',' + showNotification.toString() + ', \'' + extensionId + '\', ' + JSON.stringify(pageData.popupRules) + ');';
    addScriptToHead(scriptContent);
    popupScriptEmbedded = true;
}

function stopBlockingPopups() {
    addScriptToHead('window.postMessage({type: "stndz-popup-update", iframeGuid: "' + iframeGuid + '", active: false}, "*");');
}

function shutdownBlockingPopups() {
    addScriptToHead('window.postMessage({type: "stndz-popup-update", machineId: "' + pageData.machineId + '", iframeGuid: "' + iframeGuid + '", shutdown: true}, "*");');
}

function markAndHideElement(doc, url, tag) {
    var elements = doc.getElementsByTagName(tag);
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        if (isElementByUrl(element, url) && !hasAttribute(element, stndz.attributes.blockedAdElement)) {

            hideElement(element);
            if (element.parentNode && element.parentNode.tagName == 'A')
                hideElement(element.parentNode);

            return true;
        }
    }

    return false;
}

function collapseBlockedElements() {
    var blockedElements = currentDocument.querySelectorAll('[' + stndz.attributes.blockedAdElement + ']');
    for (var i = 0; i < blockedElements.length; i++) {
        setAttribute(blockedElements[i], 'style', 'display: none !important;' + ifnull(getAttribute(blockedElements[i], 'style'), ''));
    }
}

function hideElement(element) {
    var hideMethod = pageData && !pageData.isWhitelisted ? 'display: none !important' : 'visibility: hidden !important';
    setAttribute(element, 'style', hideMethod + ';' + ifnull(getAttribute(element, 'style'), ''));
    setAttribute(element, stndz.attributes.blockedAdElement);
}

function isElementByUrl(element, url) {
    try {
        switch (element.tagName) {
            case 'IMG':
            case 'IFRAME':
                return stripProtocolFromUrl(element.src) === stripProtocolFromUrl(url);
            default:
                return false;
        }
    } catch (e) {
        return false;
    }
}

function setPageCss(pageData, customCss) {
    var result = (pageData.css ? pageData.css : '') + (customCss ? customCss : '');

    if (pageData.blockAdsOnSearch && currentWindow == currentWindow.top)
        result += searchCss();

    if (pageData.isSponsoredStoriesBlocked)
        result += sponsoredStoriesCss();

    if (pageData.blockWebmailAds)
        result += webmailCss();

    getEasylistCss(pageData).then(function (res) {
        if (window.location.href.includes('www.foxnews.com')){
            return
        }
        for (var whitelist_el of whitelistedEasylistDomains) {
            window.__googlefc = function (){}
            if (window.location.href.includes(whitelist_el)){
                res = res.filter(function (el){
                    for (let v of "pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad ad01".split(' ')){
                        if (el.includes(v)){
                            return false
                        }
                    }
                    return true
                })
                //res = res.filter(function (el){return el.includes('ad')})
                //res = res.filter(function (el){return el != '.ad'})
            }
        }
        var easylistCss = res;
        var style_name = 'stndzEasylist';
        var count_per_style = 2500;
        const styleElementIds = [];

        if (![
            'videa.hu',

        ].includes(window.location.host)) {
            for (var i = 0; i < Math.ceil(easylistCss.length / count_per_style); i++) {
                if (currentWindow[style_name + i] === undefined) {
                    currentWindow[style_name + i] = currentDocument.getElementById('stndz-style' + i) ||
                        currentDocument.createElement('style');
                    currentWindow[style_name + i].textContent =
                        easylistCss.slice(count_per_style * i, count_per_style * i + count_per_style).join(', ') +
                        '{display: none !important;}'

                    if (!currentWindow[style_name + i].parentElement) {
                        currentWindow[style_name + i].id = 'stndz-style' + i;
                        addElementToHead(currentWindow[style_name + i]);
                    }

                    styleElementIds.push(`stndz-style${i}`);
                }
            }
            addStyleRulesToShadowDomNodes(styleElementIds);
        }

        /*
        ALTERNATIVE WAY TO CREATE ELEMENTS
        TODO: Do not remove it for now pls. Methods for easylist rules adding now in test. might me changed to next commented code.
        * */
        // easylistCss.forEach(function (value, index, array){
        //
        //     try {
        //         var el = currentWindow.document.querySelectorAll(value)
        //         if (el && el.length){
        //
        //             result += value + ', '
        //
        //         }
        //     }
        //     catch (e){
        //
        //     }
        // })
        //
        // if(result.slice(-2) == ', '){
        //     result = result.slice(0, -2)
        // }

    }).catch(function (err) {
    })
    currentWindow.styleElement.textContent = result;

}

function clearPageCss() {
    document.head.removeChild(currentWindow.styleElement);
}

function searchCss() {
    if (currentDocument.location.host.indexOf('google.') > -1) {
        return '.ads-ad, ._Ak { display: none !important; }';
    } else if (currentDocument.location.host.indexOf('search.yahoo.com') > -1) {
        return '#main > div > ol { display: none; } #main > div > ol[class*="searchCenterFooter"] { display: initial !important; } #right { display: none !important; } ';
    }

    return '';
}

function sponsoredStoriesCss() {
    if (endsWith(currentDocument.location.host, '.yahoo.com')) {
        return '.moneyball-ad, .js-stream-ad, .js-stream-featured-ad, .featured-ads, .media-native-ad, #td-applet-ads_container, div[class*="js-sidekick-item"][data-type="ADS"] { display: none !important; } ';
    }

    var css = 'div[class*="item-container-obpd"], a[data-redirect*="paid.outbrain.com"], a[onmousedown*="paid.outbrain.com"] { display: none !important; } a div[class*="item-container-ad"] { height: 0px !important; overflow: hidden !important; position: absolute !important; } '; // outbrain
    css += 'div[data-item-syndicated="true"] { display: none !important; } '; // taboola
    css += '.grv_is_sponsored { display: none !important; } '; // gravity
    css += '.zergnet-widget-related { display: none !important; } '; // zergnet

    return css;
}

function webmailCss() {
    if (currentDocument.location.host.indexOf('mail.google.') > -1) {
        return 'div[class=aKB] { display: none !important; } ';
    } else if (currentDocument.location.host.indexOf('mail.yahoo.') > -1) {
        return '#shellcontent { right: 0px !important; } #theAd { display: none !important; } .ml-bg .mb-list-ad { display: none !important; position: absolute !important; visibility: hidden !important; } ';
    }

    return '';
}

function stripProtocolFromUrl(url) {
    return url.indexOf('http:') == 0 ? url.substring('http:'.length) : url.indexOf('https:') == 0 ? url.substring('https:'.length) : url;
}

function onAddedToExistingPage(machineId) {
    if (pageData) {
        pageData.machineId = machineId; // in case the page data was created before machine id was set
        window.postMessage({
            type: stndz.messages.contentScriptVersionUpgrade,
            machineId: machineId,
            iframeGuid: iframeGuid
        }, "*");
        hideAllRelevantElements(currentDocument);
    }
}

function hideAllRelevantElements(doc) {
    for (var i = 0; i < containerElementTags.length; i++) {
        var tagName = containerElementTags[i];
        var elements = doc.getElementsByTagName(tagName);

        for (var k = 0; k < elements.length; k++) {
            var element = elements[k];
            if (elementHasAdHints(element) && element.clientWidth * element.clientHeight > 1000 && !isContainingContent(element) && element.children.length > 0) {
                setAttribute(element, 'style', 'display: none !important;' + ifnull(getAttribute(element, 'style'), ''));
            }
        }
    }
}

function addScriptToHead(textContent) {
    var removeScriptElement = ';(function(){document.currentScript.parentElement.removeChild(document.currentScript);})();';
    var script = currentDocument.createElement('script');
    script.textContent = textContent + removeScriptElement;
    addElementToHead(script);
}

function addElementToHead(element) {
    if (document.head) {
        document.head.insertBefore(element, document.head.firstChild);
    } else {
        callIn(function () {
            addElementToHead(element);
        }, 10);
    }
}

function openReportIssueForm(source) {
    if (pageActionRunning)
        return;

    pageActionRunning = true;
    var style = currentDocument.createElement('style');
    style.textContent = "body {overflow: hidden !important;} body>*:not(#stndz-report) { -webkit-filter:blur(5px) !important; }";
    currentDocument.body.appendChild(style);
    var loaded = false
    var iframe = createIframe(currentDocument, "stndz-report", getExtensionRelativeUrl('/views/web_accessible/report/report-issue.html') + "?source=" + source, "100%", "100%", "position: fixed; top: 0px; left: 0px; z-index: 2147483647;");
    iframe.onload = function () {
        try {
            if (loaded) {
                loaded = false
                currentDocument.body.removeChild(style);
                currentDocument.body.removeChild(iframe);
                pageActionRunning = false
            }
            loaded = true
        } catch (e) {
            // console.log(e)
        }
    };

    currentDocument.body.appendChild(iframe);
}

function clearLocalStorageIfExpired() {
    try {
        if (window.location.href == 'about:blank')
            return;

        var key = 'lastLsTimeStamp';
        if (localStorage.length > 0 && (localStorage[key] == null || daysDiff(new Date(localStorage[key]), new Date()) >= 1)) {
            localStorage.clear();
            localStorage[key] = (new Date()).toString();
        }
    } catch (e) {
    }
}

function shutdownBecauseOfUpgrade() {
    if (pageActive) {
        stopHandlingWindowMessages();
        shutdownBlockingPopups();
        clearPageCss();
        pageActive = false;
    }
}
