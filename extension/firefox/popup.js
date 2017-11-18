/*! 
 *  \brief     URL Forwarder
 *  \details   This extension allows redirection, forwarding and native handling of links.
 *  \author    Thomas Irgang
 *  \version   1.1
 *  \date      2017
 *  \copyright MIT License
 Copyright 2017 Thomas Irgang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


var api = browser;

/*! All enabled rules. */
var rules = [];
/*! All links contained in the website. */
var all_links = [];
/*! All links displayed as download options. */
var visible_links = [];

/*! Update popup to show all affected links. */
function showLinks() {
    var links_table = document.getElementById('links');

    // remove old links
    while (links_table.children.length > 1) {
        links_table.removeChild(links_table.children[links_table.children.length - 1])
    }

    // add links
    for (var i = 0; i < visible_links.length; ++i) {
        var row = document.createElement('tr');
        var col_url = document.createElement('td');

        col_url.innerText = visible_links[i];
        col_url.style.whiteSpace = 'wrap';

        row.appendChild(col_url);
        links_table.appendChild(row);
    }
}

/*! Search for matching rules. */
function findRule(url) {
    var matching_rules = rules.filter(function (rule) {
        return url.match(rule.pattern);
    });

    return (matching_rules.length > 0);
}

/*! Filter all links. Only show links affected by a rule. */
function filterLinks() {
    visible_links = all_links.filter(function (link) {
        return findRule(link);
    });
    // update popup
    showLinks();
}

/*! Load available rules from persistence. */
function loadRules() {
    console.log("Load rules");
    api.storage.local.get("rules", (data) => {
        var loaded = api.runtime.lastError ? [] : data["rules"];
        if (!loaded) {
            loaded = [];
        }
        rules = loaded.filter(function (rule) {
            return rule.enabled;
        });
        console.log("Loaded rules: " + JSON.stringify(rules));
        filterLinks();
    });
}

function closePopup() {
    window.close();
}

function release() {
    api.runtime.sendMessage({
        "kind": "release"
    });
}

/*! Register message listener for rule update message. */
api.runtime.onMessage.addListener(function (msg) {
    if (msg) {
        if (msg.kind == "rules_updated") {
            var rec = msg.rules;
            rules = rec.filter(function (rule) {
                return rule.enabled;
            });
            console.log("Received rules: " + JSON.stringify(rules));
            filterLinks();
        }
    }
});

/*! Callback for link extraction script. */
api.runtime.onMessage.addListener(function (msg) {
    console.log("Message received.");
    if (msg) {
        if (msg.kind == "links") {
            var links = msg.data;
            for (var index in links) {
                all_links.push(links[index]);
            }
            all_links.sort();
            filterLinks();
        }
    }
});

/*! Init popup. */
window.onload = function () {
    document.getElementById("x").onclick = closePopup;
    document.getElementById("release").onclick = release;

    loadRules();

    setTimeout(function () {
        console.log("Query links.");
        // inject link extraction script in all frames of current tab
        api.windows.getCurrent(function (currentWindow) {
            api.tabs.query({
                    active: true,
                    windowId: currentWindow.id
                },
                function (activeTabs) {
                    api.tabs.executeScript(
                        activeTabs[0].id, {
                            file: 'send_links.js',
                            allFrames: true
                        });
                });
        });
    }, 150);
};
