const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
const { isObject } = require("util");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New Web Socket Connection");

  socket.on("join", ({ username, room, password }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    // if(room==="PrivateRoom1"&&password!=="amogsus"){
    //   alert("Incorrect password")
    //   window.location.replace("localhost:3000");
    // }

    socket.emit("message", generateMessage("Welcome " + user.username));
    socket.broadcast.emit(
      "message",
      generateMessage(
        "Admin",
        `${user.username} Has Joined Room: [${user.room}]`
      )
    );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    // if (filter.isProfane(message)) {
    //   return callback("No");
    // }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    try {
        const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
    } catch (e) {
      alert("Something went wrong")
      console.log(e)
    }
   
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if(!user){
      return
      alert("Something went wrong")
    }

    if (user) {
      io.emit(
        "message",
        generateMessage("Admin", `${user.username} Has Left ${user.room}`)
      );
    }
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}! :O`);
});
