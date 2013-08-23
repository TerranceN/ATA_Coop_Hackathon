var Sprite = require('./sprite');
var Entity = require('./entity');
var Vector2 = require('./vector2');

var RUG = 0;
var CABINET = 1;

var RUG_SIZE = new Vector2(64, 110);

var Searchable = function(type) {
    //this.sprite = new Sprite('client/img/player1.png', [0, 0], [32, 32], 1, [0]);
	this.sprite = new Sprite('client/img/rug.png', [0, 0], [RUG_SIZE.x, RUG_SIZE.y], 1, [0]);
	this.position = new Vector2(0, 0);
	this.size = RUG_SIZE;
	this.angle = 0;
}

Searchable.RUG = RUG;

Searchable.prototype = new Entity();        // Set prototype to Person's
Searchable.prototype.constructor = Searchable;

module.exports = Searchable;