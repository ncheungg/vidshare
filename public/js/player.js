// makes websocket connection
const socket = io.connect("https://secure-dusk-40036.herokuapp.com/");

// DOM elements
const playPauseButton = document.getElementById("play-pause-button");
const skipBackward = document.getElementById("skip-backward");
const skipForward = document.getElementById("skip-forward");
const videoScrubberBox = document.getElementById("video-progress-bar");
const videoLinkAddressBox = document.getElementById("video-link");
const submitButton = document.getElementById("submit-video-link");
const volumeButton = document.getElementById("volume-button");
const volumeSlider = document.getElementById("volume-slider");

// Emit events

playPauseButton.addEventListener("click", () => {
  socket.emit("play-pause");
});

skipBackward.addEventListener("click", () => {
  socket.emit("skip-backward");
});

skipForward.addEventListener("click", () => {
  socket.emit("skip-forward");
});

videoLinkAddressBox.addEventListener("keydown", key => {
  if (key.keyCode !== 13) {
    const vId = parseVideoLink(videoLinkAddressBox.value);
    socket.emit("load-new-video", {
      videoId: vId
    });
  }
});

submitButton.addEventListener("click", () => {
  const vId = parseVideoLink(videoLinkAddressBox.value);
  socket.emit("load-new-video", {
    videoId: vId
  });
});

videoScrubberBox.addEventListener("click", () => {
  const rect = videoScrubberBox.getBoundingClientRect();
  const x = event.clientX;
  const fraction = (x - rect.left) / (rect.right - rect.left);
  const sec = fraction * player.getDuration();

  socket.emit("seek-to", {
    time: sec
  });
});

// listen for socket events

socket.on("play-pause", playPauseVideo);
socket.on("skip-backward", skipBack5Seconds);
socket.on("skip-forward", skipForward5Seconds);

socket.on("load-new-video", data => {
  player.loadVideoById(data);
});

socket.on("seek-to", data => {
  const sec = data.time;
  player.seekTo(sec);
});

// socket helper functions
// play && pause
function playPauseVideo() {
  if (player.getPlayerState() == 1) {
    player.pauseVideo();

    // changes button icon
    playPauseButton.getElementsByTagName("i")[0].className =
      "fa fa-play-circle";
  } else {
    player.playVideo();

    // changes button icon
    playPauseButton.getElementsByTagName("i")[0].className =
      "fa fa-pause-circle";
  }
}

// skip back 5 seconds
function skipBack5Seconds() {
  const time = player.getCurrentTime();
  player.seekTo(time - 5);
}

// skip forward 5 seconds
function skipForward5Seconds() {
  const time = player.getCurrentTime();
  player.seekTo(time + 5);
}

// youtube player api code
// 2. This code loads the IFrame Player API code asynchronously.
const tag = document.createElement("script");

tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
let player;
function onYouTubeIframeAPIReady(vId = "WFcjKjTq178") {
  player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    videoId: vId,
    events: {
      onReady: onPlayerReady
      // onStateChange: onPlayerStateChange
    },
    playerVars: {
      controls: 0,
      modestbranding: 1,
      autoplay: 1,
      disablekb: 1
    }
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  // event.target.playVideo();
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

// helper functions
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

function showVolumeSlider() {
  volumeSlider.setAttribute("class", "progress progress-bar-vertical");

  const insideDiv = volumeSlider.getElementsByTagName("div")[0];
  insideDiv.setAttribute("class", "progress-bar");
  insideDiv.setAttribute("role", "progressbar");
  insideDiv.setAttribute("aria-valuemin", "0");
  insideDiv.setAttribute("aria-valuemax", "100");
  insideDiv.setAttribute("style", "height: 100%;");
}

function hideVolumeSlider() {
  const insideDiv = volumeSlider.getElementsByTagName("div")[0];
  insideDiv.removeAttribute("class");
  insideDiv.removeAttribute("role");
  insideDiv.removeAttribute("aria-valuemin");
  insideDiv.removeAttribute("aria-valuemax");
  insideDiv.removeAttribute("style");

  volumeSlider.removeAttribute("class");
}

// listening functions
volumeButton.addEventListener("click", () => {
  if (volumeSlider.getElementsByTagName("div")[0].className == "") {
    showVolumeSlider();
  } else {
    hideVolumeSlider();
  }
});

// other functions
// loop to get scrubber
function getScrubberLength() {
  const videoLength = player.getDuration();
  if (player.getPlayerState() > 0 && videoLength > 0) {
    const fraction = player.getCurrentTime() / videoLength;
    updateScrubberLength(fraction);
  }
}
window.setInterval(getScrubberLength, 100);
