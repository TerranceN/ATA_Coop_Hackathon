var Vector2 = require('./vector2');
var world = require('./world');
var Sprite = require('./sprite');
var Entity = require('./entity');

var playerColors = ['#44ff44', '#ff4444', '#4444ff', '#99cccc'];
var spawnPositions = [new Vector2(100, 100), new Vector2(300, 200), new Vector2(250, 260), new Vector2(200, 170), new Vector2(100, 400)]
var playerSpeed = 30;
var playerDamping = 6;

var Player = function (id, socket, isServer, io) {
    this.id = id;
    this.socket = socket;
    this.position = spawnPositions[id % spawnPositions.length];
    this.velocity = new Vector2();
    this.size = 15;
    this.hat = new Sprite('client/img/hats/hat' + id % 3 + '.png', [0, 0], [24, 24], [0]);
    this.colliding = false
    this.sprite = new Sprite('client/img/player1.png', [0, 0], [32, 32], 1, [0]);

    this.controlsDirection = new Vector2();
    this.upPressed = false;
    this.downPressed = false;
    this.leftPressed = false;
    this.rightPressed = false;
    this.attackPressed = false;

    if (typeof(socket) != 'undefined') {
        if (typeof(isServer) == 'undefined') {
            isServer = false;
        }

        this.createListeners(socket, isServer, io);
    }
};

var sign = function (num) {
    if (num < 0) {
        return -1;
    } else if (num > 0) {
        return 1;
    } else {
        return 0;
    }
}


Player.prototype = new Entity();        // Set prototype to Person's
Player.prototype.constructor = Player;

Player.prototype.setKey = function (event, status) {
    var code = event.keyCode;
    var key = String.fromCharCode(code);

    switch (key) {
        case 'W': {
            this.upPressed = status;
        } break;
        case 'A': {
            this.leftPressed = status;
        } break;
        case 'S': {
            this.downPressed = status;
        } break;
        case 'D': {
            this.rightPressed = status;
        } break;
        case 'Q': {
            // Attack button was previously released and is now pressed.
            if (status && !this.attackPressed) {
                this.socket.emit("attack", {angle: this.angle});
            }
            this.attackPressed = status;
        }
    }

    if (key == 'W' || key == 'A' || key == 'S' || key == 'D') {
        this.socket.emit('setKey', {key: key, status: status});
    }
}

Player.prototype.createListeners = function (socket, isServer, io) {
    var player = this;
    if (isServer) {
        socket.on('setKey', function (data) {
            if (data['key'] == 'W') {
                player.upPressed = data['status'];
            } else if (data['key'] == 'S') {
                player.downPressed = data['status'];
            } else if (data['key'] == 'A') {
                player.leftPressed = data['status'];
            } else if (data['key'] == 'D') {
                player.rightPressed = data['status'];
            }
        });

        socket.on('attack', function (data) {
            player.angle = data['angle'];
            if (io) {
                io.sockets.emit('newEntity', {'position': player.position, 'angle':player.angle, 'type':Entity.ATTACK});
            }
        });

    } else {
        document.addEventListener('keydown', function(e) {
            player.setKey(e, true);
        });

        document.addEventListener('keyup', function(e) {
            player.setKey(e, false);
        });

        window.addEventListener('blur', function() {
            player.upPressed = false;
            player.downPressed = false;
            player.leftPressed = false;
            player.rightPressed = false;
        });

        document.addEventListener('mousemove', function (evt) {
            if (evt.target == canvas) {
                if (evt.offsetX) {
                    mouse = new Vector2(evt.offsetX, evt.offsetY);
                }
                else if (evt.layerX) {
                    mouse = new Vector2(evt.layerX, evt.layerY);
                }

                var mouseDiff = mouse.add(new Vector2(-canvas.width/2, -canvas.height/2));
                player.angle = Math.atan2(mouseDiff.y, mouseDiff.x);
            }
        }, false);
    }
};

Player.prototype.update = function (delta) {
    if (typeof(this.socket) != 'undefined') {
        var controlsDirection = new Vector2();
        controlsDirection.y -= this.upPressed ? 1 : 0;
        controlsDirection.y += this.downPressed ? 1 : 0;
        controlsDirection.x -= this.leftPressed ? 1 : 0;
        controlsDirection.x += this.rightPressed ? 1 : 0;
        this.velocity = this.velocity.add(controlsDirection.getNormalized().scale(playerSpeed));
    }
    this.position = this.position.add(this.velocity.scale(delta));
    this.checkCollisions(delta);
    this.velocity = this.velocity.add(this.velocity.scale(-delta * playerDamping));
}

Player.prototype.checkCollisions = function (delta) {

    // Check collision with edge of map
    if(this.position.x < this.size) {
        this.position.x = this.size;
    }
    if(this.position.x > world.width - this.size) {
        this.position.x = world.width - this.size;
    }

    if(this.position.y < this.size) {
        this.position.y = this.size;
    }
    if(this.position.y > world.height - this.size) {
        this.position.y = world.height - this.size;
    }

    var minTileX = Math.max(0, Math.floor((this.position.x - this.size) / world.gridunit));
    var maxTileX = Math.min(world.size.x - 1, Math.floor((this.position.x + this.size) / world.gridunit));
    var minTileY = Math.max(0, Math.floor((this.position.y - this.size) / world.gridunit));
    var maxTileY = Math.min(world.size.y - 1, Math.floor((this.position.y + this.size) / world.gridunit));

    this.colliding = false;
    // Check collision with objects in map
    for (var i = minTileX; i <= maxTileX; ++i) {
        for (var j = minTileY; j <= maxTileY; ++j) {
            if (world.tiles[i][j] == 1) {
                this.colliding = true;
            }
        }
    }
} 

Player.prototype.draw = function (canvas, ctx) {
    if (this.targetOffsetCount < 6 && !this.socket) {
        var drawPos = this.position.add(this.targetOffset.scale((6 - this.targetOffsetCount) / 6));
    } else {
        var drawPos = this.position;
    }
    
    // Render the player 
    ctx.beginPath();
    ctx.arc(drawPos.x, drawPos.y, this.size, 0, 2 * Math.PI, false);
    if (this.colliding) {
        ctx.fillStyle = "rgba(64, 64, 64, 1.0)";
    } else {
        ctx.fillStyle = playerColors[this.id % playerColors.length];
    }
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    this.render(canvas, ctx);
}

module.exports = Player;
