/*
 * Background page script.
 * Shuffle messages between udacity and youtube content scripts
 * and intercepts YouTube embed request headers to force HTML5 playback
 */
const udacity_ports = [];
const youtube_ports = [];

// Update the YouTube PREF cookie to request HTML5 version of the embed
// I've tried passing in html5=1 URL param but if the PREF cookie is
// set it seems to take precedence so that wasn't enough.
// This approach seems to more reliable..
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details){
    let header;
    for (let i = 0; i < details.requestHeaders.length; i++) {
      header = details.requestHeaders[i];
      if (header.name === 'Cookie' && header.value.match(/PREF=/)) {
        const pref = 'PREF=';
        const prefRE = new RegExp(pref + '[^;]*');
        const vals = header.value.match(prefRE)[0].slice(pref.length).match(/[^&]+/g);
        if (vals && vals.length) {
          const nvals = [];
          for (i = 0; i < vals.length; i++) {
            if (i && vals[i-1].match(/^f1=/)) {
              nvals.push('f2=40000000')
            }
            if (!vals[i].match(/^f3=/)) {
              nvals.push(vals[i])
            }
          }
          header.value = pref + nvals.join('&');
        }
        return {requestHeaders: details.requestHeaders};
      }
    }
  },
  {urls: ["*://www.youtube.com/embed/*"]},
  ["blocking", "requestHeaders"]
);

const handleConnection = function(port, from, to) {
  const idx = from.length;
  from[idx] = port;
  port.onMessage.addListener(function(msg) {
    if (to.length > idx) {
      to[idx].postMessage(msg);
    }
  });
  port.onDisconnect.addListener(function() {
    from.splice(idx, 1);
  });
};

chrome.runtime.onConnect.addListener(function(port) {
  try {
    if (port.name.match(/^udacity/) && !udacity_ports.indexOf(port) >= 0) {
      handleConnection(port, udacity_ports, youtube_ports);
    } else if (port.name.match(/^youtube/) && !youtube_ports.indexOf(port) >= 0) {
      handleConnection(port, youtube_ports, udacity_ports);
    }
  } catch (e) {
    alert('Udacity Speed Extension background page error: ' + e);
  }
});
