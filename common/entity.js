var Sprite = require('./sprite');
var Vector2 = require('./vector2');

var Entity = function (sprite) {
    this.position = new Vector2();
    this.angle = 0;
    this.size = 15;
    this.sprite = new Sprite('client/img/sprites.png', [0, 0], [39, 39], 16, [0]);

    this.targetOffset = new Vector2();
    this.targetOffsetCount = 0;
};

Entity.prototype.render = function (canvas, ctx) {
    if (this.targetOffsetCount < 6 && !this.socket) {
        var drawPos = this.position.add(this.targetOffset.scale((6 - this.targetOffsetCount) / 6));
        this.targetOffsetCount += 1;
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
