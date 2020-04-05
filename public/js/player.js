// -------------------- variables --------------------
let i;
let player;
let iframeDiv;
let roomCode;
// -------------------- variables --------------------

// -------------------- parse URL parameters --------------------
function getUrlParameters() {
  const params = window.location.search.substring(1).split("&");
  for (i = 0; i < params.length; i++) {
    const param = params[i].split("=");
    if (param[0] == "joinRoom") {
      roomCode = param[1];
      break;
    }
  }
}
// -------------------- parse URL parameters --------------------

// -------------------- connect to websocket --------------------
const socket = io.connect("https://secure-dusk-40036.herokuapp.com/");
// const socket = io.connect("http://localhost:5000/");

// gets data from url and sends to socket.io server
getUrlParameters();
socket.on("connect", () => {
  socket.emit("join-room", roomCode);
});
// -------------------- connect to websocket --------------------

// -------------------- listen for socket events --------------------
socket.on("play-video", playVideo);
socket.on("pause-video", pauseVideo);

socket.on("update-user-count", (data) => {
  const difference = data - userPanel.childElementCount;

  // adds or removes profilepic.png elements
  if (difference > 0) {
    for (i = 0; i < difference; i++) {
      addUserToList();
    }
  } else if (difference < 0) {
    for (i = 0; i > difference; i--) {
      removeUserFromList();
    }
  }
});

socket.on("seek-to", (data) => {
  player.seekTo(data);
});

socket.on("load-new-video", (data) => {
  player.loadVideoById({ videoId: data });
});

socket.on("get-player-data", (id) => {
  const vId = player.getVideoUrl().split("=")[1];
  const playerState = player.getPlayerState();
  const time = player.getCurrentTime();

  socket.emit("receive-player-data", { vId, playerState, time, id });
});
// -------------------- listen for socket events --------------------

// -------------------- helper functions for socket events --------------------
// sends out player data
function sendOutPlayerData() {
  const vId = player.getVideoUrl().split("=")[1];
  const playerState = player.getPlayerState();
  const time = player.getCurrentTime();

  socket.emit("receive-player-data", { vId, time, playerState });
}
// adds user to user list
function addUserToList() {
  const img = document.createElement("img");
  img.src = "img/profilepic.png";

  userPanel.appendChild(img);
}

// removes user from user list
function removeUserFromList() {
  if (userPanel.lastElementChild) {
    userPanel.removeChild(userPanel.lastElementChild);
  }
}

// onPlayPauseButtonClick
function playPauseToggle() {
  if (player.getPlayerState() == 1) {
    socket.emit("pause-video", roomCode);
  } else {
    socket.emit("play-video", roomCode);
  }
}

// play video
function playVideo() {
  player.playVideo();
  playPauseButton.getElementsByTagName("i")[0].className = "fa fa-pause-circle";
}

// pause video
function pauseVideo() {
  player.pauseVideo();
  playPauseButton.getElementsByTagName("i")[0].className = "fa fa-play-circle";
}
// -------------------- helper functions for socket events --------------------

// -------------------- DOM elements --------------------
const roomCodeDisplay = document.getElementById("room-code");
const playerOverlay = document.getElementById("player-overlay-img");
const playPauseButton = document.getElementById("play-pause-button");
const skipBackward = document.getElementById("skip-backward");
const skipForward = document.getElementById("skip-forward");
const fullscreenButton = document.getElementById("fullscreen");
const videoScrubberBox = document.getElementById("video-progress-bar");
const videoInputBox = document.getElementById("video-link");
const submitButton = document.getElementById("submit-video-link");
const userPanel = document.getElementById("display-connected-users");
const volumeButton = document.getElementById("volume-button");
const volumeSlider = document.getElementById("volume-slider");
const volumeSliderBar = document
  .getElementById("volume-slider")
  .getElementsByTagName("div")[0];
// -------------------- DOM elements --------------------

// -------------------- emit on DOM event --------------------
playerOverlay.addEventListener("click", playPauseToggle);

playPauseButton.addEventListener("click", playPauseToggle);

skipBackward.addEventListener("click", () => {
  const time = player.getCurrentTime() - 5;
  socket.emit("seek-to", { roomCode, time });
});

skipForward.addEventListener("click", () => {
  const time = player.getCurrentTime() + 5;
  socket.emit("seek-to", { roomCode, time });
});

videoInputBox.addEventListener("keydown", (key) => {
  if (key.keyCode == 13) {
    const vId = parseVideoLink(videoInputBox.value);
    socket.emit("load-new-video", { roomCode, vId });
  }
});

