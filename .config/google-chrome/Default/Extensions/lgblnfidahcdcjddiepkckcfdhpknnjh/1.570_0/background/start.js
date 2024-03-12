var runOnPageDataLoaded = null

registerToAllEvents();
getCurrentWindow(function(currentWindow) {
    if (currentWindow) {
        startApp();
    } else {
        onFirstNormalWindowCreated(function() {
            startApp();
        });
    }
});

function reportExtensionStart() {
    $st.onUserReady(function (userData) {
        serverLogger.log(stndz.logEventTypes.extensionStart, {
            publicUserId: userData.publicUserId,
            userAgent: navigator.userAgent,
            extensionId: extensionId,
        });
    });
}

function checkDonateNotifications() {
    $st.onUserReady(function(userData) {
        // for test
        // actionInCaseWhitelistYoutube(userData);
        
        callUrl({
            url: `https://new-prod.standsapp.org/user/notifications/${userData?.privateUserId || ''}`,
            headers: [{ name: 'Content-Type', value: 'text/plain' }],
            method: 'GET'
        }, function(result) {
            for (let i = 0; i < result.length; i++) {
                const notification = result[i];
                if (notification.typeId === 3 && !notification.read) {
                    callIn(showDonateNotification, 60 * 1000);
                }

                // for test
                if (notification.typeId === 13 && !notification.read) {
                    console.log('You are in test group! Youtube has been whitelisted!');

                    actionInCaseWhitelistYoutube(userData);
                }
            }
        }, function(failResult) {
            console.error('Error on showDonateNotificationToUser', failResult.statusCode);
        });   
    })
}

function actionInCaseWhitelistYoutube(userData) {
    serverLogger.log(stndz.logEventTypes.reportExperiment, {
        privateUserId: userData.privateUserId,
        publicUserId: userData.publicUserId,
        hosts: deactivatedSites.hosts
    }).flush();
    deactivatedSites.add('youtube.com');

    queryTabs({}, function(tabs) {
        for (const tab of tabs) {
            if (tab.url?.includes('youtube.com') && tab.id !== undefined) {
                reloadTab(tab.id);
            }
        }
    });
}

function startApp() {
    loadOrCreateUser(function() {
        loadCoreVariables(function() {
            try {
                loadLists();
                startStats();
                createPageDatasAndContextMenus();
                startJobs();
                updateBrowserProperties();

                setUninstallUrlParams();
                setAppIconBadgeBackgroundColor();
                loadSyncPublicUserId();

                reportExtensionStart();

                //callIn(anonyReportExtensionsForMalwareAnalysis, getRandomWithinRange(30,60) * 1000);
                stndz.settings.enabled == false && callIn(showReactivateNotification, 10 * 1000);
            } catch(e) {
                serverLogger.log(stndz.logEventTypes.clientError, {
                    source: 'startApp',
                    message: encodeURIComponent((e.message || '').replace('\n', '')),
                    stack: encodeURIComponent((e.stack || '').replace('\n', ''))
                }).flush();
                updateUserAttributes({ startFail: true });
            }
        });
    });
}

