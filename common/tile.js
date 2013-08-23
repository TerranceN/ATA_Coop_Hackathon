var Vector2 = require('./vector2')

var ROOM = 0;
var HALL = 1;

var Tile = function (id, type) {
	this.id = id;
	this.owner_id = 0;
	this.type = type;
}

module.exports = Tile;