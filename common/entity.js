var Sprite = require('./sprite');
var Vector2 = require('./vector2');

var Entity = function (sprite) {
    this.position = new Vector2();
    this.angle = 0;
    this.size = 15;
    this.sprite = new Sprite('client/img/sprites.png', [0, 0], [39, 39], 16, [0]);
};

Entity.prototype.render = function (canvas, ctx) {
    var drawPos = this.position;
    ctx.save();
    ctx.translate(drawPos.x, drawPos.y);
    ctx.rotate(this.angle);
    ctx.translate(- this.sprite.size[0]/2, - this.sprite.size[1]/2);
    this.sprite.render(ctx);
    ctx.restore();
};

module.exports = Entity;