var Player = require('../../common/player');
var Vector2 = require('../../common/vector2');
var world = require("../../common/world");
var Sprite = require("../../common/sprite");
var Entity = require("../../common/entity");

var userPlayer;
var players = [];
var entities = [];

// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.id = 'canvas';
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
var cameraOffset;

// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};

var init = function init() {
    lastTime = Date.now();
    var socket = io.connect(document.URL);
    var newestMessageTime = 0;
    socket.on('connectionAccepted', function(data) {
        if (typeof(data['id']) != 'undefined') {
            userPlayer = new Player(data['id'], socket);
            players.push(userPlayer);

            socket.on('playerUpdate', function(data) {
                var timestamp = data['timestamp'];

                if (timestamp > newestMessageTime) {
                    var playerUpdates = data['players'];

                    for (var i = 0; i < playerUpdates.length; i++) {
                        var thisPlayerUpdate = playerUpdates[i];
                        var id = thisPlayerUpdate['id'];

                        var foundPlayer = false;
                        for (var j = 0; j < players.length; j++) {
                            if (id == players[j].id) {
                                var oldPosition = players[j].position.copy();
                                players[j].position.x = thisPlayerUpdate['position'].x;
                                players[j].position.y = thisPlayerUpdate['position'].y;
                                players[j].velocity.x = thisPlayerUpdate['velocity'].x;
                                players[j].velocity.y = thisPlayerUpdate['velocity'].y;
                                players[j].targetOffset = oldPosition.add(players[j].position.scale(-1))
                                players[j].targetOffsetCount = 0;
                                // The angle of the current player is decided by his mouse position rather than the server.
                                if (id != userPlayer.id) {
                                    players[j].angle = thisPlayerUpdate['angle'];
                                }
                                foundPlayer = true;
                            }
                        }

                        if (!foundPlayer) {
                            var newPlayer = new Player(id);
                            players.push(newPlayer);
                            newPlayer.position.x = thisPlayerUpdate['position'].x;
                            newPlayer.position.y = thisPlayerUpdate['position'].y;
                            newPlayer.velocity.x = thisPlayerUpdate['velocity'].x;
                            newPlayer.velocity.y = thisPlayerUpdate['velocity'].y;
                        }
                    }
                } else {
                    console.log("Skipping update since " + timestamp + " >= " + newestMessageTime);
                }
            });

            socket.on('userDisconnected', function (data) {
                for (var i = players.length - 1; i >= 0; i--) {
                    if (players[i].id == data['id']) {
                        players.splice(i, 1);
                    }
                }
            });

            socket.on('newEntity', function (data) {
                entities.push(new Entity(new Vector2(data['position'].x, data['position'].y), data['angle'], data['type']));
            });
            main();
        }
    });
}

// Game state

var gameTime = 0;

// Speed in pixels per second
var playerSpeed = 200;

// Update game objects
function update(dt) {
    gameTime += dt;

    updateEntities(dt);
};

function updateEntities(dt) {
    for (var i = 0; i < players.length; i++) {
        players[i].update(dt);
    }
    for (var i = 0; i < entities.length; i++) {
        entities[i].updateAnimation(dt);
    }
}

// Draw everything
function render() {
    ctx.setTransform(1,0,0,1,0,0);

    var canvasSize = new Vector2(canvas.width, canvas.height);
    var screenOffset = canvasSize.scale(1/2).add(userPlayer.getSmoothedPosition().scale(-1));
    if (typeof(cameraOffset) == 'undefined') {
        cameraOffset = screenOffset;
    } else {
        var difference = screenOffset.add(cameraOffset.scale(-1));
        cameraOffset = cameraOffset.add(difference.scale(1/20));
    }

    //ctx.translate(cameraOffset.x, cameraOffset.y);

    // Fill the screen gray (the out of bounds area)
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fill the area of the world that is in bounds as white
    ctx.translate(cameraOffset.x, cameraOffset.y);
    ctx.beginPath();
    ctx.rect(0, 0, world.width, world.height);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    for (var i = 0; i < world.size.x; ++i) {
        for (var j = 0; j < world.size.y; ++j) {
            var tile_url = 'client/img/grass.png';
            if (world.tiles[i][j] == 0) { // ground
                var tile_url = 'client/img/road.png';
            } else if (world.tiles[i][j] == 1) { // wall
                var tile_url = 'client/img/wall.png';
            } else if (world.tiles[i][j] == -1) { // DEBUG
                var tile_url = 'none';
            }
            if (tile_url != 'none') {
                ctx.drawImage(resources.get(tile_url),
                  i*world.gridunit, j*world.gridunit,
                  world.gridunit, world.gridunit);
            }
        }
    }
    // outline the edge of the world]
    //ctx.translate(cameraOffset.x, cameraOffset.y);
    ctx.beginPath();
    ctx.rect(0, 0, world.width, world.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    for (var i = 0; i < players.length; i++) {
        players[i].draw(canvas, ctx);
    }
    for (var i = 0; i < entities.length; i++) {
        entities[i].render(canvas, ctx);
    }

    ctx.setTransform(1,0,0,1,0,0);
};

resources.load([
    'client/img/sprites.png',
    'client/img/terrain.png',
    'client/img/player1.png',
    'client/img/attack.png',
    'client/img/hats/hat1.png',
    'client/img/hats/hat2.png',
    'client/img/hats/hat3.png',
    'client/img/hats/hat4.png',
    'client/img/road.png',
    'client/img/water.png',
    'client/img/grass.png',
    'client/img/wall.png',
    'client/img/attack.png'
]);
resources.onReady(init);
