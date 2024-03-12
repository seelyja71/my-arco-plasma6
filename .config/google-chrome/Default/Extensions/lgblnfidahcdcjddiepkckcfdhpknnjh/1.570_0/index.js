chrome.runtime.sendMessage({
    // type: stndz.messages.browserActionOpened - stndz is not defined as no content scripts loaded on popup
    type: 'browser-action-opened'
});

chrome.runtime.onMessage.addListener((event) => {
    if (event.forStandsPopup) {
        messaging.onward(event)
    }
})

////////////////////////////// from common.js //////////////////////////////

function getRandom() {
    return Math.floor(Math.random() * 10000000000000);
}

////////////////////////////// from dashboard.js //////////////////////////////

var messaging = new function() {
    var registrations = {};

    this.onward = function(event) {
        // console.log('messaging popup', event)
        // if (!event.origin.match(/^http(s)?:\/\/(.*\.)?(localhost|standsapp.org|stndz.com)(:\d*)?/i))
        //     return;

        for (var type in registrations) {
            if (event.type == type) {
                var delegates = registrations[type];
                for (var i = 0; i < delegates.length; i++) {
                    try {
                        delegates[i](event);
                    } catch(e) {
                        console.error('Error in onward', e)
                    }
                }
            }
        }
    }

    this.register = function(type, callback) {
        if (!registrations[type]) {
            registrations[type] = new Array();
        }

        registrations[type].push(callback);
    };

    this.post = function(type, data) {
        // window.postMessage({ type: type, data: data }, '*');
        chrome.runtime.sendMessage({ type: type, data: data, fromStandsPopup: true });
        // chrome.tabs.query(
        //     {
        //         active: true,
        //         currentWindow: true,
        //     }, 
        //     (tabs) => chrome.tabs.sendMessage(tabs[0].id, { 
        //         type: type, 
        //         data: data, 
        //         fromStandsPopup: true 
        //     }) 
        // )
    };

    // well, I'm gonna rewrite all cases of messaging to direct ones
    this.postMessage = function(message) {
        message.fromStandsPopup = true;
        chrome.runtime.sendMessage(message); // like this
    }
};

function runEachSafely(arr, callback) {
    if (arr && arr.length) {
        for (var i = 0; i < arr.length; i++) {
            try {
                callback(arr[i]);
            } catch(e) {
                console.error('Error in runEachSafely', e)
            }
        }
    }
}

////////////////////////////// from services.js //////////////////////////////

var baseMessagingDataGetter = function(getTypeKey, responseTypeKey, responseDataKey, processRawDataDelegate) {
    var that = this;
    var internalData;
    var delegates = new Array();
    var registrations = new Array();
    var processRawData = processRawDataDelegate;

    function updateRegistrations() {
        runEachSafely(registrations, function(callback) {
            callback(internalData);
        });
    }

    messaging.register(responseTypeKey, function(message) {
        internalData = message[responseDataKey];
        if (processRawData) {
            internalData = processRawData(internalData);
        }

        runEachSafely(delegates, function(callback) {
            callback(internalData);
        });
        delegates = new Array();

        updateRegistrations();
    });

    this.register = function(callback) {
        registrations.push(callback);
        if (internalData) {
            try {
                callback(internalData);
            } catch(e) {
                console.error('Error in register', e)
            }
        }
    };

    this.get = function(callback) {
        if (internalData) {
            try {
                callback(internalData);
            } catch(e) {
                console.error('Error in get', e)
            }
        } else {
            delegates.push(callback);
        }
    };

    this.refresh = function() {
        messaging.post(getTypeKey);
    };

    that.refresh();
};

// userSettings
var userSettingsService = new function() {
    var that = this;
    var updateSettingsCallback = {};

    messaging.register('update-user-settings-response', function(message) {
        if (message.requestId && updateSettingsCallback[message.requestId]) {
            updateSettingsCallback[message.requestId](message.result.success);
            delete updateSettingsCallback[message.requestId];
        }
        that.refresh();
    });

    messaging.register('deactivated-sites-response', function(message) {
        that.refresh();
    });

    messaging.register('popup-sites-response', function(message) {
        that.refresh();
    });

    this.update = function(data, callback) {
        var requestId = getRandom();
        updateSettingsCallback[requestId] = callback;
        messaging.postMessage({
            type: 'update-user-settings',
            requestId: requestId,
            settings: data
        });
    };
};
userSettingsService.__proto__ = new baseMessagingDataGetter('get-user-settings', 'get-user-settings-response', 'settings');

// blockedElementsData
var blockedElementsDataService = new function() {
    var that = this;

    messaging.register('undo-blocked-elements-response', function(message) {
        that.refresh();
    });

    this.unblockElements = function() {
        messaging.post('undo-blocked-elements')
    };
};
blockedElementsDataService.__proto__ = new baseMessagingDataGetter('count-blocked-elements', 'count-blocked-elements-response', 'count');

// blockingData
var blockingDataService = new function() {
    var that = this;
}
blockingDataService.__proto__ = new baseMessagingDataGetter('get-blocking-data', 'get-blocking-data-response', 'data');

