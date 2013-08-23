var Player = require('../../common/player');
var Vector2 = require('../../common/vector2');
var world = require("../../common/world");

Player.prototype.setKey = function (event, status) {
    var code = event.keyCode;
    var key = String.fromCharCode(code);
    
    this.upPressed = this.upPressed === undefined ? 0 : this.upPressed;
    this.leftPressed = this.leftPressed === undefined ? 0 : this.leftPressed;
    this.rightPressed = this.rightPressed === undefined ? 0 : this.rightPressed;
    this.downPressed = this.downPressed === undefined ? 0 : this.downPressed;

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
        this.controlForce = new Vector2(this.rightPressed - this.leftPressed, this.downPressed - this.upPressed).getNormalized();
        this.socket.emit('controlForce', this.controlForce);
    }
}

Player.prototype.createListeners = function (socket, isServer) {
    var player = this;
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

    document.addEventListener('click', function (evt) {
        player.socket.emit("attack", {angle: player.angle});
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
