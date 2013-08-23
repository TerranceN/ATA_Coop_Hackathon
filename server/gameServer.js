var Player = require("../common/player");
require("./playerControlled");
var Vector2 = require("../common/vector2")
var World = require("../common/world");
var GameManager = require("/gameManager");
var ioModule = require("socket.io");
var io;

var players = [];
var entities = [];
var lastPlayerId = 0;
var lastUpdateTime = Date.now();
var updatesPerSecond = 10;
var world = new World();
var game = new GameManager();

var getNextPlayerId = function () {
    lastPlayerId += 1;
    return lastPlayerId;
}

var newPlayer = function (socket) {
    var p = new Player(getNextPlayerId(), socket, true);
    p.world = world;
    p.spawn(world.getRandomSpawnPos());
    players.push(p);
    p.world = world;
    return p;
}

var initConnectionHandler = function () {
    io.sockets.on('connection', function (socket) {
        var player = newPlayer(socket);
        socket.emit('connectionAccepted', {'id': player.id, 'world':world});
        socket.on('disconnect', function () {
            players.splice(players.indexOf(player), 1);
            io.sockets.emit('userDisconnected', {'id': player.id});
        });

        socket.on('chat', function(message){
            if (player.alive){
                info = player.getIdentityInfo();
                message['name'] = info['name'];
                message['color'] = info['color'];
                console.log(message);
                io.sockets.emit('chat', message);
            } else {
                message['name'] = "Spectator" + player.id;
                message['color'] = "";
                console.log(message);
                io.sockets.in('spectator').emit('chat', message);
            }
        });
    });
}

var updatePlayers = function (dt) {
    for (var i = 0; i < players.length; i++) {
        players[i].update(dt, players, io);
    }

    var now = Date.now();
    if (now > lastUpdateTime + (1000 / updatesPerSecond)) {
        sendPlayerUpdates();
        lastUpdateTime = now;
    }
}

var sendPlayerUpdates = function () {
    var playerData = [];
    var time = Date.now();
    for (var i = 0; i < players.length; i++) {
        playerData.push({
                'id': players[i].id,
                'position': players[i].position,
                'velocity': players[i].velocity,
                'angle': players[i].angle,
                'alive': players[i].alive});
    }

    io.sockets.emit('playerUpdate', {
            'timestamp': time,
            'players': playerData});
}

var gameLoop = function (lastTime) {
    var now = Date.now();
    var dt = (now - lastTime) / 1000;
    dt = Math.min(dt, 1000/60);

    //check game state conditions
    game.checkState();
    if (game.state != game.RUNNING && now - game.lastActive > 3000 ){
        game.newGame();
    }


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
