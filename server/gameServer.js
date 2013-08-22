var Player = require("../common/player");
var world = require("../common/world");
var ioModule = require("socket.io");
var io;

var players = [];
var lastPlayerId = 0;
var lastUpdateTime = Date.now();
var updatesPerSecond = 10;

var getNextPlayerId = function () {
    lastPlayerId += 1;
    return lastPlayerId;
}

var newPlayer = function (socket) {
    var p = new Player(getNextPlayerId(), socket, true);
    players.push(p);
    return p;
}

var initConnectionHandler = function () {
    io.sockets.on('connection', function (socket) {
        var player = newPlayer(socket);
        socket.emit('connectionAccepted', {'id': player.id});
        socket.on('disconnect', function () {
            players.splice(players.indexOf(player), 1);
            io.sockets.emit('userDisconnected', {'id': player.id});
        });
    });
}

var updatePlayers = function (dt) {
    for (var i = 0; i < players.length; i++) {
        players[i].update(dt);
    }

    var now = Date.now();
    if (now > lastUpdateTime + (1000 / updatesPerSecond)) {
        sendPlayerUpdates();
        lastUpdateTime = now;
    }
}

var sendPlayerUpdates = function () {
    playerData = [];
    for (var i = 0; i < players.length; i++) {
        playerData.push({'id': players[i].id, 'position': players[i].position, 'velocity': players[i].velocity});
    }

    io.sockets.emit('playerUpdate', {'players': playerData});
}

var gameLoop = function (lastTime) {
    var now = Date.now();
    var dt = (now - lastTime) / 1000;

    updatePlayers(dt);

    lastTime = now;

    setTimeout(function() {
        gameLoop(now);
    }, 1000 / 60);
};

module.exports.init = function (app) {
    io = ioModule.listen(app);
    io.set('log level', 1); // reduce logging
    initConnectionHandler();
    gameLoop(Date.now());
}
