var Vector2 = require('./vector2');
var World = require('./world');
var Sprite = require('./sprite');
var Entity = require('./entity');

var playerColors = ['#44ff44', '#ff4444', '#4444ff', '#99cccc'];
var playerNames = ['Highlighter', 'Red Baron', 'Blues Clues', 'Baby Blue'];
var spawnPositions = [new Vector2(100, 100), new Vector2(300, 200), new Vector2(250, 260), new Vector2(200, 170), new Vector2(100, 400)]
var playerSpeed = 1500;
var playerDamping = 8;

var hatSizes = [
    [28, 24],
    [24, 29],
    [28, 31],
    [28, 25],
    [24, 29]
]

var Player = function (id, socket, isServer) {
    this.id = id;
    this.socket = socket;
    this.position = spawnPositions[id % spawnPositions.length];
    this.velocity = new Vector2();
    this.size = 15;
    this.visitedStructures = 0;
    this.hatId = 4;//Math.floor(Math.random() * hatSizes.length) + 1;
    this.hat = new Sprite('client/img/hats/hat' + this.hatId + '.png', [0, 0], hatSizes[this.hatId - 1], 1, [0]);
    this.colliding = false
    this.sprite = new Sprite('client/img/player1.png', [0, 0], [32, 32], 1, [0]);

    //tracks player status. identity determines name and colour and can be changed
    this.alive = true;
    this.identity = id;
    this.role = 0;
    this.nextGame = true;

    this.controlForce = new Vector2();
    this.upPressed = false;
    this.downPressed = false;
    this.leftPressed = false;
    this.rightPressed = false;
    this.attackPressed = false;
    this.world = new World();
    this.attackFrame = false; //set to true whe nthe user attacks to indicate it needs to do a hitTest

    if (typeof(socket) != 'undefined') {
        if (typeof(isServer) == 'undefined') {
            isServer = false;
        }

        this.createListeners(socket, isServer);
    }
};

Player.COLORS = ['#44ff44', '#ff4444', '#4444ff', '#99cccc'];
Player.NAMES = ['Highlighter', 'Red Baron', 'Blues Clues', 'Baby Blue'];
var spawnPositions = [new Vector2(100, 100), new Vector2(300, 200), new Vector2(250, 260), new Vector2(200, 170), new Vector2(100, 400)]
Player.SPEED = 750;
Player.DAMPING = 4;

var sign = function (num) {
    if (num < 0) {
        return -1;
    } else if (num > 0) {
        return 1;
    } else {
        return 0;
    }
}

// map an angle to an angle within -pi and pi
var angleLessThanPI = function (angle) {
    while (angle > Math.PI) {
        angle -= Math.PI;
    }
    while (angle < -Math.PI) {
        angle += Math.PI;
    }
    return angle;
}


Player.prototype = new Entity();        // Set prototype to Person's
Player.prototype.constructor = Player;

Player.prototype.setHatId = function(hatId) {
    this.hatId = hatId;
    this.hat = new Sprite('client/img/hats/hat' + this.hatId + '.png', [0, 0], hatSizes[this.hatId - 1], 1, [0]);
}

Player.prototype.spawn = function(position) {
    this.position = position
}

Player.prototype.update = function (delta, players, io) {
    this.velocity = this.velocity.add(this.controlForce.getNormalized().scale(Player.SPEED * delta));
    this.position = this.position.add(this.velocity.scale(delta));
    this.checkCollisions(delta);
    this.velocity = this.velocity.add(this.velocity.scale(-delta * Player.DAMPING));

    if (this.attackFrame) {
        // Player just attacked. see if he hit anything.
        this.attackFrame = false;
        //hit test (server only, client positions are unreliable)
        if (io) {
            io.sockets.emit('newEntity', {'position': this.position, 'angle':this.angle, 'type':Entity.ATTACK});
            for (var i = 0; i < players.length; i++) {
                var player2 = players[i];
                if (player2.id != this.id && player2.alive) {
                    var attack_range = 40; // + player size
                    var attack_arc = 60;
                    var posDiff = player2.position.add(this.position.scale(-1));
                    if (posDiff.length() < attack_range) {
                        var angleDiff = Math.atan2(posDiff.y, posDiff.x);
                        //the second player should be within a 60 degree angle difference of the direction this player is facing
                        if (Math.abs(angleLessThanPI(angleDiff - this.angle)) < Math.PI / 3) {
                            player2.alive = false;
                            player2.socket.join('spectator');
                            io.sockets.emit('newEntity', {'position': player2.position, 'angle':angleDiff, 'type':Entity.CORPSE});
                        }
                    }
                }
            }
        }
    }
    if (this.targetOffsetCount < 6) {
        this.targetOffsetCount += 1;
    }
}

Player.prototype.getSmoothedPosition = function () {
    if (this.targetOffsetCount < 6) {
        return this.position.add(this.targetOffset.scale((6 - this.targetOffsetCount) / 6));
    } else {
        return this.position;
    }
}

Player.prototype.checkCollisions = function (delta) {

    // Check collision with edge of map
    if(this.position.x < this.size) {
        this.position.x = this.size;
    }
    if(this.position.x > this.world.width - this.size) {
        this.position.x = this.world.width - this.size;
    }

    if(this.position.y < this.size) {
        this.position.y = this.size;
    }
    if(this.position.y > this.world.height - this.size) {
        this.position.y = this.world.height - this.size;
    }

    var minTileX = Math.max(0, Math.floor((this.position.x - this.size) / this.world.gridunit));
    var maxTileX = Math.min(this.world.size.x - 1, Math.floor((this.position.x + this.size) / this.world.gridunit));
    var minTileY = Math.max(0, Math.floor((this.position.y - this.size) / this.world.gridunit));
    var maxTileY = Math.min(this.world.size.y - 1, Math.floor((this.position.y + this.size) / this.world.gridunit));

    this.colliding = false;
    // Check collision with objects in map
    for (var i = minTileX; i <= maxTileX; ++i) {
        for (var j = minTileY; j <= maxTileY; ++j) {
            this.visitedStructures = this.visitedStructures | this.world.tiles[i][j].owner_id;
            if (this.world.tiles[i][j].id == 1) {
                this.colliding = true;
            }
        }
    }
}

Player.prototype.getIdentityInfo = function ( identity ) {
    return {'color': Player.COLORS[ this.identity % playerColors.length ], 'name': Player.NAMES[ this.identity % playerNames.length ]};
}

Player.prototype.sendMessage = function (message) {
    this.socket.emit('chat', {'message': message});
}

module.exports = Player;
