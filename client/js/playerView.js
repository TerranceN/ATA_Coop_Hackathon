var Player = require('../../common/player');
var Vector2 = require('../../common/vector2');
var Sprite = require("../../common/sprite");
var Item = require("../../common/item");

Player.prototype.draw = function (canvas, ctx, world) {
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

        //
        if (this.interacting) {
            var interactive = world.getObjectById(this.interacting.interactiveId);
            var progress = (Date.now() - this.interacting.startTime) / interactive.duration;
            var barsize = new Vector2(32,6);
            //progress bar
            ctx.beginPath();
            ctx.rect(drawPos.x - barsize.x/2, drawPos.y - this.size - barsize.y - 4, barsize.x * progress, barsize.y);
            ctx.fillStyle = '#999999';
            ctx.fill();
            //progress bar outline
            ctx.beginPath();
            ctx.rect(drawPos.x - barsize.x/2, drawPos.y - this.size - barsize.y - 4, barsize.x, barsize.y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
        }
        // Draw items below the user
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