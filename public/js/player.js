// -------------------- variables --------------------
let i;
let player;
let roomCode;
let videoQueue;
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

// gets roomcode from url and sends to socket.io server
getUrlParameters();
socket.on("connect", () => {
  socket.emit("join-room", roomCode);
});
// -------------------- connect to websocket --------------------

// -------------------- DOM elements --------------------
const roomCodeDisplay = document.getElementById("room-code");
const playerOverlay = document.getElementById("player-overlay-img");
const playPauseButton = document.getElementById("play-pause-button");
const skipForward = document.getElementById("skip-forward");
const fullscreenButton = document.getElementById("fullscreen");
const videoScrubberBox = document.getElementById("video-progress-bar");
const videoInputBox = document.getElementById("video-link");
const queueButton = document.getElementById("submit-video-link");
const videoTitle = document.getElementById("video-title");
const iframeDiv = document.getElementById("outer-player-div");
const userPanel = document.getElementById("display-connected-users");
const queuePanel = document.getElementById("display-queued-videos");
const volumeButton = document.getElementById("volume-button");
const volumeSlider = document.getElementById("volume-slider");
const volumeSliderBar = document
  .getElementById("volume-slider")
  .getElementsByTagName("div")[0];
// -------------------- DOM elements --------------------

// -------------------- websocket functions & code --------------------
// -------------------- listen for socket events --------------------
socket.on("play-video", playVideo);
socket.on("pause-video", pauseVideo);
socket.on("next-video", loadNextVideo);

socket.on("skip-video", (vId) => skipToVideoById(vId));
socket.on("update-user-count", (data) => updateUserCount(data));
socket.on("get-player-data", (id) => getPlayerData(id));

socket.on("seek-to", (data) => {
  player.seekTo(data);
});

socket.on("queue-new-video", (data) => {
  videoQueue.push(data);
  updateVideoQueueList();
});

// -------------------- listen for socket events --------------------

// -------------------- helper functions for socket events --------------------
function getPlayerData(id) {
  const vId = videoTitle.parentElement.href.split("=")[1];
  const playerState = player.getPlayerState();
  const time = player.getCurrentTime();

  socket.emit("receive-player-data", {
    vId,
    playerState,
    time,
    id,
    videoQueue,
  });
}

function updateUserCount(data) {
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
}

function updateVideoQueueList() {
  //removes old imgs
  while (queuePanel.lastElementChild) {
    queuePanel.removeChild(queuePanel.lastElementChild);
  }

  // adds new imgs
  for (i = 0; i < videoQueue.length; i++) {
    const img = document.createElement("img");
    img.src = `https://img.youtube.com/vi/${videoQueue[i]}/mqdefault.jpg`;
    img.setAttribute("onclick", `skipVideo("${videoQueue[i]}")`);
    queuePanel.appendChild(img);
  }
}

function sendOutPlayerData() {
  const vId = player.getVideoUrl().split("=")[1];
  const playerState = player.getPlayerState();
  const time = player.getCurrentTime();

  socket.emit("receive-player-data", { vId, time, playerState });
}

function addUserToList() {
  const img = document.createElement("img");
  img.src = "img/profilepic.png";
  userPanel.appendChild(img);
}

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

function playVideo() {
  player.playVideo();
  playPauseButton.getElementsByTagName("i")[0].className = "fa fa-pause-circle";
}

function pauseVideo() {
  player.pauseVideo();
  playPauseButton.getElementsByTagName("i")[0].className = "fa fa-play-circle";
}

function loadNextVideo() {
  const videoId = videoQueue.shift();
  player.loadVideoById({ videoId });
  updateVideoQueueList();
}

function skipToVideoById(vId) {
  while (videoQueue[0] != vId) {
    videoQueue.shift();
  }
  loadNextVideo();
}

function skipVideo(vId) {
  if (videoQueue.includes(vId)) {
    socket.emit("skip-video", { roomCode, vId });
  }
}

function parseVideoLinkIntoId(url) {
  if (url.includes("youtu.be") || url.includes("youtube.com/embed/")) {
    return url.split("/").slice(-1)[0].split("?")[0];
  } else if (url.includes("youtube.com")) {
    return url.split("=")[1].split("&")[0];
  } else {
    return false;
  }
}

function queueVideo() {
  const vId = parseVideoLinkIntoId(videoInputBox.value);

  if (vId.length > 10) {
    socket.emit("queue-new-video", { roomCode, vId });
    videoInputBox.className = "form-control";
    videoInputBox.value = "";
  } else {
    videoInputBox.className = "form-control is-invalid";
  }
}

