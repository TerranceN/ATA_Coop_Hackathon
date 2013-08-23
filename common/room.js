var Vector2 = require('./vector2')
var Rectangle = require('./rectangle')
var Searchable = require('./searchable')

var Room = function(bounds) {
	this.bounds = bounds; // Rectangle
	this.connected = false;
	this.searchables = new Array();
	this.center = new Vector2(this.bounds.x + Math.floor(this.bounds.width/2), this.bounds.y + Math.floor(this.bounds.height/2));
	this.structureId = 0;
}

Room.prototype.distance = function(other) {
	return Math.sqrt(Math.pow(Math.abs(this.center.x - other.center.x), 2) + 
		Math.pow(Math.abs(this.center.y - other.center.y)));
}

module.exports = Room;