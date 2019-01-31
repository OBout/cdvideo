var cors = require('cors')
var express = require('express'),
    app = express(),
    socketIO = require('socket.io'),
    fs = require('fs'),
    path = require('path'),
    server, io, sockets = [];
var https = require('https');

// This line is from the Node.js HTTPS documentation.
var options = {
    key: fs.readFileSync('client-key.pem'),
    cert: fs.readFileSync('client-cert.pem')
  };

app.use(cors());
app.use(express.static(__dirname));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server = https.Server(options, app);
server.listen(443);

console.log('Listening on port 443');

io = socketIO(server);

io.on('connection', function (socket) {

    socket.emit('add-users', {
        users: sockets
    });

    socket.broadcast.emit('add-users', {
        users: [socket.id]
    });

    socket.on('make-offer', function (data) {
        console.log('making offer');
        socket.to(data.to).emit('offer-made', {
            offer: data.offer,
            socket: socket.id
        });
    });

    socket.on('make-answer', function (data) {
        console.log('making answer');
        socket.to(data.to).emit('answer-made', {
            socket: socket.id,
            answer: data.answer
        });
    });

    socket.on('disconnect', function () {
        sockets.splice(sockets.indexOf(socket.id), 1);
        io.emit('remove-user', socket.id);
    });

    sockets.push(socket.id);

});