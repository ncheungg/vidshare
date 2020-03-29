function test() {
  alert("test message");
}

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

function stopVideo() {
  player.stopVideo();
}

// parses link into videoId
function parseVideoLink(link) {
  return link.split("=")[1].split("&")[0];
}

// parses float into scrubber css string
function parseScrubberFraction(fraction) {
  return "width: " + (100 * fraction).toString() + "%";
}

// loads new video
function loadNewVideo() {
  const link = document.getElementById("video-link").value;
  const vId = parseVideoLink(link);

  player.loadVideoById({ videoId: vId });
}

// waiting functions
// checks for enter pressed on form input tag
document.getElementById("video-link").onkeydown = function(event) {
  if (event.keyCode == 13) {
    loadNewVideo();
  }
};

// on "submit" button click
document.getElementById("submit-video-link").onclick = function() {
  loadNewVideo();
};

// play && pause
document.getElementById("play-pause-button").onclick = function() {
  if (player.getPlayerState() == 1) {
    player.pauseVideo();

    // changes button icon
    document
      .getElementById("play-pause-button")
      .getElementsByTagName("i")[0].className = "fa fa-play-circle";
  } else {
    player.playVideo();

    // changes button icon
    document
      .getElementById("play-pause-button")
      .getElementsByTagName("i")[0].className = "fa fa-pause-circle";
  }
};

// skip back 5 seconds
document.getElementById("skip-backward").onclick = function() {
  const time = player.getCurrentTime();
  player.seekTo(time - 5);
};

// skip forward 5 seconds
document.getElementById("skip-forward").onclick = function() {
  const time = player.getCurrentTime();
  player.seekTo(time + 5);
};

// get scrubber click position
document.getElementById("video-progress-bar").onclick = function() {
  const rect = document
    .getElementById("video-progress-bar")
    .getBoundingClientRect();
  const x = event.clientX;
  const fraction = (x - rect.left) / (rect.right - rect.left);
  const sec = fraction * player.getDuration();
  const s = parseScrubberFraction(fraction);

  player.seekTo(sec);
  document
    .getElementById("video-watched-progress-bar")
    .setAttribute("style", s);
};

// other functions
// loop to get scrubber
function getScrubberLength() {
  const videoLength = player.getDuration();
  if (player.getPlayerState() == 1 && videoLength > 0) {
    const fraction = player.getCurrentTime() / videoLength;
    const s = parseScrubberFraction(fraction);
    document
      .getElementById("video-watched-progress-bar")
      .setAttribute("style", s);
  }
}
window.setInterval(getScrubberLength, 100);