function createPageDatasAndContextMenus() {
    runOnAllTabs(function(tab) {
        if (!pageDatas[tab.id]) {
            var host = getUrlHost(tab.url);
            createPageData(tab.id, tab.url, host);
        }
    }, function() {
        if (runOnPageDataLoaded) {
            runOnPageDataLoaded();
        }
        hasContextMenuPermissions(function(exists) {
            if (exists) {
                // browser action context menus
                createContextMenu({
                    id: "report-url",
                    title: chrome.i18n.getMessage('report_issue_on_this_page'),
                    contexts: ["browser_action"],
                    onclick: function(info, tab) {
                        openIssueFormOnCurrentTab(tab, "App Icon");
                    }
                });

                createContextMenu({
                    id: "block-elements",
                    title: chrome.i18n.getMessage('block_elements_on_this_page'),
                    contexts: ["browser_action"],
                    onclick: function(info, tab) {
                        blockElementsOnPage(tab.id, "App Icon");
                    }
                });

                createContextMenu({
                    id: "unblock-elements",
                    title: chrome.i18n.getMessage('undo_my_blocked_on_this_page'),
                    contexts: ["browser_action"],
                    onclick: function(info, tab) {
                        unblockElementsOnPage(tab.id, "App Icon");
                    }
                });

                createContextMenu({
                    id: "site-disable",
                    title: chrome.i18n.getMessage('whitelist_this_site'),
                    contexts: ["browser_action"],
                    onclick: function(info, tab) {
                        toggleStandsOnCurrentSiteClicked(tab.id);
                    }
                });

                createContextMenu({
                    id: "disable",
                    title: (
                        stndz.settings.enabled ? 
                        chrome.i18n.getMessage('turn_off_blocking_everywhere') : 
                        chrome.i18n.getMessage('turn_on_blocking')
                    ),
                    contexts: ["browser_action"],
                    onclick: function() {
                        toggleStandsStateClicked("ContextMenu");
                    }
                });

                createContextMenu({
                    id: "uninstall",
                    title: chrome.i18n.getMessage('uninstall'),
                    contexts: ["browser_action"],
                    onclick: uninstallExtension
                });


                // page context menus
                createContextMenu({
                    id: "stands-page",
                    title: chrome.i18n.getMessage('fair_by_stands'),
                    contexts: ["page", "selection", "frame", "link", "image", "video", "audio"]
                });

                createContextMenu({
                    id: "block-elements-page",
                    title: chrome.i18n.getMessage('block_elements_on_this_page'),
                    contexts: ["page", "selection", "frame", "link", "image", "video", "audio"],
                    parentId: "stands-page",
                    onclick: function(info, tab) {
                        blockElementsOnPage(tab.id, "Page");
                    }
                });

                createContextMenu({
                    id: "unblock-elements-page",
                    title: chrome.i18n.getMessage('unblock_elements_on_this_page'),
                    contexts: ["page", "selection", "frame", "link", "image", "video", "audio"],
                    documentUrlPatterns: customCssRules.getUrlPatterns(),
                    parentId: "stands-page",
                    onclick: function(info, tab) {
                        unblockElementsOnPage(tab.id, "Page");
                    }
                });

                createContextMenu({
                    id: "report-url-page",
                    title: chrome.i18n.getMessage('report_issue_on_this_page'),
                    parentId: "stands-page",
                    contexts: ["page", "selection", "frame", "link", "image", "video", "audio"],
                    onclick: function(info, tab) {
                        openIssueFormOnCurrentTab(tab, "Page");
                    }
                });

                createContextMenu({
                    id: "separator-page",
                    parentId: "stands-page",
                    type: "separator",
                    contexts: ["page", "selection", "frame", "link", "image", "video", "audio"]
                });

                createContextMenu({
                    id: "site-disable-page",
                    title: chrome.i18n.getMessage('whitelist_this_site'),
                    contexts: ["page", "selection", "frame", "link", "image", "video", "audio"],
                    parentId: "stands-page",
                    onclick: function(info, tab) {
                        toggleStandsOnCurrentSiteClicked(tab.id);
                    }
                });

                createContextMenu({
                    id: "disable-page",
                    title: (
                        stndz.settings.enabled ? 
                        chrome.i18n.getMessage('turn_off_blocking_everywhere') : 
                        chrome.i18n.getMessage('turn_on_blocking')
                    ),
                    contexts: ["page", "selection", "frame", "link", "image", "video", "audio"],
                    parentId: "stands-page",
                    onclick: function() {
                        toggleStandsStateClicked("Page");
                    }
                });
            }

            runOnActiveTab(function(tab) {
                // needs to run after context menus were created
                tab && setActiveTab(tab.id);
            });
        });
    });
}

