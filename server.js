// -------------------- app setup --------------------
const express = require("express");
const socket = require("socket.io");

const app = express();
const server = app.listen(process.env.PORT || 5000, () =>
  console.log("started server")
);

// define static files
app.use(express.static("public"));

// -------------------- app setup --------------------

// -------------------- helper functions --------------------
function joinSocketToRoom(socket, roomCode) {
  socket.join(roomCode);
  updateUserLengths(roomCode);

  console.log("joined", socket.id, "to room", roomCode);
}

function updateUserLengths(roomCode) {
  const length = io.sockets.adapter.rooms[roomCode].length;
  io.in(roomCode).emit("update-user-count", length);
}

function makeRoomCode(length) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function checkIfRoomExists(roomCode) {
  const roomCodes = Object.keys(io.sockets.adapter.rooms);
  return roomCodes.includes(roomCode);
}
// -------------------- helper functions --------------------

// -------------------- socket setup/listening functions --------------------
const io = socket(server);
io.on("connection", function (socket) {
  console.log("connected with socket", socket.id);

  // -------------------- index.html socket functions --------------------
  socket.on("create-room", (fn) => {
    let roomCode = makeRoomCode(4);
    while (checkIfRoomExists(roomCode)) {
      roomCode = makeRoomCode(4);
    }

    fn(roomCode);
    console.log("created room", roomCode);
  });

  socket.on("check-room", (roomCode, fn) => {
    fn(checkIfRoomExists(roomCode.toString()));
  });
  // -------------------- index.html socket functions --------------------

  // -------------------- player.html socket functions --------------------
  socket.on("join-room", (roomCode) => {
    joinSocketToRoom(socket, roomCode);
  });

  socket.on("get-player-data", (roomCode) => {
    const rooms = io.sockets.adapter.rooms[roomCode];

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
      // sends out default video data
      io.sockets.to(socket.id).emit("receive-player-data", {
        vId: "PYxs1EvVHbM",
        time: 0,
        playerState: 1,
        videoQueue: [],
      });
    }
  });

  // sends out player data (runs with "get-player-data")
  socket.on("receive-player-data", (data) => {
    io.sockets.to(data.id).emit("receive-player-data", data);
  });

  socket.on("disconnect", () => {
    // loops thru all rooms and updates usercount
    const roomCodes = Object.keys(io.sockets.adapter.rooms);
    for (let i = 0; i < roomCodes.length; i++) {
      updateUserLengths(roomCodes[i]);
    }

    console.log(socket.id, "disconnected");
  });

  socket.on("play-video", (roomCode) => {
    io.in(roomCode).emit("play-video");

    console.log("playing video on", roomCode);
  });

  socket.on("pause-video", (roomCode) => {
    io.in(roomCode).emit("pause-video");

    console.log("pausing video on", roomCode);
  });

  socket.on("seek-to", (data) => {
    io.in(data.roomCode).emit("seek-to", data.time);

    console.log("seeking to", data.time, "on", data.roomCode);
  });

  socket.on("queue-new-video", (data) => {
    io.in(data.roomCode).emit("queue-new-video", data.vId);

    console.log("queueing new video with ID", data.vId, "on", data.roomCode);
  });

  socket.on("next-video", (roomCode) => {
    io.in(roomCode).emit("next-video");

    console.log("skipping to next video on", roomCode);
  });

  socket.on("skip-video", (data) => {
    io.in(data.roomCode).emit("skip-video", data.vId);

    console.log(`skipping to vId ${data.vId} on ${data.roomCode}`);
  });
  // -------------------- player.html socket functions --------------------
});
// -------------------- socket setup/listening functions --------------------
