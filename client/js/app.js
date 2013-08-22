var Player = require('../../common/player');
var Vector2 = require('../../common/vector2');

var userPlayer;
var players = [];

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
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

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
    socket.on('connectionAccepted', function(data) {
        if (typeof(data['id']) != 'undefined') {
            userPlayer = new Player(data['id'], socket);
            players.push(userPlayer);

            socket.on('playerUpdate', function(data) {
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
            });

            socket.on('userDisconnected', function (data) {
                for (var i = players.length - 1; i >= 0; i--) {
                    if (players[i].id == data['id']) {
                        players.splice(i, 1);
                    }
                }
            });

            main();
        }
    });
}

// Game state
var player = {
    pos: [100, 100],
    size: 15
};

var world = {
    width: 1000,
    height: 1000
};

var gameTime = 0;

// Speed in pixels per second
var playerSpeed = 200;

// Update game objects
function update(dt) {
    gameTime += dt;

    updateEntities(dt);

    checkCollisions();
};

function updateEntities(dt) {
    for (var i = 0; i < players.length; i++) {
        players[i].update(dt);
    }
}

function checkCollisions() {
    checkPlayerBounds();
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < player.size) {
        player.pos[0] = player.size;
    }
    else if(player.pos[0] > world.width - player.size) {
        player.pos[0] = world.width - player.size;
    }

    if(player.pos[1] < player.size) {
        player.pos[1] = player.size;
    }
    else if(player.pos[1] > world.height - player.size) {
        player.pos[1] = world.height - player.size;
    }
}

// Draw everything
function render() {
    var canvasSize = new Vector2(canvas.width, canvas.height);
    var screenOffset = canvasSize.scale(1/2).add(userPlayer.position.scale(-1));

    //ctx.translate(screenOffset.x, screenOffset.y);

    // Fill the screen gray (the out of bounds area)
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fill the area of the world that is in bounds as white
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Draw a grid        
    var gridunit = 20;
    ctx.beginPath();
    for (var x = 0 % gridunit; x <= canvas.width; x += gridunit) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (var y = 0 % gridunit; y <= canvas.height; y += gridunit) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#999999';
    ctx.stroke();

    // outline the edge of the world
    ctx.beginPath();
    ctx.rect(0, 0, world.width, world.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    for (var i = 0; i < players.length; i++) {
        players[i].draw(canvas, ctx);
    }
};
init();
