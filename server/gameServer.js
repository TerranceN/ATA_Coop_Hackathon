var Player = require("../common/player");
require("./playerControlled");
var Vector2 = require("../common/vector2")
var World = require("../common/world");
var GameManager = require("./gameManager");
var ioModule = require("socket.io");
var io;

var players = [];
var entities = [];
var lastPlayerId = 0;
var lastUpdateTime = Date.now();
var updatesPerSecond = 10;
var game;

var getNextPlayerId = function () {
    lastPlayerId += 1;
    return lastPlayerId;
}

var newPlayer = function (socket) {
    var p = new Player(getNextPlayerId(), socket, true, io);
    p.spawn(game.world.getRandomSpawnPos());
    players.push(p);
    return p;
}

var initConnectionHandler = function () {
    io.sockets.on('connection', function (socket) {
        var player = newPlayer(socket);
        socket.emit('connectionAccepted', {'id': player.id, 'world':game.world});
        socket.join('spectator');
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
        socket.on('newgamerecieved', function(data){
            player.gameID = data['gameID'];
        });
        socket.on('toggleNextGame', function(data){
            player.nextGame = !player.nextGame;
            player.socket.emit('nextGameStatus', {'value': player.nextGame});
        });
    });
}

var updatePlayers = function (dt) {
    for (var i = 0; i < players.length; i++) {
        players[i].update(dt, players, game.world, game.state, io);
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
    var player;
    var items, item;
    for (var i = 0; i < players.length; i++) {
        player = players[i];
        items = []
        for (var k = 0; k < player.items.length; ++k) {
            items.push([]);
            for (var j = 0; j < player.items[k].length; ++j) {
                item = player.items[k][j];
                items[k].push({"id":item.id, "type":item.type});
            }
        }
        playerData.push({
                'id': player.id,
                'position': player.position,
                'velocity': player.velocity,
                'angle': player.angle,
                'alive': player.alive,
                'interacting': player.interacting,
                'items': items});
    }

    io.sockets.emit('playerUpdate', {
            'timestamp': time,
            'players': playerData,
            'gameState': game.state});
}

var gameLoop = function (lastTime) {
    var now = Date.now();
    var dt = (now - lastTime) / 1000;
    dt = Math.min(dt, 1000/60);

    //check game state conditions
    game.checkState( players );
    if (game.state != game.RUNNING && now - game.lastActive > 3000 ){
        game.newGame( players );
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
    game = new GameManager(io);
    initConnectionHandler();
    gameLoop(Date.now());
}
