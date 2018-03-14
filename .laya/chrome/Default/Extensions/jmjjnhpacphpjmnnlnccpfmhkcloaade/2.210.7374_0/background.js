const FS_SECONDARY_LIST = /https?:\/\/[\w.:@]*\.google\.[a-z\.]{2,6}\/(?:search|images|custom|cse|s)(?:;\S*)?\?\S*/;
const FS_COOLDOWN_MIN = 5000, FS_COOLDOWN_MAX = 80000;
var FS_SERVICE_URL = "";
var SAFE_SEARCH_ENABLED = false;
// YouTube-Restrict support https://support.google.com/a/answer/6214622
const YOUTUBE_RESTRICT= /https?:\/\/((www|m).youtube|youtubei?.googleapis|www.youtube-nocookie).com/
var REQ_FILTER = ["https://*/*"];

var tabMap = {};
var uninitiazedTabs = []; // List of tabs opened at browser startup, but not activated + reloaded yet
var deferredTabs = [];
var injectMap = {};
var cooldown = false;
var cooldownInterval = FS_COOLDOWN_MIN;
var legacyMode = false; // Legacy products (SAFE 16.x, CS11.x/12.x) support only a subset of ScanRequestTypes

var ScanRequestType = {
    Invalid: -1,
    Undefined: 0,
    Primary: 1, // Legacy products support this
    Secondary: 2, // Legacy products support this
    PrimaryNoBanking: 3,
    Banking: 4,
    CustomMessage: 5
};

//from native_messaging.js
startNativeMessaging(onReceiveNativeMessage);

const log = {
    debug: (msg) => {
        console.log('[' + new Date().toISOString() + "] " + msg);
    },
    info: (msg) => {
        console.info('[' + new Date().toISOString() + "] " + msg);
    },
    warn: (msg) => {
        console.warn('[' + new Date().toISOString() + "] " + msg);
    },
    error: (msg) => {
        console.error('[' + new Date().toISOString() + "] " + msg);
    },
    exception: (ex) => {
        log.error("An exception occurred: " + ex);
    }
};

function init() {
    try {
        log.info("Initializing F-Secure Browsing Protection...");

        chrome.webRequest.onBeforeRequest.addListener(
            webRequestOnBeforeRequest, { urls: REQ_FILTER }, ["blocking"]);

        chrome.webRequest.onBeforeSendHeaders.addListener(
            webRequestOnBeforeSendHeaders, { urls: REQ_FILTER }, ["requestHeaders", "blocking"]);

        chrome.tabs.onActivated.addListener(tabsOnActivated);
        chrome.tabs.onUpdated.addListener(tabsOnUpdated);
        chrome.tabs.onCreated.addListener(tabsOnCreated);
        chrome.tabs.onRemoved.addListener(tabsOnRemoved);
        chrome.tabs.onReplaced.addListener(tabsOnReplaced);

        chrome.runtime.onMessage.addListener(runtimeOnMessage);

        handleCustomNativeChannel(false); //for init this method needs to block
        initTabs();

        log.info("F-Secure Browsing Protection Initialized!");
    } catch (e) {
        log.error("F-Secure Browsing Protection failed to initialize: " + e);
    }
}

function handleCustomNativeChannel(async) {
    const nativeChannel = "native_channel";
    const nativeChannelUrl = "http://" + nativeChannel;
    var scanQuery = {
        url: nativeChannelUrl,
        referer: nativeChannelUrl,
        rqtype: ScanRequestType.CustomMessage
    };

    var handleResult = function(xhr) {
        var scanResult = handleHttpsscanResponse(xhr);
        if (scanResult) {
            log.info(nativeChannel + " response: " + JSON.stringify(scanResult));

            if (nativeChannel in scanResult) {
                SAFE_SEARCH_ENABLED = scanResult.native_channel.safesearch_enabled;
                legacyMode = false;
            } else {
                // Legacy products don't understand nativeChannel query and return empty result.
                legacyMode = true;
            }
        }
    }

    var xhr = sendHttpsscanQuery(scanQuery, async, handleResult);

    if (async === false) {
        handleResult(xhr);
    }

    setTimeout(handleCustomNativeChannel, 30000, true); //30 second async polling
}

function initTabs() {
    chrome.tabs.query({}, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            tabMap[tabs[i].id] = {};

            REQ_FILTER.forEach(function (pattern) {
                if (tabs[i].url && tabs[i].url.search(pattern) === 0) {
                    if (tabs[i].active) {
                        chrome.tabs.reload(tabs[i].id);
                    } else {
                        uninitiazedTabs.push(tabs[i]);
                    }
                }
            });
        }
    });
}

