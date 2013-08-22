var Vector2 = require('./vector2');
var world = require('./world');

var playerSpeed = 30;
var playerDamping = 6;

var Player = function (id, socket, isServer) {
    this.id = id;
    this.socket = socket;
    this.position = new Vector2(Math.random() * 200, Math.random() * 200);
    this.velocity = new Vector2();
    this.targetOffset = new Vector2();
    this.targetOffsetCount = 0;
    this.size = 15;

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

var sign = function (num) {
    if (num < 0) {
        return -1;
    } else if (num > 0) {
        return 1;
    } else {
        return 0;
    }
}

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
    if (this.targetOffsetCount < 6) {
        var drawPos = this.position.add(this.targetOffset.scale((6 - this.targetOffsetCount) / 6));
        this.targetOffsetCount += 1;
    } else {
        var drawPos = this.position;
    }

    // Render the player 
    ctx.beginPath();
    ctx.arc(drawPos.x, drawPos.y, this.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = "rgba(192, 255, 192, 1.0)";//'#ccffcc';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
}

module.exports = Player;
