const express = require("express");
const socket = require("socket.io");

// app setup
const app = express();
const server = app.listen(process.env.PORT || 5000, () =>
  console.log("running server")
);

// static files
app.use(express.static("public"));

// variables
let connectedUserList = [];

// socket setup
const io = socket(server);
io.on("connection", function (socket) {
  // on connection runs this code
  console.log("connected with socket", socket.id);
  connectedUserList.push(socket);
  io.sockets.emit("update-user-list", connectedUserList.length);

  // socket functions
  socket.on("disconnect", () => {
    connectedUserList.splice(connectedUserList.indexOf(socket), 1);
    console.log("disconnected with", socket.id);
    io.sockets.emit("update-user-list", connectedUserList.length);
  });

  socket.on("get-player-data", function (fn) {
    if (connectedUserList.length > 1) {
      const firstSocket = connectedUserList[0];
      io.sockets.to(firstSocket.id).emit("get-player-data");
      firstSocket.on("receive-player-data", (data) => {
        fn(data);
      });
    } else {
      fn({ vId: "WFcjKjTq178", time: 0, playerState: 1 });
    }
  });

  socket.on("play-video", () => {
    io.sockets.emit("play-video");
  });

  socket.on("pause-video", () => {
    io.sockets.emit("pause-video");
  });

  socket.on("skip-backward", () => {
    io.sockets.emit("skip-backward");
  });

  socket.on("skip-forward", () => {
    io.sockets.emit("skip-forward");
  });

  socket.on("seek-to", (data) => {
    io.sockets.emit("seek-to", data);
  });

  socket.on("load-new-video", (data) => {
    io.sockets.emit("load-new-video", data);
  });
});

io.on("disconnect", function (socket) {
  console.log("bye bye");
});
