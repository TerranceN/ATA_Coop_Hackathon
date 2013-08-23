var Sprite = require('./sprite');
var Entity = require('./entity');
var Vector2 = require('./vector2');

var RUG = 'rug';
var CABINET = 'cabinet';
var CORPSE = 'corpse';

var RUG_SIZE = new Vector2(64, 110);

/* Refer to World.prototype.createObjects for a demonstration of how this class
 * should be used.
 */
var Searchable = function(id, position, angle, type, duration) {
    this.id = id;
    /* The duration in milliseconds for which we allow a user to interact with us
     * OR the duration in milliseconds it takes for the interaction to succeed
     */
    this.duration = duration || 3000;
    this.type = type;
    if (this.type == RUG) {
		this.sprite = new Sprite('client/img/rug.png', [0, 0], [RUG_SIZE.x, RUG_SIZE.y], 1, [0]);
    } else if (this.type == CORPSE) {
        this.sprite = new Sprite('client/img/corpse.png', [0, 0], [32, 32], 1, [0]);
    } else {
		this.sprite = new Sprite('client/img/rug.png', [0, 0], [RUG_SIZE.x, RUG_SIZE.y], 1, [0]);
    }
	this.position = position;
	this.size = RUG_SIZE;
	this.angle = angle;
    /* A list of {player:< player >, beginTime:< time >} objects storing
     * the Player objects who are currently interacting with us with
     * their particular begin interaction timestamps.
     */
    this.interactions = [];
    this.items = [];
}

Searchable.RUG = RUG;
Searchable.CORPSE = CORPSE;

Searchable.prototype = new Entity();        // Set prototype to Person's
Searchable.prototype.constructor = Searchable;

Searchable.beginInteraction = function (player, time) {
    /* @param player: a Player object - the player who seeks to interact with us
     * @param time: a timestamp indicating when the player seeks to interact
     * @return true if we allow the player to interact; false if we do not allow
     */
}

Searchable.endInteraction = function (player, time) {
    /* @param player: a Player object - the player who stops interacting with us,
     *               whether because the duration is up or because he canceled
     * @param time: a timestamp indicating when the player stops interacting
     */
}

module.exports = Searchable;
