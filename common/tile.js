var Vector2 = require('./vector2')

var Tile = function (id, type) {
	this.id = id;
	this.owner_id = 0;
	this.type = type;
}

Tile.ROOM = 0;
Tile.WALL = 1;
Tile.VOID = 2;
Tile.CORRIDOR = 3

module.exports = Tile;