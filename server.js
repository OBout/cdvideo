const app = require('express')();
const cors = require('cors')
const allowedOrigins = "*"; 
// const http = require('http').Server(app.use(cors()));
// const http = require('http').Server(options, app);
// const io = require('socket.io')(http, { origins: allowedOrigins});

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
        next();
    });
var server = http.createServer(app);
io = socketio.listen(server, {log:false, origins:'*:*'})


var socket = io.connect('https://oscowebvideostream.appspot.com/');

var answersFrom = {}, offer;

var peerConnection = window.RTCPeerConnection ||
    window.mozRTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.msRTCPeerConnection;

var sessionDescription = window.RTCSessionDescription ||
    window.mozRTCSessionDescription ||
    window.webkitRTCSessionDescription ||
    window.msRTCSessionDescription;

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

var pc = new peerConnection({
    iceServers: [{
        url: "stun:stun.services.mozilla.com",
        username: "somename",
        credential: "somecredentials"
    }]
});

pc.onaddstream = function (obj) {
    var vid = document.createElement('video');
    vid.setAttribute('class', 'video-small');
    vid.setAttribute('autoplay', 'autoplay');
    vid.setAttribute('id', 'video-small');
    document.getElementById('users-container').appendChild(vid);
    vid.src = window.URL.createObjectURL(obj.stream);
}

navigator.getUserMedia({ video: true }, function (stream) {
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(stream);
    pc.addStream(stream);
}, error);

function error(err) {
    console.warn('Error', err);
}

function createOffer(id) {
    pc.createOffer(function (offer) {
        pc.setLocalDescription(new sessionDescription(offer), function () {
            socket.emit('make-offer', {
                offer: offer,
                to: id
            });
        }, error);
    }, error);
}

socket.on('answer-made', function (data) {
    pc.setRemoteDescription(new sessionDescription(data.answer), function () {
        document.getElementById(data.socket).setAttribute('class', 'active');
        if (!answersFrom[data.socket]) {
            createOffer(data.socket);
            answersFrom[data.socket] = true;
        }
    }, error);
});

socket.on('offer-made', function (data) {
    offer = data.offer;

    pc.setRemoteDescription(new sessionDescription(data.offer), function () {
        pc.createAnswer(function (answer) {
            pc.setLocalDescription(new sessionDescription(answer), function () {
                socket.emit('make-answer', {
                    answer: answer,
                    to: data.socket
                });
            }, error);
        }, error);
    }, error);
});

socket.on('add-users', function (data) {
    for (var i = 0; i < data.users.length; i++) {
        var el = document.createElement('div'),
            id = data.users[i];

        el.setAttribute('id', id);
        el.innerHTML = id;
        el.addEventListener('click', function () {
            createOffer(id);
        });
        document.getElementById('users').appendChild(el);
    }
});

socket.on('remove-user', function (id) {
    var div = document.getElementById(id);
    document.getElementById('users').removeChild(div);
});