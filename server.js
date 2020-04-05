const express = require("express");
const socket = require("socket.io");

// app setup
const app = express();
const server = app.listen(process.env.PORT || 5000, () =>
  console.log("started server")
);

// static files
app.use(express.static("public"));

// helper functions
// joins socket to room
function joinSocketToRoom(socket, roomCode) {
  socket.join(roomCode);
  updateUserLengths(roomCode);
}

function updateUserLengths(roomCode) {
  const length = io.sockets.adapter.rooms[roomCode].length;
  io.in(roomCode).emit("update-user-count", length);
}

function makeRoomCode(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function checkIfRoomExists(roomCode) {
  const roomCodes = Object.keys(io.sockets.adapter.rooms);
  return roomCodes.includes(roomCode);
}

// socket setup
const io = socket(server);
io.on("connection", function (socket) {
  // on connection runs this code
  console.log("connected with socket", socket.id);

  // index.html socket functions
  socket.on("create-room", (fn) => {
    let roomCode = makeRoomCode(4);
    while (checkIfRoomExists(roomCode)) {
      roomCode = makeRoomCode(4);
    }

    // runs passed in function
    fn(roomCode);
  });

  // sends back if room exists
  socket.on("check-room", (roomCode, fn) => {
    fn(checkIfRoomExists(roomCode.toString()));
  });

  // player.html functions
  // joins room
  socket.on("join-room", (roomCode) => {
    joinSocketToRoom(socket, roomCode);
  });

  socket.on("get-player-data", (roomCode) => {
    const rooms = io.sockets.adapter.rooms;
    console.log("nigger", rooms);

    if (rooms.length > 1) {
      // gets socket that is not itself
      let firstSocket;
      for (firstSocket in rooms["sockets"]) {
        if (firstSocket != socket.id) {
          break;
        }
      }

      // gets video data from socket
      io.sockets.to(firstSocket).emit("get-player-data", socket.id);
    } else {
      // sends out preset video data
      const data = { vId: "WFcjKjTq178", time: 0, playerState: 1 };
      io.sockets.to(socket.id).emit("receive-player-data", data);
    }
  });

  // sends out player data
  socket.on("receive-player-data", (data) => {
    io.sockets.to(data.id).emit("receive-player-data", data);
  });

  socket.on("disconnect", () => {
    // loops thru all rooms and updates usercount
    const roomCodes = Object.keys(io.sockets.adapter.rooms);
    for (let i = 0; i < roomCodes.length; i++) {
      updateUserLengths(roomCodes[i]);
    }
  });

  socket.on("play-video", (roomCode) => {
    io.in(roomCode).emit("play-video");

    console.log("playing video");
  });

  socket.on("pause-video", (roomCode) => {
    io.in(roomCode).emit("pause-video");

    console.log("pausing video");
  });

  socket.on("seek-to", (data) => {
    io.in(data.roomCode).emit("seek-to", data.time);

    console.log("seeking to", data.time, "on", data.roomCode);
  });

  socket.on("load-new-video", (data) => {
    io.in(data.roomCode).emit("load-new-video", data.vId);

    console.log("loading new video with ID", data.vId, "on", data.roomCode);
  });
});
