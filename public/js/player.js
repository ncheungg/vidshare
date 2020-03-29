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
      autoplay: 0
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

// checks for enter pressed on form input tag
document.getElementById("video-link").onkeydown = function(event) {
  if (event.keyCode == 13) {
    loadNewVideo();
  }
};

// parses link into videoId
function parseVideoLink(link) {
  return link.split("=")[1].split("&")[0];
}

// loads new video
function loadNewVideo() {
  const link = document.getElementById("video-link").value;
  const vId = parseVideoLink(link);

  player.loadVideoById({ videoId: vId });
}
