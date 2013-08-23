var Vector2 = require('./vector2');
var World = require('./world');
var Sprite = require('./sprite');
var Entity = require('./entity');
var Searchable = require('./searchable');

var hatSizes = [
    [28, 24],
    [29, 24],
    [31, 28],
    [29, 24],
    [25, 28],
    [26, 26],
    [32, 20],
]

var Player = function (id, socket, isServer) {
    console.log('player');
    this.id = id;
    this.socket = socket;
    this.position = spawnPositions[id % spawnPositions.length];
    this.velocity = new Vector2();
    this.size = 15;
    this.visitedStructures = 0;
    this.sprite = new Sprite('client/img/player1.png', [0, 0], [32, 32], 1, [0]);

    //tracks player status. identity determines name and colour and can be changed
    this.alive = false;

    this.identity = id;
    this.role = 0;
    this.nextGame = true;
    this.gameID = 0;

    this.hatId = this.identity % hatSizes.length;
    this.hat = new Sprite('client/img/hats/hat' + this.hatId + '.png', [0, 0], hatSizes[this.hatId - 1], 1, [0]);

    this.controlForce = new Vector2();
    this.upPressed = false;
    this.downPressed = false;
    this.leftPressed = false;
    this.rightPressed = false;
    this.attackPressed = false;
    this.attackFrame = false; //set to true whe nthe user attacks to indicate it needs to do a hitTest
    this.actionQueue = [];
    this.interacting = false;
    this.items = [[], [], [], []];

    if (typeof(socket) != 'undefined') {
        if (typeof(isServer) == 'undefined') {
            isServer = false;
        }

        this.createListeners(socket, isServer);
    }
};

Player.COLORS = new Array('#44ff44', '#ff4444', '#4444ff', '#99cccc', '#856788', '#856448', '#FFFFFF');
Player.NAMES = ['Highlighter', 'Red Baron', 'Blues Clues', 'Baby Blue', 'name 5', 'name 6', 'WalterWhite'];
var spawnPositions = [new Vector2(100, 100), new Vector2(300, 200), new Vector2(250, 260), new Vector2(200, 170), new Vector2(100, 400), new Vector2(400, 200), new Vector2(200, 300)]
Player.SPEED = 1500;
Player.DAMPING = 8;

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
    angle = angle % (2 * Math.PI);
    return angle <= Math.PI ? angle : 2 * Math.PI - angle;
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

