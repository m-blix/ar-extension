'use strict';

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting === "hello") {
      sendResponse({farewell: "goodbye"});
    }
  });

const prefs = {
  'enabled': true,
  'overwrite-origin': true,
  'methods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'],
  'remove-x-frame': true,
  'allow-credentials': true,
  'allow-headers-value': '*',
  'expose-headers-value': '*',
  'allow-headers': true
};

const cors = {};
cors.onHeadersReceived = ({responseHeaders}) => {

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'request'});
  });

  if (prefs['overwrite-origin'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-origin');
    if (o) {
      o.value = '*';
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Origin',
        'value': '*'
      });
    }
  }
  if (prefs.methods.length > 3) { // GET, POST, HEAD are mandatory
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-methods');
    if (o) {
      o.value = prefs.methods.join(', ');
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Methods',
        'value': prefs.methods.join(', ')
      });
    }
  }
  if (prefs['allow-credentials'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-credentials');
    if (o) {
      o.value = 'true';
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Credentials',
        'value': 'true'
      });
    }
  }
  if (prefs['allow-headers'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-allow-headers');
    if (o) {
      o.value = prefs['allow-headers-value'];
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Allow-Headers',
        'value': prefs['allow-headers-value']
      });
    }
  }
  if (prefs['allow-headers'] === true) {
    const o = responseHeaders.find(({name}) => name.toLowerCase() === 'access-control-expose-headers');
    if (o) {
      o.value = prefs['expose-headers-value'];
    }
    else {
      responseHeaders.push({
        'name': 'Access-Control-Expose-Headers',
        'value': prefs['expose-headers-value']
      });
    }
  }
  if (prefs['remove-x-frame'] === true) {
    const i = responseHeaders.findIndex(({name}) => name.toLowerCase() === 'x-frame-options');
    if (i !== -1) {
      responseHeaders.splice(i, 1);
    }
  }
  return {responseHeaders};
};
cors.install = () => {
  cors.remove();
  const extra = ['blocking', 'responseHeaders'];
  if (/Firefox/.test(navigator.userAgent) === false) {
    extra.push('extraHeaders');
  }
  chrome.webRequest.onHeadersReceived.addListener(cors.onHeadersReceived, {
    urls: ['http://*/*','https://*/*']
  }, extra);
};
cors.remove = () => {
  chrome.webRequest.onHeadersReceived.removeListener(cors.onHeadersReceived);
};


if (prefs.enabled) {
  cors.install();
}
