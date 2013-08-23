var Sprite = require('./sprite');
var Entity = require('./entity');
var Vector2 = require('./vector2');

var RUG = 0;
var CABINET = 1;

var RUG_SIZE = new Vector2(64, 110);

var Searchable = function(type) {
	this.sprite = new Sprite('client/img/rug.png', [0, 0], RUG_SIZE, 1, [0]);
	this.position = Vector2(0, 0);
	this.size = RUG_SIZE;
	this.angle = 0;
}

Searchable.prototype = new Entity();        // Set prototype to Person's
Searchable.prototype.constructor = Searchable;

module.exports = Searchable;
module.exports.RUG = RUG;