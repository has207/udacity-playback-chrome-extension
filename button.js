var speeds = [300, 275, 250, 225, 200, 175, 150, 125, 100, 90, 80, 70];

// Connect to the channel
var youtube = chrome.runtime.connect({name: "udacity" + Math.random()});

// Retrieve current course from the URL
var currentCourse = function() {
  return window.location.hash.split("/")[1];
};

// localStorage getter wrapper
// Format: {course_id : {type1: speed, type2: speed}, ...}
// Leave some room to set different speeds for different
// lectures within the same course
// (some of the TA's talk *much* slower than the profs)
var getFromLocalStorage = function() {
  var LS = JSON.parse(localStorage.getItem('playbackRate')) || {};
  if (LS && LS[currentCourse()]) {
    return LS[currentCourse()]['main'];
  }
};

// localStorage setter wrapper
var updateLocalStorage = function(speed) {
  var LS = JSON.parse(localStorage.getItem('playbackRate')) || {};
  LS[currentCourse()] = {main: speed};
  localStorage.setItem('playbackRate', JSON.stringify(LS));
};

// Show/hide speed selection menu
var togglePopup = function(button) {
  var menu = document.getElementById('speed-update-dropdown');
  if (menu) {
    button.removeChild(menu);
  } else {
    button.appendChild(buildDropdown());
  }
};

// Send the update event to the playback content script,
// save to localStorage and update video speed display on the button.
// Things have a chance of getting out of sync here if the playback
// content script fails to set the speed, but it seems too cumbersome
// to set up the callback chain needed to verify it so we just
// plow ahead here.
var updateSpeed = function(speed) {
  try {
    youtube.postMessage({data: speed});
  } catch (e) {
    youtube = chrome.runtime.connect({name: "udacity" + Math.random()});
    youtube.postMessage({data: speed});
  }
  var button = document.getElementById('speed-update-button');
  if (button) {
    button.innerHTML = button.innerHTML.replace(/[0-9]*%/, '' + speed + '%');
  }
  updateLocalStorage(speed);
};

// Send video speed info to the playback content script
var speedPingCallback = function(msg) {
  setTimeout(function() {
    var speed = getFromLocalStorage();
    if (speed != msg.data) {
      youtube.postMessage({data: speed ? speed : 100});
    }
  }, 0);
};

// Set up the dropdown menu
var buildDropdown = function() {
  // Generate the menu. We want to float it above the button
  // while not being part of the button, hence all the round-aboutedness
  var dropdownList = document.createElement('ul');
  dropdownList.id = 'speed-update-dropdown';
  dropdownList.className = 'dropdown-menu dropdown-menu-scrollable';
  dropdownList.style.width = '130px';

  // Generate all the menu entries
  for (var i = 0; i < speeds.length; i++) {
    var entry = document.createElement('li');
    entry.addEventListener('click', function(e) {
      var speed = this.innerHTML.match(/[0-9]+/);
      if (speed) {
        updateSpeed(speed);
      }
    }, false);
    dropdownList.appendChild(entry);
    var text = document.createElement('div');
    text.innerHTML = "" + speeds[i] + '%';
    entry.appendChild(text);
  }
  return dropdownList;
};

// Generate the speed toggle dropdown, immitating the lesson dropdown
var buildButton = function(a){
  var speed = getFromLocalStorage();
  var button = document.createElement('button');
  button.className = 'btn btn-default dropdown-toggle';
  button.id = 'speed-update-button';
  button.addEventListener('click', function(e) {
    togglePopup(button);
    e.stopPropagation();
  }, false);
  a.insertBefore(button, a.firstChild);
  var title = document.createElement('div');
  title.className = 'dropdown-menu-toggle-title';
  title.innerHTML = "Speed: " + (speed ? speed : "100") + "%";
  var icon = document.createElement('span');
  icon.className = 'glyphicon glyphicon-th-list';
  icon.id = 'speed-dropdown-icon';
  button.appendChild(icon);
  button.appendChild(title);
};

// Set callback to send video speed to the playback content script
youtube.onMessage.addListener(speedPingCallback);

// wait until the autoplay button has loaded in order to get
// the right positioning info
var id_ = setInterval(function() {
  var buttons = document.getElementsByClassName('viewer-button-bar');
  if (buttons.length > 0) {
    // yay, the lesson switcher button is here, kill the interval
    clearInterval(id_);
    delete id_;
    buildButton(buttons[0]);
  }
}, 1000);