function scrubberSeekVideo() {
  const rect = videoScrubberBox.getBoundingClientRect();
  const x = event.clientX;
  const fraction = (x - rect.left) / (rect.right - rect.left);
  let time;

  if (fraction < 0.01) {
    time = 0;
  } else {
    time = fraction * player.getDuration();
  }

  socket.emit("seek-to", { roomCode, time });
}
// -------------------- helper functions for socket events --------------------

// -------------------- listeners that trigger socket events --------------------
playerOverlay.addEventListener("click", playPauseToggle);
playPauseButton.addEventListener("click", playPauseToggle);
queueButton.addEventListener("click", queueVideo);
videoScrubberBox.addEventListener("click", scrubberSeekVideo);

document.addEventListener("keyup", (key) => {
  if (key.keyCode == 32) {
    playPauseToggle();
  }
});

skipForward.addEventListener("click", () => {
  if (videoQueue.length > 0) {
    socket.emit("next-video", roomCode);
  }
});

videoInputBox.addEventListener("keydown", (key) => {
  if (key.keyCode == 13) {
    queueVideo();
  }
});
// -------------------- listeners that trigger socket events --------------------
// -------------------- websocket functions & code --------------------

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

          player.mute();
          videoQueue = data.videoQueue;
          updateVideoQueueList();
          setSidebarHeight();
        },
        onStateChange: onPlayerStateChange,
        onError: logError,
      },
      playerVars: {
        iv_load_policy: 3,
        enablejsapi: 1,
        disablekb: 1,
        autoplay: 1,
        loop: 0,
        controls: 0,
        showinfo: 0,
        rel: 0,
        mode: "transparent",
      },
    });
  });
}

// 4. The API will call this function when the video player is ready.
// function onPlayerReady(event) {
//   event.target.playVideo();
// }

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.

function onPlayerStateChange(event) {
  // sets title on video change
  const { title, video_id } = event.target.getVideoData();

  if (title != "" && title != undefined) {
    videoTitle.innerHTML = title;
    videoTitle.parentElement.href = `https://www.youtube.com/watch?v=${video_id}`;
  }

  if (event.data == 0 && videoQueue.length > 0) {
    loadNextVideo();
  }
}

function logError(event) {
  console.log(event.data);
}
// -------------------- youtube player api code --------------------

// -------------------- client side functions --------------------
// -------------------- helper functions --------------------
// parses float into scrubber css string
function updateScrubberLength(fraction) {
  const s = `width: ${(100 * fraction).toString()}%`;
  document
    .getElementById("video-watched-progress-bar")
    .setAttribute("style", s);
}

function updateVolumeBarLength(fraction) {
  const s = `height: ${(100 * fraction).toString()}%`;
  volumeSliderBar.setAttribute("style", s);
}

function showVolumeSlider() {
  volumeSlider.setAttribute("class", "progress progress-bar-vertical");

  volumeSliderBar.setAttribute("class", "progress-bar");
  volumeSliderBar.setAttribute("role", "progressbar");
  volumeSliderBar.setAttribute("aria-valuemin", "0");
  volumeSliderBar.setAttribute("aria-valuemax", "100");

  const v = player.getVolume();
  volumeSliderBar.setAttribute("style", `height: ${v.toString()}%`);
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

function setSidebarHeight() {
  const height = playerOverlay.offsetHeight;
  const qHeight = document.getElementById("video-queue-title").offsetHeight;
  const rHeight = document.getElementById("room-code-title").offsetHeight;

  queuePanel.setAttribute("style", `max-height: ${height - qHeight - 6}px;`);
  userPanel.parentElement.setAttribute(
    "style",
    `max-height: ${height - rHeight - 6}px;`
  );
}
// -------------------- helper functions --------------------

// -------------------- event listener --------------------
// unfocuses button after pressed
document.querySelectorAll("button").forEach(function (item) {
  item.addEventListener("focus", function () {
    this.blur();
  });
});

volumeButton.addEventListener("click", toggleVolumeSlider);

volumeSlider.addEventListener("click", changeVolume);

fullscreenButton.addEventListener("click", toggleFullscreen);
// -------------------- event listener --------------------

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

// runs when video is resized
new ResizeObserver(setSidebarHeight).observe(playerOverlay);
// -------------------- other functions --------------------
// -------------------- client side functions --------------------
