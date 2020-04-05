// -------------------- websocket --------------------
const socket = io.connect("https://secure-dusk-40036.herokuapp.com/");
// const socket = io.connect("http://localhost:5000/");
// -------------------- websocket --------------------

// -------------------- DOM elements --------------------
const createRoomTab = document.getElementById("create-tab");
const joinRoomTab = document.getElementById("join-tab");
const navTabs = document.getElementsByClassName("nav-link");
const cardBody = document.getElementById("card-body");
const cardParagraph = cardBody.getElementsByTagName("p")[0];
// -------------------- DOM elements --------------------

// -------------------- helper functions --------------------
// toggles active and inactive tabs
function changeActiveNavTab(first, second) {
  navTabs[0].className = "nav-link " + first;
  navTabs[1].className = "nav-link " + second;
}

// changes HTML to support "create room" tab
function changeToCreateRoomTab() {
  changeActiveNavTab("disabled", "active");

  // removes existing join room form
  cardBody.removeChild(cardBody.getElementsByClassName("input-group")[0]);

  // adds create room button
  const button = document.createElement("a");
  button.className = "btn btn-primary";
  button.href = "#";
  button.setAttribute("onclick", "createRoom()");
  button.innerHTML = "Create Room";
  cardBody.appendChild(button);

  cardParagraph.innerHTML = "Create a room to watch videos with your friends";
}

// changes HTML to support "join room" tab
function changeToJoinRoomTab() {
  changeActiveNavTab("active", "disabled");

  // removes existing create room button
  cardBody.removeChild(cardBody.getElementsByTagName("a")[0]);

  // adds form to submit room code
  const formDiv = document.createElement("div");
  formDiv.className = "input-group mb-3";

  const form = document.createElement("input");
  form.className = "form-control";
  form.id = "room-code-input";
  form.setAttribute("type", "search");
  form.setAttribute("placeholder", "ABCD");
  form.setAttribute("onsearch", "joinRoom()");

  const buttonDiv = document.createElement("div");
  buttonDiv.className = "input-group-append";

  const button = document.createElement("button");
  button.className = "btn btn-primary";
  button.setAttribute("type", "button");
  button.setAttribute("onclick", "joinRoom()");
  button.innerHTML = "Join Room";

  buttonDiv.appendChild(button);
  formDiv.appendChild(form);
  formDiv.appendChild(buttonDiv);
  cardBody.appendChild(formDiv);

  cardParagraph.innerHTML =
    "Join an existing room with your friend's room code";
}

function createRoom() {
  socket.emit("create-room", (roomCode) => {
    location.href = "player.html?joinRoom=" + roomCode;
  });
}

function joinRoom() {
  const form = document.getElementById("room-code-input");
  socket.emit("check-room", form.value, (roomExists) => {
    console.log(roomExists);
    if (roomExists) {
      location.href = "player.html?joinRoom=" + form.value;
    } else {
      // displays invalid form
      form.className = "form-control is-invalid";
    }
  });
}
// -------------------- helper functions --------------------

// -------------------- on click functions --------------------
createRoomTab.addEventListener("click", changeToCreateRoomTab);
joinRoomTab.addEventListener("click", changeToJoinRoomTab);
// -------------------- on click functions --------------------