submitButton.addEventListener("click", () => {
  const vId = parseVideoLink(videoInputBox.value);
  socket.emit("load-new-video", { roomCode, vId });
});

videoScrubberBox.addEventListener("click", () => {
  const rect = videoScrubberBox.getBoundingClientRect();
  const x = event.clientX;
  const fraction = (x - rect.left) / (rect.right - rect.left);
  const time = fraction * player.getDuration();

  socket.emit("seek-to", { roomCode, time });
});
// -------------------- emit on DOM event --------------------

// -------------------- youtube player api code --------------------
// 2. This code loads the IFrame Player API code asynchronously.
const tag = document.createElement("script");

tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
  // updates room code on side panel
  roomCodeDisplay.innerHTML = roomCode;

  socket.emit("get-player-data", roomCode);
  socket.on("receive-player-data", (data) => {
    player = new YT.Player("player", {
      width: "100%",
      height: "100%",
      videoId: data.vId,
      events: {
        onReady: () => {
          player.seekTo(data.time);
          if (data.playerState == 1) {
            player.playVideo();
          }

          iframeDiv = document.getElementById("outer-player-div");
        },
        // onStateChange: onPlayerStateChange
      },
      playerVars: {
        controls: 0,
        modestbranding: 1,
        autoplay: 0,
        disablekb: 1,
        rel: 0,
      },
    });
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.

// let done = false;
// function onPlayerStateChange(event) {
//   if (event.data == YT.PlayerState.PLAYING && !done) {
//     setTimeout(stopVideo, 6000);
//     done = true;
//   }
// }
// -------------------- youtube player api code --------------------

// -------------------- helper functions --------------------
// parses link into videoId
function parseVideoLink(link) {
  return link.split("=")[1].split("&")[0];
}

// parses float into scrubber css string
function updateScrubberLength(fraction) {
  const s = "width: " + (100 * fraction).toString() + "%";
  document
    .getElementById("video-watched-progress-bar")
    .setAttribute("style", s);
}

function updateVolumeBarLength(fraction) {
  const s = "height: " + (100 * fraction).toString() + "%";
  volumeSliderBar.setAttribute("style", s);
}

function showVolumeSlider() {
  volumeSlider.setAttribute("class", "progress progress-bar-vertical");

  volumeSliderBar.setAttribute("class", "progress-bar");
  volumeSliderBar.setAttribute("role", "progressbar");
  volumeSliderBar.setAttribute("aria-valuemin", "0");
  volumeSliderBar.setAttribute("aria-valuemax", "100");

  const v = player.getVolume();
  volumeSliderBar.setAttribute("style", "height: " + v.toString() + "%;");
}

function hideVolumeSlider() {
  volumeSliderBar.removeAttribute("class");
  volumeSliderBar.removeAttribute("role");
  volumeSliderBar.removeAttribute("aria-valuemin");
  volumeSliderBar.removeAttribute("aria-valuemax");
  volumeSliderBar.removeAttribute("style");

  volumeSlider.removeAttribute("class");
}

function toggleVolumeSlider() {
  if (volumeSlider.getElementsByTagName("div")[0].className == "") {
    showVolumeSlider();
  } else {
    hideVolumeSlider();
  }
}

// changes volume based on cursor position
function changeVolume() {
  const rect = volumeSlider.getBoundingClientRect();
  const y = event.clientY;
  let fraction = (y - rect.bottom) / (rect.top - rect.bottom);

  // adjusts for user discrepancy
  if (fraction > 0.9) {
    fraction = 1;
  } else if (fraction < 0.1) {
    fraction = 0;
  }

  updateVolumeBarLength(fraction);
  player.setVolume(fraction * 100);
}

function toggleFullscreen() {
  const requestFullscreen =
    iframeDiv.requestFullscreen ||
    iframeDiv.mozRequestFullScreen ||
    iframeDiv.webkitRequestFullscreen ||
    iframeDiv.msRequestFullscreen;
  if (requestFullscreen) {
    requestFullscreen.bind(iframeDiv)();
  }
}
// -------------------- helper functions --------------------

// -------------------- event listener functions --------------------
volumeButton.addEventListener("click", toggleVolumeSlider);

volumeSlider.addEventListener("click", changeVolume);

fullscreenButton.addEventListener("click", toggleFullscreen);
// -------------------- event listener functions --------------------

// -------------------- other functions --------------------
// loop to get scrubber
function getScrubberLength() {
  const videoLength = player.getDuration();
  if (player.getPlayerState() > 0 && videoLength > 0) {
    const fraction = player.getCurrentTime() / videoLength;
    updateScrubberLength(fraction);
  }
}
window.setInterval(getScrubberLength, 100);
// -------------------- other functions --------------------