function startJobs() {
    // reset icon if it is set for daily time frame
    var lastIconUpdateDate = getUtcDateString(utcTimeGetter());
    jobRunner.run('reset-icon-badge', function() {
        var today = getUtcDateString(utcTimeGetter());
        if (today == lastIconUpdateDate)
            return;

        lastIconUpdateDate = today;
        updateIcon(activeTabId);
    }, 5 * 60, false);

    jobRunner.run('check-ad-blocker', checkHasAdBlocker, 60 * 60, true);
    jobRunner.run('refresh-user-data-if-expired', refreshUserDataIfExpired, 60 * 60, true);
    jobRunner.run('cleanup-tabs', cleanupTabs, 30 * 60, false);
    jobRunner.run('report-suspected-domains', reportSuspectedDomains, 5 * 60, false);
    jobRunner.run('clear-console', console.clear, 2 * 24 * 60 * 60, false);
    jobRunner.run('fair-ads-check', checkFairAds, 2 * 60, true);
    jobRunner.run('show-notifications', showNotificationsInterval, 60, false);
    jobRunner.run('test-web-requests', testWebRequestsIntercepted, 2 * 60 * 60, true);
    jobRunner.run('check-donate-notifications', checkDonateNotifications, 30 * 60, true);

}

function updateBrowserProperties() {
    if (!stndz.settings.geo) {
        callUrl({ url: stndz.resources.geo, headers: [{ name: 'Content-Type', value: 'text/plain' }] }, function(geoData) {
            sendMessageToBackground({
                type: stndz.messages.updateUserSettings,
                attributes: {
                    geo: geoData.countryCode3
                },
                settings: {
                    geo: geoData.countryCode3
                }
            });
        }, null, function() {
            window.testGroup = (stndz.settings.geo == 'USA' || stndz.settings.geo == 'CAN');
        });
    }
}

function loadSyncPublicUserId() {
    $st.onUserReady(function(userData) {
        getSyncStorageValue('publicUserId', function(exists, publicUserId, errorMessage) {
            if (exists) {
                updateUserAttributes({ syncPublicUserId: publicUserId });
            } else {
                if (errorMessage) {
                    updateUserAttributes({ syncError: errorMessage });
                } else {
                    updateUserAttributes({ syncPublicUserId: userData.publicUserId });
                    setSyncStorageValue({ publicUserId: userData.publicUserId });
                }
            }
        });
    });
}

// for some reason Chrome sometimes doesn't load all files of the extension and it doesn't work, as reported by users
// this will check that the extension works - if not it will restart it
if (!window.heartbeatInterval) {
    window.heartbeatInterval = setTimeout(function() {
        if ($st && $stats && blockingRules && setupUser && !window.forceReload)
            return;

        function sendReloadEvent(data) {
            try {
                function toUTCString(time) {
                    return time.getUTCFullYear() + '-' + (time.getUTCMonth() + 1) + '-' + time.getUTCDate() + ' ' + time.getUTCHours() + ':' + time.getUTCMinutes() + ':' + time.getUTCSeconds();
                }

                var obj = {
                    eventTime: toUTCString(new Date()),
                    browserId: 1,
                    browserVersion: 'NA',
                    appId: 1,
                    appVersion: '0',
                    os: 'NA',
                    eventTypeId: 17,
                    logBatchGuid: 'NA',
                    geo: 'NA',
                    data: data
                };

                (new Image()).src = 'https://new-prod.standsapp.org/log3.gif?data=[' + encodeURIComponent(JSON.stringify(obj)) + ']';
            } catch (e) {}
        }

        chrome.storage.local.get('userData', function(items) {
            if (chrome.runtime.lastError) {
                sendReloadEvent({errUser: chrome.runtime.lastError});
            } else {
                sendReloadEvent({publicUserId: items.userData.publicUserId});
            }

            setTimeout(chrome.runtime.reload, 2000);
        });
    }, 60 * 1000);
}

/*
(function() {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-53650918-2', 'auto');
    ga('set', 'checkProtocolTask', function(){});

    ga('create', 'UA-53650918-3', 'auto', 'base2');
    ga('base2.set', 'checkProtocolTask', function(){});

    ga('create', 'UA-53650918-4', 'auto', 'base3');
    ga('base3.set', 'checkProtocolTask', function(){});

    window.reportBaseOne = function() {
        ga('send', 'pageview', '/user');
    };

    window.reportBaseTwo = function() {
        ga('base2.send', 'pageview', '/user');
    };

    window.reportBaseThree = function() {
        ga('base3.send', 'pageview', '/user');
    };

    createDailyReporting(reportBaseOne);
})();
*/