Player.prototype.update = function (delta, players, world, gameState, io) {
    this.velocity = this.velocity.add(this.controlForce.getNormalized().scale(Player.SPEED * delta));
    if (gameState == 4 || gameState == 1 || gameState == 0) {
        this.checkCollisions(delta, world);
    } else {
        this.position = this.position.add( this.velocity.scale(delta));
    }
    this.velocity = this.velocity.add(this.velocity.scale(-delta * Player.DAMPING));
    
    var action;
    var now;
    if (this.interacting) {
        action = true;
        while (action && this.actionQueue.length) {
            action = this.actionQueue.shift();
        }
        var interactive = this.world.getObjectById(this.interacting.interactiveId);
        if (!action || Date.now() - this.interacting.startTime >= interactive.duration) {
            now = Date.now();
            interactive.endInteraction(this, now);
            this.interacting = false;
        }
    }
    if (this.actionQueue.length && !this.interacting) {
        action = false;
        while (this.actionQueue.length) {
            action = action || this.actionQueue.shift()
        }
        if (action) {
            var interactives = this.world.searchables;
            var validInteractives = [];
            var interactive;
            var posDiff, angleDiff, score;
            for (var i = 0; i < interactives.length; ++i) {
                interactive = interactives[i];
                posDiff = interactive.position.add(this.position.scale(-1))
                angleDiff = Math.atan2(posDiff.y, posDiff.x);
                if (Math.abs(angleLessThanPI(angleDiff - this.angle)) < Math.PI / 6 && posDiff.length() < 30) {
                    validInteractives.push({key:posDiff.length(), obj:interactive});
                }
            }
            var idx, minIdx, minKey;
            minKey = Infinity;
            for (idx = 0; idx < validInteractives.length; ++idx) {
                if (validInteractives[idx].key < minKey) {
                    minKey = validInteractives[idx].key;
                    minIdx = idx;
                }
            }
            if (minKey !== Infinity) {
                var interactive = validInteractives[minIdx].obj;
                now = Date.now();
                this.interacting = interactive.beginInteraction(this, now) && {
                    interactiveId:interactive.id,
                    startTime:now
                };
            }
            
        }
    }
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
                            var corpse = new Searchable(world.getNextObjectID(), player2.position, angleDiff, Searchable.CORPSE);
                            world.searchables.push(corpse);
                            io.sockets.emit('newEntity', {'id':corpse.id, 'position': corpse.position, 'angle':corpse.angle, 'type':Searchable.CORPSE});
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


Player.prototype.checkCollisions = function (delta, world) {
    // Track which rooms the user has been to
    var i = Math.floor(this.position.x / world.gridunit);
    var j = Math.floor(this.position.y / world.gridunit);
    this.visitedStructures = this.visitedStructures | world.tiles[i][j].owner_id;

    //COLLISION TEST
    var x2 = this.position.x + this.velocity.x * delta;
    var y2 = this.position.y + this.velocity.y * delta;

    var gridunit = world.gridunit;
    var UR = this.size;

    //represent unit as 5 points in a plus shape
    //get the tiles covered by these points and at most 2 are on tiles different than gx gy
    //consider collisions on these different tiles and the intermediary diagonal tile
    var xmin = Math.floor(Math.max(0, x2 - UR));
    var xmax = Math.floor(Math.min(x2 + UR, world.width - 1));
    var ymin = Math.floor(Math.max(0, y2 - UR));
    var ymax = Math.floor(Math.min(y2 + UR, world.height - 1));
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
    if ((newgx != gx) && (world.tiles[newgx][gy].id == 1)) {
        if (newx > x2) {
            x2 = newgx * gridunit - UR;
        } else {
            x2 = (newgx + 1) * gridunit + UR;
        }
        this.velocity.x = 0;
    }

    //vertical collision test
    if ((newgy != gy) && (world.tiles[gx][newgy].id == 1)) {
        if (newy > y2) {
            y2 = newgy * gridunit - UR;
        } else {
            y2 = (newgy + 1) * gridunit + UR ;
        }
        this.velocity.y = 0;
    }
    //corner collision possible
    if (newgx != gx && newgy != gy && (world.tiles[newgx][newgy].id == 1)) {
        //want to use circle hitbox not square
        var ox = 0;
        var oy = 0;
        if (newgx > gx) {
            ox = newgx * gridunit - x2;
        } else {
            ox = x2 - (newgx + 1) * gridunit;
        }
        if (newgy > gy) {
            oy = newgy * gridunit - y2;
        } else {
            oy = y2 - (newgy + 1) * gridunit;
        }
        //
        var xt = Math.sqrt(UR * UR - oy * oy);
        var yt = Math.sqrt(UR * UR - ox * ox);
        //x large enough
        var xHit = ((newgx > gx) && (x2 + xt > newgx * gridunit))
            || ((newgx < gx) && (x2 - xt < (newgx + 1) * gridunit));
        var yHit = ((newgy > gy) && (gy + yt > newgy * gridunit))
            || ((newgy < gy) && (y2 - yt < (newgy + 1) * gridunit));
        if (xHit && yHit) {
            //collided.
            var offset = new Vector2(ox, oy);
            //move the player away from the point of collision until he is unit radius away
            offset = offset.scaleTo(UR - offset.length());
            ox = Math.abs(offset.x);
            oy = Math.abs(offset.y);
            if (newgx > gx) {
                x2 = x2 - ox;// - UR;
            } else {
                x2 = x2 + ox;// + UR;
            }
            if (newgy > gy) {
                y2 = y2 - oy;// - UR;
            } else {
                y2 = y2 + oy;// + UR;
            }
            //adjust velocity according to distance from point of collision to unit
            //point of collision is x2 +- ox I think
             
            //or according to "actual velocity"
            //var dx:Number = x2 - this.x;
            //var dy:Number = y2 - this.y;
            //vx = dx / dt;
            //vy = dy / dt;
        }
    }

    this.position.x = Math.max(UR, Math.min(x2, world.width - UR) );
    if (this.position.x == UR) { 
        this.velocity.x = Math.max(this.velocity.x, 0);
    }
    if (this.position.x == world.width-UR) {
        this.velocity.x = Math.min(this.velocity.x, 0);
    }
    this.position.y = y2; //Math.max(UR, Math.min(y2, world.height - UR) );
    if (this.position.y == UR) {
        this.velocity.y = Math.max(this.velocity.y, 0);
    }
    if (this.position.y == world.height - UR) {
      this.velocity.y = Math.min(this.velocity.y, 0);  
    } 
};

Player.prototype.getIdentityInfo = function () {
    return {'color': Player.COLORS[ this.identity % Player.COLORS.length ], 'name': Player.NAMES[ this.identity % Player.NAMES.length ]};
};

Player.prototype.sendMessage = function (message) {
    this.socket.emit('chat', {'message': message});
};

module.exports = Player;
