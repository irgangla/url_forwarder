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

var api = chrome;

/*! List of found links. */
var links = [].slice.apply(document.getElementsByTagName('a'));

// Get links
links = links.map(function (element) {
    var href = element.href;
    if (href) {
        var hashIndex = href.indexOf('#');
        if (hashIndex >= 0) {
            href = href.substr(0, hashIndex);
        }
        return href;
    }
    //remove invalid urls in next step
    return "javascript";
});

links.sort();

// Remove duplicates and invalid URLs.
var kBadPrefix = 'javascript';
for (var i = 0; i < links.length;) {
    if (((i > 0) && (links[i] == links[i - 1])) || (links[i] == '') || (kBadPrefix == links[i].toLowerCase().substr(0, kBadPrefix.length))) {
        links.splice(i, 1);
    } else {
        ++i;
    }
}

if (links) {
    // Send links to the extension.
    api.runtime.sendMessage({
        kind: "links",
        data: links
    });
}
