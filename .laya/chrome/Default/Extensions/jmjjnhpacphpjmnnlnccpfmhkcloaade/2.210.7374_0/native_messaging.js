function startNativeMessaging(onReceiveNativeMessage) {
    chrome.runtime.sendNativeMessage('app.fs_chrome_https', {}, onReceiveNativeMessage);
};