function sendHttpsscanQuery(scanQuery, async, asyncFunc) {
    asyncFunc = asyncFunc || null;

    if (cooldown) {
        return null;
    }

    try {
        var srvurl = FS_SERVICE_URL + "/httpsscan";
        var xhr = new XMLHttpRequest();

        xhr.open("POST", srvurl, async);
        xhr.setRequestHeader("Content-Type", "text/plain");

        var content = JSON.stringify(scanQuery);

        log.debug("Sending " + content + " to: " + srvurl);

        if (async === true && asyncFunc !== null) {
            xhr.onreadystatechange = function() {
                asyncFunc(xhr);
            }
        }

        xhr.send(content);

        return xhr;
    } catch (e) {
        log.exception(e);

        log.debug("Cooldown for " + cooldownInterval + "ms");

        cooldown = true;

        setTimeout(function () {
            cooldown = false;
            log.debug("Cooldown over");
        }, cooldownInterval);

        if (cooldownInterval < FS_COOLDOWN_MAX) {
            cooldownInterval *= 2;
        }
    }

    return null;
}

function handleHttpsscanResponse(xhr) {
    if (!xhr) {
        return null;
    }

    try {
        var xhrDone = xhr.readyState === 4;

        if (!xhrDone || xhr.status !== 200 || !xhr.responseText || !xhr.responseText.length) {
            log.debug("Request status: " + (xhrDone ? xhr.status : xhr.readyState));
            return null;
        }

        var scanResult = JSON.parse(xhr.responseText);
        log.debug("Response: " + xhr.responseText);

        cooldownInterval = FS_COOLDOWN_MIN;

        return scanResult;
    } catch (e) {
        log.exception(e);
    }

    return null;
}

function webRequestOnBeforeRequest(details) {
    try {
        log.debug("Details: " + JSON.stringify(details));

        if (details.type === "main_frame") {
            return;
        }

        if (!FS_SECONDARY_LIST.test(details.url)) {
            return;
        }

        var scanQuery = {
            url: details.url,
            referer: "",
            rqtype: ScanRequestType.Secondary
        };

        var xhr = sendHttpsscanQuery(scanQuery, false);

        var scanResult = handleHttpsscanResponse(xhr);
        if (!scanResult) {
            return;
        }

        if ("redirect" in scanResult) {
            log.debug("Redirect to: " + scanResult.redirect);
            return { redirectUrl: scanResult.redirect };
        }

        if ("block" in scanResult) {
            log.debug("Blocked: " + details.url);
            return { cancel: true };
        }
    } catch (e) {
        log.error("An exception occurred: " + e);
    }
}

function webRequestOnBeforeSendHeaders(details) {
    try {
        if (details.tabId === -1) {
            return;
        }

        log.debug("requestId: " + details.requestId);

        if (SAFE_SEARCH_ENABLED && YOUTUBE_RESTRICT.test(details.url)) {
            const strictMode = {name: "YouTube-Restrict", value: "Strict"};
            log.debug(JSON.stringify(strictMode) + " for " + details.url);
            details.requestHeaders.push(strictMode);
        }

        if (details.type !== "main_frame") {
            return { requestHeaders: details.requestHeaders };
        }

        var scanQuery = {
            url: details.url,
            referer: "",
            rqtype: legacyMode ? ScanRequestType.Primary : ScanRequestType.PrimaryNoBanking
        };

        var preRendering = !(details.tabId in tabMap);

        if (preRendering) {
            // Pre-rendering part 1: process as secondary
            if (FS_SECONDARY_LIST.test(details.url)) {
                log.debug("Tab " + details.tabId + " not found, scan as secondary request type");
                scanQuery.rqtype = ScanRequestType.Secondary;
            } else {
                log.debug("Tab " + details.tabId + " not found, storing request for later");
                deferredTabs.push(details);

                return { requestHeaders: details.requestHeaders };
            }
        }

        for (var i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name === "Referer") {
                scanQuery.referer = details.requestHeaders[i].value;
                break;
            }
        }

        var xhr = sendHttpsscanQuery(scanQuery, false);

        var scanResult = handleHttpsscanResponse(xhr);
        if (!scanResult) {
            log.warn("Empty scan result received!");
        }
        else {
            if ("redirect" in scanResult) {
                log.debug("Redirecting: " + details.tabId + ", to: " + scanResult.redirect);
                chrome.tabs.update(details.tabId, { url: scanResult.redirect });
            }

            if ("injectCss" in scanResult && "injectJs" in scanResult) {
                injectMap[details.tabId] = scanResult;
            }

            if ("block" in scanResult) {
                log.debug("Blocked: " + details.url);
                return { cancel: true };
            }
        }
    } catch (e) {
        log.exception(e);
    }

    return { requestHeaders: details.requestHeaders };
}

