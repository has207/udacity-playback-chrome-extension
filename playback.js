if (('' + document.location).indexOf('udacity') !== -1) {

// connect to the channel
    let port = chrome.runtime.connect({name: "youtube" + Math.random()});

// handle speed update messages
    const updateSpeed = function(msg) {
        if (!msg.data) return;
        const videos = document.getElementsByTagName('video');
        if (videos.length) {
            videos[0].playbackRate = parseInt(msg.data) / 100;
        }
    };
    port.onMessage.addListener(updateSpeed);

    const sendPing = function(video) {
        let currentSpeed = video.playbackRate;
        // assume 100% if we didn't get anything
        currentSpeed = currentSpeed ? parseFloat(currentSpeed) * 100 : 100;
        try {
            port.postMessage({data: currentSpeed});
        } catch (e) {
            port = chrome.runtime.connect({name: "youtube" + Math.random()});
            port.postMessage({data: currentSpeed});
        }
    };

// Send initial speed ping request along with current speed
// after the video tag has been loaded
    let id_ = setInterval(function() {
        const videos = document.getElementsByTagName('video');
        if (videos.length) {
            clearInterval(id_);
            delete id_;
            const video = videos[0];
            video.parentNode.addEventListener('DOMSubtreeModified', function() {
                sendPing(video);
            }, false);
            sendPing(video);
        }
    }, 1000);
}