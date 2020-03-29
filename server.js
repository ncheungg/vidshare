const express = require("express");
const socket = require("socket.io");

// app setup
const app = express();
const server = app.listen(process.env.PORT || 5000, () =>
  console.log("running server")
);

// static files
app.use(express.static("public"));

// socket setup
const io = socket(server);
io.on("connection", function(socket) {
  console.log("made a socket connection", socket.id);

  socket.on("play-pause", () => {
    io.sockets.emit("play-pause");
  });

  socket.on("skip-backward", () => {
    io.sockets.emit("skip-backward");
  });

  socket.on("skip-forward", () => {
    io.sockets.emit("skip-forward");
  });

  socket.on("seek-to", data => {
    io.sockets.emit("seek-to", data);
  });

  socket.on("load-new-video", data => {
    io.sockets.emit("load-new-video", data);
  });
});
