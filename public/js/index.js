// -------------------- websocket --------------------
let socket;
function setWebsocket() {
  const urlArr = window.location.href.split("/");
  if (urlArr[2].includes("localhost")) {
    socket = io.connect("http://localhost:5000/");
  } else {
    socket = io.connect("https://secure-dusk-40036.herokuapp.com/");
  }
}
setWebsocket();
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
  navTabs[0].className = `nav-link ${first}`;
  navTabs[1].className = `nav-link ${second}`;
}

function changeToCreateRoomTab() {
  changeActiveNavTab("", "active");

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

function changeToJoinRoomTab() {
  changeActiveNavTab("active", "");

  // removes existing create room button
  cardBody.removeChild(cardBody.getElementsByTagName("a")[0]);

  // ----- adds form to submit room code -----
  const formDiv = document.createElement("div");
  formDiv.className = "input-group mb-3";

  const form = document.createElement("input");
  form.className = "form-control";
  form.id = "room-code-input";
  form.setAttribute("type", "search");
  form.setAttribute("placeholder", "YFC8");
  form.setAttribute("onsearch", "joinRoom()");

  const buttonDiv = document.createElement("div");
  buttonDiv.className = "input-group-append";

  const button = document.createElement("button");
  button.className = "btn btn-primary";
  button.setAttribute("type", "button");
  button.setAttribute("onclick", "joinRoom()");
  button.innerHTML = "Join Room";

  const invalidDiv = document.createElement("div");
  invalidDiv.className = "invalid-feedback";
  invalidDiv.innerHTML = "Please enter a valid youtube video link";

  buttonDiv.appendChild(button);
  formDiv.appendChild(form);
  formDiv.appendChild(buttonDiv);
  formDiv.appendChild(invalidDiv);
  cardBody.appendChild(formDiv);
  // ----- adds form to submit room code -----

  cardParagraph.innerHTML = "Join an existing room with your friend's room code";
}

function createRoom() {
  socket.emit("create-room", (roomCode) => {
    location.href = `/rooms/${roomCode}`;
  });
}

function joinRoom() {
  const form = document.getElementById("room-code-input");
  socket.emit("check-room", form.value.toLowerCase(), (roomExists) => {
    if (roomExists) {
      location.href = `/rooms/${form.value.toLowerCase()}`;
    } else {
      // displays invalid form
      form.className = "form-control is-invalid";
    }
  });
}
// -------------------- helper functions --------------------

// -------------------- event listeners --------------------
createRoomTab.addEventListener("click", changeToCreateRoomTab);
joinRoomTab.addEventListener("click", changeToJoinRoomTab);
// -------------------- event listeners --------------------
