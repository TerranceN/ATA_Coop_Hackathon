var Vector2 = require('./vector2')

var Tile = function (id) {
	this.id = id;
	this.owner_id = 0;
}

module.exports = Tile;