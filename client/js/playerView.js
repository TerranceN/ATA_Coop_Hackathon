var Player = require('../../common/player');
var Vector2 = require('../../common/vector2');
var Sprite = require("../../common/sprite");
var Item = require("../../common/item");

Player.prototype.draw = function (canvas, ctx) {
    var drawPos = this.getSmoothedPosition();

    // Render the player 
    if (this.alive) { 
        ctx.beginPath();
        ctx.arc(drawPos.x, drawPos.y, this.size, 0, 2 * Math.PI, false);
        ctx.fillStyle = Player.COLORS[(this.identity) % Player.COLORS.length];
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        this.render(canvas, ctx);

        ctx.save();
        ctx.translate(drawPos.x, drawPos.y);
        ctx.rotate(this.angle);
        ctx.translate(-this.hat.size[0]/2 - 5, -this.hat.size[1]/2);
        this.hat.render(ctx);
        ctx.restore();

        var itemCount = this.items[Item.TYPES.objective].length;
        var rowSize = 4;
        var itemSize = 8;
        var itemPos = new Vector2(drawPos.x - this.size, drawPos.y + this.size + 2 + itemSize/2);
        for (var i = 0; i < itemCount; i++) { 
            ctx.beginPath();
            ctx.arc(itemPos.x + (itemSize + 2) * (i % rowSize), itemPos.y + (Math.floor(i/rowSize)) * (itemSize + 2), itemSize/2, 0, 2 * Math.PI, false);
            ctx.fillStyle = '#ffff00';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
        }
    } else {
        ctx.beginPath();
        ctx.arc(drawPos.x, drawPos.y, this.size, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
    }
}