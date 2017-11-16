/*! 
 *  \brief     URL Forwarder
 *  \details   This extension allows redirection, forwarding and native handling of links.
 *  \author    Thomas Irgang
 *  \version   1.0
 *  \date      2017
 *  \copyright MIT License
 Copyright 2017 Thomas Irgang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


var api = browser;

/*! All links contained in the website. */
var allLinks = [];
/*! All links displayed as download options. */
var visibleLinks = [];
/*! Number of running downloads. */
var downloads = 0;

/*!
Update popup to show all visible links.
*/
function showLinks() {
    var linksTable = document.getElementById('links');

    // remove old links
    while (linksTable.children.length > 1) 
    {
        linksTable.removeChild(linksTable.children[linksTable.children.length - 1])
    }
    
    // add links
    for (var i = 0; i < visibleLinks.length; ++i) {
        var row = document.createElement('tr');
        var col0 = document.createElement('td');
        var col1 = document.createElement('td');
        
        var checkbox = document.createElement('input');
        checkbox.checked = true;
        checkbox.type = 'checkbox';
        checkbox.id = 'check' + i;
        col0.appendChild(checkbox);
        
        col1.innerText = getFile(visibleLinks[i]);
        col1.style.whiteSpace = 'nowrap';
        col1.onclick = function() {
            checkbox.checked = !checkbox.checked;
        }
        
        row.appendChild(col0);
        row.appendChild(col1);
        linksTable.appendChild(row);
    }
}

/*! Enable all check boxes. */
function toggleAll() {
  var checked = document.getElementById('toggle_all').checked;
  for (var i = 0; i < visibleLinks.length; ++i) {
    document.getElementById('check' + i).checked = checked;
  }
}

/*! Get file name from URL. */
function getFile(url) {
    return decodeURI(url.substring(url.lastIndexOf('/')+1));
}

/*! Download all visible checked links. */
function downloadCheckedLinks() {
    var ticket = document.getElementById('ticket').value;
    var path = "attachments";
    if(ticket) {
        path = getSavePath(ticket);
    }
    for (var i = 0; i < visibleLinks.length; ++i) {
        if (document.getElementById('check' + i).checked) {
            var file = getFile(visibleLinks[i]);
            file = path + file;
            console.log("Download " + file);
            downloads = downloads + 1;
            api.downloads.download({
                    url: visibleLinks[i],
                    filename: file
                }, downloadFinished);
        }
    }
}

/*! Callback for finished downloads. */
function downloadFinished(id) {
    console.log("Download " + id + " started.");
    downloads = downloads - 1;
    if(downloads == 0) {
        console.log("All downloads started.");
        window.close();   
    }
}

/*! Filter all links. Only show JIRA ticket attachments and apply user search expression. */
function filterLinks() {
    // get expression to identify external attachment links
    var external = document.getElementById('external').value;
    // expression to identify JIRA attachment links
    var attachmentFilter = "/secure/attachment/";
    // merge external and internal attachment link expression
    if(external) {
        attachmentFilter = attachmentFilter + "|" + external;
    }
    // reduce links list to attachment links
    visibleLinks = allLinks.filter(function(link) {
        return link.match(attachmentFilter);
    });
    // apply negative filter, hide strange JIRA created links.
    var additionalFilter = "fileNameUrlEncoded";
    visibleLinks = visibleLinks.filter(function(link) {
        return !link.match(additionalFilter);
    });
    // apply user filter expression
    var filterValue = document.getElementById('filter').value;
    if (document.getElementById('regex').checked) {
        //apply regex
        visibleLinks = visibleLinks.filter(function(link) {
            return link.match(filterValue);
        });
    } else {
        //apply search terms split by ' '
        var terms = filterValue.split(' ');
        visibleLinks = visibleLinks.filter(function(link) {
            for (var termI = 0; termI < terms.length; ++termI) {
                var term = terms[termI];
                if (term.length != 0) {
                    var expected = (term[0] != '-');
                    if (!expected) {
                        term = term.substr(1);
                        if (term.length == 0) {
                            continue;
                        }
                    }
                    var found = (-1 !== link.indexOf(term));
                    if (found != expected) {
                        return false;
                    }
                }
            }
            return true;
        });
    }
    // update popup
    showLinks();
}

/*! Extract domain from URL. */
function getDomain(url) {
    if(url) {
        var url_parts = url.split("/");
        var domain = url_parts[2];
        return domain;
    }
    return "";
}

/*! Extract ticket ID from URL. */
function getTicket(url) {
    var url_parts = url.split("/");
    var last = url_parts[url_parts.length - 1];
    var last_parts = last.split("?");
    var ticket = last_parts[0];
    return ticket;
}

/*! Generate subfolder path from ticket ID. */
function getSavePath(ticket) {
    var ticket_parts = ticket.split("-");
    return ticket_parts[0] + "/" + ticket_parts[1] + "/";
}

/*! Get last used filter for external download links. */
function getExternalFilter(url, callback) {
    var domain = getDomain(url);
    api.storage.sync.get(domain, (items) => {
        callback(api.runtime.lastError ? null : items[domain]);
    });
}

/*! Save filter for external download links. */
function saveExternalFilter(url) {
    var domain = getDomain(url);
    var external = document.getElementById('external').value;
    var items = {};
    items[domain] = external;
    api.storage.sync.set(items);
}

/*! Get URL of current tab. */
function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    api.tabs.query(queryInfo, (tabs) => {
        if(tabs) {
            var tab = tabs[0];
            if(tab) {
                var url = tab.url;
                console.log("Tab: " + tab);
                console.log("URL: " + url);
                if(url) {
                    callback(url);    
                }                
            } else {
                console.warn("No tab found!");
                console.warn(tabs);
            }
        }
    });
}

/*! Update filter for external links. */
function updateExternal() {
    filterLinks();

    getCurrentTabUrl((url) => {
        if(url) {
            saveExternalFilter(url);   
        }
    });
}

/*! Update popup info with current tab URL. */
function updateTabUrl(url) {
    document.getElementById('domain').value = getDomain(url);
    document.getElementById('ticket').value = getTicket(url);

    getExternalFilter(url, (external) => {
        if(external) {
            document.getElementById('external').value = external;
        }
    });
}

/*! Callback for link extraction script. */
api.runtime.onMessage.addListener(function(msg) {
    if(msg) {
        if(msg.kind == "links") {
            var links = msg.data;
            for (var index in links) {
                allLinks.push(links[index]);
            }
            allLinks.sort();
            visibleLinks = allLinks;
            filterLinks();
            showLinks();
        }
    }
});

/*! Init popup. */
window.onload = function() {
    // register form callbacks
    document.getElementById('external').onkeyup = updateExternal;
    document.getElementById('filter').onkeyup = filterLinks;
    document.getElementById('regex').onchange = filterLinks;
    document.getElementById('toggle_all').onchange = toggleAll;
    document.getElementById('download0').onclick = downloadCheckedLinks;
    document.getElementById('download1').onclick = downloadCheckedLinks;
    
    setTimeout(function(){
        // get current tab URL
        getCurrentTabUrl((url) => {
            updateTabUrl(url);
        });
        // inject link extraction script in all frames of current tab
        api.windows.getCurrent(function (currentWindow) {
            api.tabs.query({
                    active: true, 
                    windowId: currentWindow.id
                },
                function(activeTabs) {
                    api.tabs.executeScript(
                        activeTabs[0].id, {file: 'send_links.js', allFrames: true});
                });
        });
    }, 150);
};
