var Sprite = require('./sprite');
var Entity = require('./entity');
var Vector2 = require('./vector2');

var RUG = 0;
var TABLE = 1;

var RUG_SIZE = new Vector2(64, 110);
var TABLE_SIZE = new Vector2(96, 32);

var Searchable = function(type) {
	console.log(type);
	if (type == RUG) {
		console.log('rug');
		this.sprite = new Sprite('client/img/rug.png', [0, 0], [RUG_SIZE.x, RUG_SIZE.y], 1, [0]);
		this.size = RUG_SIZE.add(new Vector2(16, 16));
	} else if (type == TABLE) {
		console.log('poop');
		this.sprite = new Sprite('client/img/table.png', [0, 0], [TABLE_SIZE.x, TABLE_SIZE.y], 1, [0]);
		this.size = TABLE_SIZE;
	}
	this.position = new Vector2(0, 0);
	this.angle = 0;
}

Searchable.RUG = RUG;
Searchable.TABLE = TABLE;

Searchable.prototype = new Entity();        // Set prototype to Person's
Searchable.prototype.constructor = Searchable;

module.exports = Searchable;