function tabsOnActivated(obj) {
    for (var i = 0; i < uninitiazedTabs.length; i++) {
        if (uninitiazedTabs[i].id === obj.tabId) {
            chrome.tabs.reload(obj.tabId);
            uninitiazedTabs.splice(i, 1);
        }
    }
}

function tabsOnUpdated(id, obj) {
    try {
        if (id in injectMap) {
            var scanResult = injectMap[id];
            delete injectMap[id];

            var js = getContent(scanResult.injectJs);
            var css = getContent(scanResult.injectCss);

            log.debug("inject: " + id);
            chrome.tabs.insertCSS(id, { code: css });
            chrome.tabs.executeScript(id, { code: js });
        }

        if (obj.url && obj.url.startsWith("https://")) {
            log.debug("tabsOnUpdated url: " + obj.url);
            var scanQuery = {
                url: obj.url,
                referer: "",
                rqtype: ScanRequestType.Banking
            };

            sendHttpsscanQuery(scanQuery, true);
        }
    } catch (e) {
        log.exception(e);
    }
}

function tabsOnCreated(obj) {
    log.debug("Added: " + obj.id);
    tabMap[obj.id] = {};
    for (var i = 0; i < deferredTabs.length; i++) {
        if (deferredTabs[i].tabId === obj.id) {
            log.debug("Found deferred tab: " + obj.id);
            webRequestOnBeforeSendHeaders(deferredTabs[i]);
            deferredTabs = deferredTabs.splice(i, 1);
            break;
        }
    }
}

function tabsOnRemoved(id, obj) {
    log.debug("Removed: " + id);
    delete tabMap[id];
}

function tabsOnReplaced(addedTabId, removedTabId) {
    log.debug("Replaced: " + removedTabId + " with: " + addedTabId);

    tabMap[addedTabId] = {};
    delete tabMap[removedTabId];

    // Pre-rendering part 2: re-transmit url as primary
    chrome.tabs.get(addedTabId, function tabsOnReplaced_get(tab) {
        if (!tab || !tab.url) {
            return;
        }

        var scanQuery = {
            url: tab.url,
            referer: "",
            rqtype: legacyMode ? ScanRequestType.Primary : ScanRequestType.PrimaryNoBanking
        };

        var xhr = sendHttpsscanQuery(scanQuery, true);

        xhr.onreadystatechange = function tabsOnReplaced_onreadystatechange() {
            try {
                if (xhr.readyState !== 4) {
                    return;
                }

                var scanResult = handleHttpsscanResponse(xhr);

                if (!scanResult) {
                    return;
                }

                if ("redirect" in scanResult) {
                    log.debug("redirect: " + scanResult.redirect);
                    chrome.tabs.update(addedTabId, { url: scanResult.redirect });
                    return;
                }

                if ("injectCss" in scanResult && "injectJs" in scanResult) {
                    injectMap[addedTabId] = scanResult;
                }
            } catch (e) {
                log.exception(e);
            }
        };
    });
}

function runtimeOnMessage(request, sender, sendResponse) {
    try {
        if (request && request.fsOlsData == FS_SERVICE_URL && request.fsOlsRequest) {
            console.log("Query for: " + request.fsOlsRequest);

            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", FS_SERVICE_URL + "/ajax?url_rating=" + request.fsOlsRequest, true);
            xmlhttp.send();

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState !== 4) {
                    return;
                }

                if (xmlhttp.status === 200) {
                    sendResponse(xmlhttp.responseText);
                } else {
                    sendResponse();
                }
            };
        } else {
            sendResponse();
        }
    } catch (e) {
        log.exception(e);
    }

    return true;
}

function getContent(url) {
    try {
        log.debug("Entering: " + url);

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();

        var xhrDone = xhr.readyState === 4;
        log.debug("Leaving: " + (xhrDone ? xhr.status : xhr.readyState));

        if (!xhrDone || xhr.status !== 200 || !xhr.responseText || !xhr.responseText.length) {
            return;
        }

        return xhr.responseText;
    } catch (e) {
        log.exception(e);
    }
}

function onReceiveNativeMessage(message) {
    if (!message || !message.guid || !message.port) {
        log.error("Native host reply is invalid!");
        return;
    }

    log.debug("Received: " + JSON.stringify(message));

    FS_SERVICE_URL = "http://localhost:" + message.port + "/" + message.guid;
    log.debug("FS_SERVICE_URL  : " + FS_SERVICE_URL);

    if (message.req_filter) {
        REQ_FILTER = message.req_filter;
        log.debug("REQ_FILTER  : " + REQ_FILTER);
    }

    init();
}
