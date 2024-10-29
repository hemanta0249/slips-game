const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
    cors: true
});

const con = mysql.createConnection({
    user: 'pofepave_c',
    password: 'LX*JDwxMZja?!KUnU?yj',
    database: 'pofepave_c',
    host: 'c.pofepave.dbs.hostpoint.internal',
});

con.connect(function () {
    console.log("Connected to mysql!");
    var sql = "CREATE TABLE IF NOT EXISTS notifications (" +
        "sno INT AUTO_INCREMENT PRIMARY KEY, " +
        "notification TEXT, " +
        "sender VARCHAR(255), " +
        "receiver VARCHAR(255)" +
        ")";
    con.query(sql, function (err, result) {
        console.log("Table created");
    });
});

app.get('/', (req, res) => {
    res.send("hello world");
})

const STN = new Map()

// io.on('connection', (socket) => {
//     socket.on('set-name', (name) => {
//         STN.set(socket.id, name);
//         console.log(STN);
//     });

//     socket.on('join room', (room) => {
//         socket.join(room);
//         const userid = STN.get(socket.id);
//         console.log(`${userid} joined room ${room}`);
//         socket.to(room).emit('user-joined', { room, userid });

//         con.connect(function (err) {
//             console.log("Connected!");
//             var sql = `INSERT INTO notifications (notification, sender, receiver) VALUES ('user-joined', '${userid}', '${room}')`;
//             con.query(sql, function (err, result) {
//                 console.log("`INSERT INTO notifications (notification, sender, receiver) VALUES ('user-joined', '${userid}', '${room}')`");
//             });
//         });
//     });

//     socket.on('chat-message', ({ room, message }) => {
//         console.log(message, room);
//         const userid = STN.get(socket.id);
//         socket.to(room).emit('chat-message', { message, userid });
//     }); 

//     socket.on('new-notification', (data) => {
//         console.log('New notification:', data);
//         io.emit('new-notification', data);
//     });

//     socket.on('verify-users', ({notification, id}) => {
//         console.log('New notification:', notification, id);
//         io.emit('verified-user', {notification, id});
//     });
// });








let onlineUsers = {}; // Store users' socket IDs

io.on('connection', (socket) => {
    console.log('New user connected: ', socket.id);

    // Register user and save their socket ID
    socket.on('registerUser', (userId) => {
        onlineUsers[userId] = socket.id;
        console.log(`User ${userId} is online with socket ID: ${socket.id}`);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected: ', socket.id);
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                console.log(`User ${userId} is now offline.`);
                break;
            }
        }
    });

    // Send real-time registration notification to the user
    socket.on('userRegistered', (data) => {
        const userSocketId = onlineUsers[data.userId];
        if (userSocketId) {
            io.to(userSocketId).emit('notification', { message: 'You have registered successfully' });
            console.log(`Registration notification sent to user ${data.userId}`);
        }
    });

    // Send real-time verification notification to the user
    socket.on('userVerified', (data) => {
        const userSocketId = onlineUsers[data.userId];
        if (userSocketId) {
            io.to(userSocketId).emit('notification', { message: 'Your account has been verified' });
            console.log(`Verification notification sent to user ${data.userId}`);
        }
    });

    socket.on('', (data)=>{

    })
});


server.listen(8080, '127.0.0.1');
console.log(`Server running on 8080`);



// const express = require('express');
// const http = require('http');
// const mysql = require('mysql');

// const app = express();
// const server = http.createServer(app);

// app.get('/', (req, res) => {
//     res.send("hello world");
// });

// const con = mysql.createConnection({
//     database: 'venture',
//     user: 'venture',
//     password: 'crest@123',
//     host: 'venture.cgc.ac.in',
// });

// con.connect(function () {
//     console.log("Connected!");
// });

// server.listen(8080, '127.0.0.1');
// console.log(`Server running on 8080... working`);

