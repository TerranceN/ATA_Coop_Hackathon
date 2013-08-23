var Sprite = require('./sprite');
var Vector2 = require('./vector2');

var ATTACK = 'attack';
var PLAYER = 'player';

var Entity = function (position, angle, type) {
    this.position = position;
    this.angle = angle;
    this.size = 15;
    if (type == ATTACK) {
	    this.sprite = new Sprite('client/img/attack.png', [0, 0], [64, 64], 30, [0, 1, 2, 3, 4], 'horizontal', true);
	}
    this.targetOffset = new Vector2();
    this.targetOffsetCount = 0;
};

Entity.ATTACK = ATTACK;
Entity.PLAYER = PLAYER;

Entity.prototype.updateAnimation = function (dt) {
	this.sprite.update(dt);
};

Entity.prototype.render = function (canvas, ctx) {
    if (typeof(this.getSmoothedPosition()) != 'undefined') {
        var drawPos = this.getSmoothedPosition();
    } else {
        var drawPos = this.position;
    }

    ctx.save();
    ctx.translate(drawPos.x, drawPos.y);
    ctx.rotate(this.angle);
    ctx.translate(- this.sprite.size[0]/2, - this.sprite.size[1]/2);
    this.sprite.render(ctx);
    ctx.restore();
};

module.exports = Entity;
