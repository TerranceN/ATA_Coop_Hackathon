var Vector2 = require('./vector2');
var World = require('./world');
var Sprite = require('./sprite');
var Entity = require('./entity');

var playerColors = ['#44ff44', '#ff4444', '#4444ff', '#99cccc'];
var playerNames = ['Highlighter', 'Red Baron', 'Blues Clues', 'Baby Blue'];
var spawnPositions = [new Vector2(100, 100), new Vector2(300, 200), new Vector2(250, 260), new Vector2(200, 170), new Vector2(100, 400)]
var playerSpeed = 750;
var playerDamping = 4;

var hatSizes = [
    [28, 24],
    [24, 29],
    [28, 31],
    [28, 25]
]

var Player = function (id, socket, isServer, io) {
    this.id = id;
    this.socket = socket;
    this.position = spawnPositions[id % spawnPositions.length];
    this.velocity = new Vector2();
    this.size = 15;
    this.hatId = Math.floor(Math.random() * 4) + 1;
    this.hat = new Sprite('client/img/hats/hat' + this.hatId + '.png', [0, 0], hatSizes[this.hatId - 1], 1, [0]);
    this.colliding = false
    this.sprite = new Sprite('client/img/player1.png', [0, 0], [32, 32], 1, [0]);

    //tracks player status. identity determines name and colour and can be changed
    this.alive = true;
    this.identity = id;

    this.controlForce = new Vector2();
    this.upPressed = false;
    this.downPressed = false;
    this.leftPressed = false;
    this.rightPressed = false;
    this.attackPressed = false;
    this.world = new World();

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

Player.prototype.setHatId = function(hatId) {
    this.hatId = hatId;
    this.hat = new Sprite('client/img/hats/hat' + this.hatId + '.png', [0, 0], hatSizes[this.hatId - 1], 1, [0]);
}





Player.prototype.update = function (delta) {
    this.velocity = this.velocity.add(this.controlForce.getNormalized().scale(playerSpeed * delta));
    this.position = this.position.add(this.velocity.scale(delta));
    this.checkCollisions(delta);
    this.velocity = this.velocity.add(this.velocity.scale(-delta * playerDamping));

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
            if (this.world.tiles[i][j] == 1) {
                this.colliding = true;
            }
        }
    }
}

Player.prototype.draw = function (canvas, ctx) {
    var drawPos = this.getSmoothedPosition();
    
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

    ctx.save();
    ctx.translate(drawPos.x, drawPos.y);
    ctx.rotate(this.angle);
    ctx.translate(- this.hat.size[0]/2 - 5, - this.hat.size[1]/2);
    this.hat.render(ctx);
    ctx.restore();
}

Player.prototype.getIdentityInfo = function ( identity ){
    return {'color': playerColors[ this.identity % playerColors.length ], 'name': playerNames[ this.identity % playerNames.length ]};
}

Player.prototype.sendMessage = function (message) {
    this.socket.emit('chat', {'message': message});
}

module.exports = Player;
