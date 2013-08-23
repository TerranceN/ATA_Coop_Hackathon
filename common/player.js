var Vector2 = require('./vector2');
var World = require('./world');
var Sprite = require('./sprite');
var Entity = require('./entity');

var playerColors = ['#44ff44', '#ff4444', '#4444ff', '#99cccc', "#FFFFFF"];
var playerNames = ['Luke Highlighter', 'Red Baron', 'Blues Clues', 'Baby Blue', 'Walter White'];
var spawnPositions = [new Vector2(100, 100), new Vector2(300, 200), new Vector2(250, 260), new Vector2(200, 170), new Vector2(100, 400)]
var playerSpeed = 1500;
var playerDamping = 8;

var hatSizes = [
    [28, 24],
    [24, 29],
    [28, 31],
    [24, 29],
    [28, 25]
]

var Player = function (id, socket, isServer) {
    this.id = id;
    this.socket = socket;
    this.position = spawnPositions[id % spawnPositions.length];
    this.velocity = new Vector2();
    this.size = 15;
    this.visitedStructures = 0;
    this.hatId = Math.floor(Math.random() * hatSizes.length) + 1;
    this.hat = new Sprite('client/img/hats/hat' + this.hatId + '.png', [0, 0], hatSizes[this.hatId - 1], 1, [0]);
    this.colliding = false
    this.collisionTile = new Vector2(0,0);
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
                        //the second player should be within a +-60 degree angle difference of the direction this player is facing
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
    this.collisionTile = new Vector2(0,0);
    //COLLISION TEST
    var x2 = this.position.x + this.velocity.x * delta;
    var y2 = this.position.y + this.velocity.y * delta;

    var gridunit = this.world.gridunit;
    var UR = this.size;

    //represent unit as 5 points in a plus shape
    //get the tiles covered by these points and at most 2 are on tiles different than gx gy
    //consider collisions on these different tiles and the intermediary diagonal tile
    var xmin = Math.floor(Math.max(0, x2 - UR));
    var xmax = Math.floor(Math.min(x2 + UR, this.world.width - 1));
    var ymin = Math.floor(Math.max(0, y2 - UR));
    var ymax = Math.floor(Math.min(y2 + UR, this.world.height - 1));
    var gx1 = Math.floor(xmin / gridunit);
    var gx2 = Math.floor(xmax / gridunit);
    var gx = Math.floor(x2 / gridunit);
    var gy = Math.floor(y2 / gridunit);
    var gy1 = Math.floor(ymin / gridunit);
    var gy2 = Math.floor(ymax / gridunit);
    //consider the 4 points given by one of these x y values and the other given by x2/y2
    //two will be on the same tile as each other and two might be on a new tile based on vx and vy
    var newx = x2;
    var newy = y2;
    var newgx = gx;
    var newgy = gy;
    if (gx1 < gx) {
        newx = xmin;
        newgx = gx1;
    } else if (gx2 > gx) {
        newx = xmax;
        newgx = gx2;
    }
    if (gy1 < gy) {
        newy = ymin;
        newgy = gy1;
    } else if (gy2 > gy) {
        newy = ymax;
        newgy = gy2;
    }

    //horizontal collision test
    if ((newgx != gx) && (this.world.tiles[newgx][gy].id == 1)) {
        if (newx > x2) {
            x2 = newgx * gridunit - UR;
        } else {
            x2 = (newgx + 1) * gridunit + UR;
        }
        this.velocity.x = 0;
        this.collisionTile = new Vector2(newgx, gy);
    }

    //vertical collision test
    if ((newgy != gy) && (this.world.tiles[gx][newgy].id == 1)) {
        if (newy > y2) {
            y2 = newgy * gridunit - UR;
        } else {
            y2 = (newgy + 1) * gridunit + UR ;
        }
        this.velocity.y = 0;
        this.collisionTile = new Vector2(gx, newgy);
    }
    //corner collision possible
    if (newgx != gx && newgy != gy && (this.world.tiles[newgx][newgy].id == 1)) {
        //want to use circle hitbox not square
        var ox = 0;
        var oy = 0;
        if (newx > x2) {
            ox = newgx * gridunit - x2;
        } else {
            ox = x2 - (newgx + 1) * gridunit;
        }
        if (newy > y2) {
            oy = newgy * gridunit - y2;
        } else {
            oy = y2 - (newgy + 1) * gridunit;
        }
        //
        var xt = Math.sqrt(UR * UR - oy * oy);
        var yt = Math.sqrt(UR * UR - ox * ox);
        //x large enough
        var xHit = ((newx > x2) && (x2 + xt > newgx * gridunit))
            || ((newx < x2) && (x2 - xt < (newgx + 1) * gridunit));
        var yHit = ((newy > y2) && (y2 + yt > newgy * gridunit))
            || ((newy < y2) && (y2 - yt < (newgy + 1) * gridunit));
        if (xHit && yHit) {
            //collided.
            if (newx > x2) {
                x2 = x2 + ox - UR;
            } else {
                x2 = x2 - ox + UR;
            }
            if (newy > y2) {
                y2 = y2 + oy - UR;
            } else {
                y2 = y2 - oy + UR;
            }
            //adjust velocity according to distance from point of collision to unit
            //point of collision is x2 +- ox I think
             
            //or according to "actual velocity"
            //var dx:Number = x2 - this.x;
            //var dy:Number = y2 - this.y;
            //vx = dx / dt;
            //vy = dy / dt;
            this.collisionTile = new Vector2(newgx,newgy);
        }
    }

    this.position.x = Math.max(UR, Math.min(x2, this.world.width - UR) );
    if (this.position.x == UR) { 
        this.velocity.x = Math.max(this.velocity.x, 0);
    }
    if (this.position.x == this.world.width-UR) {
        this.velocity.x = Math.min(this.velocity.x, 0);
    }
    this.position.y = y2; //Math.max(UR, Math.min(y2, this.world.height - UR) );
    if (this.position.y == UR) {
        this.velocity.y = Math.max(this.velocity.y, 0);
    }
    if (this.position.y == this.world.height - UR) {
      this.velocity.y = Math.min(this.velocity.y, 0);  
    } 
};

Player.prototype.getIdentityInfo = function ( identity ) {
    return {'color': Player.COLORS[ this.identity % playerColors.length ], 'name': Player.NAMES[ this.identity % playerNames.length ]};
};

Player.prototype.sendMessage = function (message) {
    this.socket.emit('chat', {'message': message});
};

module.exports = Player;
