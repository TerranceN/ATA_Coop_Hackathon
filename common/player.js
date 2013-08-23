var Vector2 = require('./vector2');
var world = require('./world');
var Sprite = require('./sprite');
var Entity = require('./entity');

var playerColors = ['#44ff44', '#ff4444', '#4444ff', '#99cccc'];
var playerNames = ['Highlighter', 'Red Baron', 'Blues Clues', 'Baby Blue'];
var spawnPositions = [new Vector2(100, 100), new Vector2(300, 200), new Vector2(250, 260), new Vector2(200, 170), new Vector2(100, 400)]
var playerSpeed = 30;
var playerDamping = 6;

var Player = function (id, socket, isServer) {
    this.id = id;
    this.socket = socket;
    this.position = spawnPositions[id % spawnPositions.length];
    this.velocity = new Vector2();
    this.targetOffset = new Vector2();
    this.targetOffsetCount = 0;
    this.size = 15;
    this.sprite = new Sprite('client/img/player1.png', [0, 0], [32, 32], 1, [0, 1]);

    //tracks player status. identity determines name and colour and can be changed
    this.alive = true;
    this.identity = id;

    this.controlsDirection = new Vector2();
    this.upPressed = false;
    this.downPressed = false;
    this.leftPressed = false;
    this.rightPressed = false;

    if (typeof(socket) != 'undefined') {
        if (typeof(isServer) == 'undefined') {
            isServer = false;
        }

        this.createListeners(socket, isServer);
    }
};

Player.ALIVE = 1;
Player.DEAD = 0;

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
    }

    if (key == 'W' || key == 'A' || key == 'S' || key == 'D') {
        this.socket.emit('setKey', {key: key, status: status});
    }
}

Player.prototype.createListeners = function (socket, isServer) {
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

            /*
            var totalOffsetX = 0;
            var totalOffsetY = 0;
            var canvasX = 0;
            var canvasY = 0;
            var currentElement = canvas;

            do{
                totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
                totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
            }
            while(currentElement = currentElement.offsetParent)

            canvasX = evt.pageX - totalOffsetX;
            canvasY = evt.pageY - totalOffsetY;

            player.mouseX = canvasX;
            player.mouseY = canvasY;
            */

            /*
            var canvas = document.getElementById('canvas');
            var obj = canvas;
            var top = 0;
            var left = 0;
            while (obj && obj.tagName != evt.target) {
                top += obj.offsetTop;
                left += obj.offsetLeft;
                obj = obj.offsetParent;
            }*/

            // return relative mouse position
            /*
            player.mouseX = evt.clientX - left + window.pageXOffset;
            player.mouseY = evt.clientY - top + window.pageYOffset;
            */

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
    this.checkCollisions();
    this.velocity = this.velocity.add(this.velocity.scale(-delta * playerDamping));
}

Player.prototype.checkCollisions = function () {

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
}

Player.prototype.draw = function (canvas, ctx) {
    /*if (this.targetOffsetCount < 6) {
        var drawPos = this.position.add(this.targetOffset.scale((6 - this.targetOffsetCount) / 6));
        this.targetOffsetCount += 1;
    } else {
        var drawPos = this.position;
    }*/
    var drawPos = this.position;
    
    // Render the player 
    ctx.beginPath();
    ctx.arc(drawPos.x, drawPos.y, this.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = playerColors[this.identity % playerColors.length];//"rgba(192, 255, 192, 1.0)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
}

Player.prototype.getIdentityInfo = function ( identity ){
    return {'color': playerColors[ this.identity % playerColors.length ], 'name': playerNames[ this.identity % playerNames.length ]};
}

Player.prototype.sendMessage = function (message) {
    this.socket.emit('chat', {'message': message});
}

module.exports = Player;
