var Vector2 = require('./vector2')

var Player = function (id, socket) {
    this.id = id;
    this.socket = socket;
    this.position = new Vector2();

    this.createListeners(socket);
};

Player.prototype.createListeners = function (socket) {
    //if (isServer) {
    //    socket.on('player_update', function (data) {
    //        console.log(data['position']);
    //    });
    //} else {
    //}
};

Player.prototype.update = function (delta) {
    this.position.add(this.velocity.scale(delta));
}

module.exports = Player;
