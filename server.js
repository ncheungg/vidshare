const express = require("express");
const socket = require("socket.io");

function createExpressApp(port) {
  // app setup
  const app = express();
  const server = app.listen(process.env.PORT || port, () =>
    console.log("running server on port", port)
  );

  // static files
  app.use(express.static("public"));

  // variables
  let connectedUserList = [];

  // socket setup
  const io = socket(server);
  io.on("connection", function (socket) {
    // on connection runs this code
    connectedUserList.push(socket);
    io.sockets.emit("update-user-list", connectedUserList.length);

    console.log("connected with socket", socket.id);

    // socket functions
    socket.on("disconnect", () => {
      connectedUserList.splice(connectedUserList.indexOf(socket), 1);
      io.sockets.emit("update-user-list", connectedUserList.length);

      console.log("disconnected with", socket.id);
    });

    socket.on("get-player-data", function (fn) {
      if (connectedUserList.length > 1) {
        const firstSocket = connectedUserList[0];
        io.sockets.to(firstSocket.id).emit("get-player-data");
        firstSocket.on("receive-player-data", (data) => {
          fn(data);

          console.log("grabbed video data:", data);
        });
      } else {
        fn({ vId: "WFcjKjTq178", time: 0, playerState: 1 });

        console.log("grabbed video data:", {
          vId: "WFcjKjTq178",
          time: 0,
          playerState: 1,
        });
      }
    });

    socket.on("play-video", () => {
      io.sockets.emit("play-video");

      console.log("playing video");
    });

    socket.on("pause-video", () => {
      io.sockets.emit("pause-video");

      console.log("pausing video");
    });

    socket.on("seek-to", (data) => {
      io.sockets.emit("seek-to", data);

      console.log("seeking to", data);
    });

    socket.on("load-new-video", (data) => {
      io.sockets.emit("load-new-video", data);

      console.log("loading new video with ID", data);
    });
  });
}

// init express apps
createExpressApp(5000);
