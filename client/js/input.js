
(function() {
    var pressedKeys = {};
    var socket;
    var player;

    function setKey(event, status) {
        var code = event.keyCode;
        var key = String.fromCharCode(code);

        switch (key) {
            case 'W': {
                player.upPressed = status;
            } break;
            case 'A': {
                player.leftPressed = status;
            } break;
            case 'S': {
                player.downPressed = status;
            } break;
            case 'D': {
                player.rightPressed = status;
            } break;
        }

        if (key == 'W' || key == 'A' || key == 'S' || key == 'D') {
            console.log({key: key, status: status});
            socket.emit('setKey', {key: key, status: status});
            pressedKeys[key] = status;
        }
    }

    document.addEventListener('keydown', function(e) {
        setKey(e, true);
    });

    document.addEventListener('keyup', function(e) {
        setKey(e, false);
    });

    window.addEventListener('blur', function() {
        pressedKeys = {};
    });

    window.input = {
        isDown: function(key) {
            return pressedKeys[key.toUpperCase()];
        },
        setSocket: function (s) { socket = s; },
        setUserPlayer: function (p) {player = p;}
    };
})();
