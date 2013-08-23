var Player = require('../../common/player');
var Vector2 = require('../../common/vector2');
var world = require("../../common/world");
var Sprite = require("../../common/sprite");

Player.prototype.draw = function (canvas, ctx) {
    var drawPos = this.getSmoothedPosition();
    
    // Render the player 
    if (this.alive) { 
        ctx.beginPath();
        ctx.arc(drawPos.x, drawPos.y, this.size, 0, 2 * Math.PI, false);
        ctx.fillStyle = Player.COLORS[this.identity % Player.COLORS.length];
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        this.render(canvas, ctx);

        ctx.save();
        ctx.translate(drawPos.x, drawPos.y);
        ctx.rotate(this.angle);
        ctx.translate(- this.hat.size[0]/2 - 5, - this.hat.size[1]/2);
        this.hat.render(ctx);
        ctx.restore();
    } else {
        ctx.beginPath();
        ctx.arc(drawPos.x, drawPos.y, this.size, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
    }
}