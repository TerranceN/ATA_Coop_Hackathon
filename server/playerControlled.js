var Entity = require('../common/entity');
var Player = require('../common/player');
var Vector2 = require('../common/vector2');

Player.prototype.createListeners = function (socket, isServer) {
    var player = this;
    socket.on('controlForce', function (data) {
        player.controlForce = new Vector2(data.x, data.y);
    });

    socket.on('attack', function (data) {
        player.angle = data['angle'];
        player.attackFrame = true;
    });
};
