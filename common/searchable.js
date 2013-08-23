var Sprite = require('./sprite');
var Entity = require('./entity');
var Vector2 = require('./vector2');

var RUG = 0;
var CABINET = 1;

var RUG_SIZE = new Vector2(64, 110);

/* Refer to World.prototype.createObjects for a demonstration of how this class
 * should be used.
 */
var Searchable = function(id, type, duration) {
    this.id = id;
    /* The duration in milliseconds for which we allow a user to interact with us
     * OR the duration in milliseconds it takes for the interaction to succeed
     */
    this.duration = duration || 3000;
	this.sprite = new Sprite('client/img/rug.png', [0, 0], RUG_SIZE, 1, [0]);
	this.position = new Vector2(0, 0);
	this.size = RUG_SIZE;
	this.angle = 0;
    /* A list of {player:< player >, beginTime:< time >} objects storing
     * the Player objects who are currently interacting with us with
     * their particular begin interaction timestamps.
     */
    this.interactions = [];
}

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
module.exports.RUG = RUG;