// appData
var appDataService = new function() {
    var that = this;
    var callbacks = {};

    this.setHostActivation = function(host, deactivate, refresh, callback) {
        var requestId = getRandom();
        callbacks[requestId] = function(success) {
            success && that.refresh();
            callback && callback(success);
        };

        messaging.postMessage({
            type: 'deactivated-sites-request',
            requestId: requestId,
            refresh: refresh == true,
            hosts: [{ hostAddress: host, deactivate: deactivate }]
        });
    };

    this.setHostPopupBlocking = function(host, block, refresh, callback) {
        var requestId = getRandom();
        callbacks[requestId] = function(success) {
            success && that.refresh();
            callback && callback(success);
        };

        messaging.postMessage({
            type: 'popup-sites-request',
            requestId: requestId,
            refresh: refresh,
            hosts: [{ hostAddress: host, add: block }]
        });
    };

    messaging.register('deactivated-sites-response', function(message) {
        if (message.requestId && callbacks[message.requestId]) {
            callbacks[message.requestId](message.success);
            delete callbacks[message.requestId];
        }
    });

    messaging.register('popup-sites-response', function(message) {
        if (message.requestId && callbacks[message.requestId]) {
            callbacks[message.requestId](message.success);
            delete callbacks[message.requestId];
        }
    });
};
appDataService.__proto__ = new baseMessagingDataGetter('get-app-data', 'get-app-data-response', 'stats');

// dashboardData
var dashboardDataService = new function() {
    var that = this;

    messaging.register('set-dashboard-data-response', function() {
        that.refresh();
    });

    this.update = function(data) {
        messaging.postMessage({
            type:'set-dashboard-data',
            data: data
        });
    };
};
dashboardDataService.__proto__ = new baseMessagingDataGetter('get-dashboard-data', 'get-dashboard-data-response', 'data');

// userData
var userDataService = new function() {
    var that = this;
    var updateUserCallbacks = {};

    messaging.register('update-user-response', function(message) {
        if (message.requestId && updateUserCallbacks[message.requestId]) {
            updateUserCallbacks[message.requestId](message.result.success);
            delete updateUserCallbacks[message.requestId];
        }
        that.refresh();
    });

    messaging.register('refresh-user-data-response', function(message) {
        that.refresh();
    });

    this.update = function(data, callback) {
        var requestId = getRandom();
        updateUserCallbacks[requestId] = callback;
        messaging.postMessage({
            type:'update-user-request',
            requestId: requestId,
            userData: data
        });
    };
};
userDataService.__proto__ = new baseMessagingDataGetter('get-user-data', 'get-user-data-response', 'userData', function(rawData) {
    rawData.createdOn = new Date(rawData.createdOn);
    rawData.lastUpdated = new Date(rawData.lastUpdated);
    return rawData;
});

// notificationsData
var notificationsDataService = new function() {
    var notifications;
    var loadingNotification = false;
    var delegates = new Array();

    function loadNotifications() {
        userDataService.get(function(userData) {
            $http.get(serviceDomain + '/user/notifications/' + userData.privateUserId)
                .success(function(data, status, headers, config) {
                    for (var i = 0; i < data.length; i++) {
                        data[i].time = new Date(data[i].time);
                    }

                    notifications = data;
                    runEachSafely(delegates, function(callback) {
                        callback && callback(notifications);
                    });

                    messaging.post('refresh-user-data');
                }).error(function(data, status, headers, config) {
                    sendEvent2('Errors', 'Error Loading Notifications', {Message: 'Failed Loading data from url ' + config.url + ' with status ' + status});
                }).finally(function() {
                    loadingNotification = false;
                });
        });
    }

    this.get = function(callback) {
        if (notifications) {
            callback && callback(notifications);
        } else {
            if (!loadingNotification) {
                loadNotifications();
            }

            delegates.push(callback);
        }
    }
};

// adBlockerData
var adBlockerDataService = new function() {
    var that = this;
    var callbacks = {};

    messaging.register('disable-ad-blockers-response', function(message) {
        if (message.requestId && callbacks[message.requestId]) {
            callbacks[message.requestId](message.disabled);
            delete callbacks[message.requestId];
        }
        that.refresh();
    });

    this.disable = function(callback) {
        var requestId = getRandom();
        callbacks[requestId] = callback;
        messaging.postMessage({
            type: 'disable-ad-blockers',
            requestId: requestId,
            source: pageParams.container == 'extension' ? 'extension' : 'website'
        });
    };
};
adBlockerDataService.__proto__ = new baseMessagingDataGetter('get-ad-blocker', 'get-ad-blocker-response', 'adBlockerData');

// sendEmail on feedback
function sendEmail(type, source, content) {
    const request = new XMLHttpRequest();
    
    let url = 'https://zapier.com/hooks/catch/b2t6v9/?type=' + encodeURIComponent(type);
    url += '&Source=' + encodeURIComponent(source);
    url += '&Content=' + encodeURIComponent(content);

    request.open("POST", url, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send('');
}
