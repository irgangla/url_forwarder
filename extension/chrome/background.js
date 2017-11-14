/*! 
 *  \brief     URL Forwarder
 *  \details   This extension allows forwarding URL to other local applications instead of opening.
 *  \author    Thomas Irgang
 *  \version   0.1
 *  \date      2017
 *  \copyright MIT License
 Copyright 2017 Thomas Irgang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var api = chrome;

var currentTabUrl = null;

function callForwarder(url) {
    api.runtime.sendNativeMessage(
        'eu.irgang.url_forwarder',
        {
            url: url
        },
        answerHandler
    );
}

function answerHandler(response) {
    console.log("Received from native: " + JSON.stringify(response));
}

function blockUrl(url) {
    if(url) {
        return url.indexOf("://jira.elektrobit.com/browse/") != -1;
    }
    return false;
}

function checkUrl(details) {
    if(details) {
        var url = details.url;
        if(url) {
            var block = blockUrl(url);
            if(block) {
                console.log("URL " + url + " is blocked!");
                callForwarder(url);
                if(currentTabUrl) {
                    console.log("redirect to " + currentTabUrl);
                    return {redirectUrl: currentTabUrl};
                } else {
                    console.log("block URL");
                    return {cancel: block};
                }
            }
        }
    }
    return {cancel: false};
}

api.webRequest.onBeforeRequest.addListener(
    checkUrl,
    {urls: ["<all_urls>"]},
    ["blocking"]
);

function activeTabChanged(activeInfo) {
    if(activeInfo) {
        var tabId = activeInfo.tabId;
        if(tabId) {
            getCurrentTabUrl();
        }
    }
}

function getCurrentTabUrl() {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    api.tabs.query(queryInfo, (tabs) => {
        if(tabs) {
            var tab = tabs[0];
            if(tab) {
                var url = tab.url;
                if(url) {
                    currentTabUrl = url;
                    console.log("Current tab: " + url);
                }                
            }
        }
    });
}

api.tabs.onActivated.addListener(activeTabChanged);
