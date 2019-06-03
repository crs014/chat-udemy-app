const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

let count = 0;


io.on('connection', (socket) => {
    console.log("this is form socket connection");

    socket.on("join", (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });
        if(error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit("message", generateMessage("welcome", user.username));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`, user.username));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users : getUsersInRoom(user.room)
        });
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        if(!user) {
            console.log("user not found");
            return;
        }

        const filter = new Filter();
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        
        io.to(user.room).emit("message", generateMessage(message, user.username));
        callback("Deliverd!");
    });

    socket.on('sendLocation', (cords, callback) => {
        const user = getUser(socket.id);
        io.emit("locationMessage", { 
           url : `https://google.com/maps?q=${cords.lat},${cords.long}`,
           createdAt : new Date().getTime(),
           username : user.username
        });
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit("message", generateMessage(`${user.username} has left`, user.username));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users : getUsersInRoom(user.room)
            });
        }
    });
});

server.listen(port, () => {
    console.log(`server is listen port ${port}`);
});