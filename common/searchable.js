var Sprite = require('./sprite');
var Entity = require('./entity');
var Vector2 = require('./vector2');
var Item = require('./item');

var RUG = 'rug';
var CABINET = 'cabinet';
var CORPSE = 'corpse';
var CRATE = 'crate';
var TABLE = 'table';

var RUG_SIZE = new Vector2(32, 64);
var TABLE_SIZE = new Vector2(32, 32);

/* Refer to World.prototype.createObjects for a demonstration of how
 * objects created by this constructor should be used.
 */
var Searchable = function(id, position, angle, type, duration) {
    this.id = id;
    /* The duration in milliseconds for which we allow a user to interact with us
     * OR the duration in milliseconds it takes for the interaction to succeed
     */
    this.duration = duration || 2500;
    this.type = type;
    this.size = new Vector2();
    if (this.type == RUG) {
		this.sprite = new Sprite('client/img/rug.png', [0, 0], [RUG_SIZE.x, RUG_SIZE.y], 1, [0]);
	} else if (this.type == CORPSE) {
        this.sprite = new Sprite('client/img/corpse.png', [0, 0], [32, 32], 1, [0]);
    	this.size = new Vector2(30,30);
    } else if (this.type == CRATE) {
        this.sprite = new Sprite('client/img/crate.png', [0, 0], [32, 32], 1, [0]);
    	this.size = new Vector2(32,32);
    } else if (type == TABLE) {
        this.sprite = new Sprite('client/img/table.png', [0, 0], [TABLE_SIZE.x, TABLE_SIZE.y], 1, [0]);
        this.size = TABLE_SIZE;
    } else {
		this.sprite = new Sprite('client/img/rug.png', [0, 0], [RUG_SIZE.x, RUG_SIZE.y], 1, [0]);
    }
	this.position = position;
	this.angle = angle;
    /* A list of {player:< player >, beginTime:< time >} objects storing
     * the Player objects who are currently interacting with us with
     * their particular begin interaction timestamps.
     */
    this.interactions = [];
    this.contains = (Math.floor(Math.random() * 4) == 0 ? 1 : 0);

    this.beginInteraction = idleBeginInteraction;
    this.endInteraction = idleEndInteraction;
    this.allowPlayerInteraction = allowPlayerInteraction;
    this.onPlayerSuccess = generateOnPlayerSuccess(this.id);
}

var searchingBeginInteraction = function (player, time) {
    return false;
};
var idleBeginInteraction = function (player, time) {
    if (this.allowPlayerInteraction(player)) {
        this.interactions.push({player:player, startTime:time});
        this.beginInteraction = searchingBeginInteraction;
        this.endInteraction = searchingEndInteraction;
    }
    return true;
}
var searchingEndInteraction = function (player, time) {
    if (player.id != this.interactions[0].player.id) {
        return;
    }
    var interaction = this.interactions.shift();
    if (time - interaction.startTime >= this.duration) {
        this.onPlayerSuccess(interaction.player);
    }
    this.beginInteraction = idleBeginInteraction;
    this.endInteraction = idleEndInteraction;
}
var idleEndInteraction = function (player, time) {}
var allowPlayerInteraction = function (player) {
    return !player.interacting && player.items[Item.TYPES.objective].length < Item.MAX_OWN[Item.TYPES.objective];
}
function generateOnPlayerSuccess (objectiveId) {
    var onPlayerSuccess = function (player) {
    	console.log("GOT AN ITEM!!!")
        for (var i = 0; i < this.contains; i++) {
		    player.items[Item.TYPES.objective].push(new Item(objectiveId, Item.TYPES.objective, null));
	    }
        this.contains = 0;
    }
    return onPlayerSuccess;
}
Searchable.RUG = RUG;
Searchable.CRATE = CRATE;
Searchable.CORPSE = CORPSE;
Searchable.TABLE = TABLE;

Searchable.prototype = new Entity();        // Set prototype to Person's
Searchable.prototype.constructor = Searchable;

Searchable.prototype.make = function(other) {
	this.id = other.id;
	this.position = new Vector2(other.position.x, other.position.y);
	this.angle = other.angle;
	this.type = other.type;
	this.duration = other.duration;
	this.contains = other.contains;
}

Searchable.prototype.beginInteraction = function (player, time) {
    /* @param player: a Player object - the player who seeks to interact with us
     * @param time: a timestamp indicating when the player seeks to interact
     * @return true if we allow the player to interact; false if we do not allow
     */
}

Searchable.prototype.endInteraction = function (player, time) {
    /* Overload this method to do something useful
     * @param player: a Player object - the player who stops interacting with us,
     *               whether because the duration is up or because he canceled
     * @param time: a timestamp indicating when the player stops interacting
     */
}

module.exports = Searchable;
