var Vector2 = require('./vector2')

var Rectangle = function (x, y, width, height) {
    if (typeof(y) == 'undefined') {
        if (typeof(x) == 'undefined') {
            x = 0;
        }
        y = x;
    }
    if (typeof(width) == 'undefined') {
        height = 0;
    }
    if (typeof(height) == 'undefined') {
        width = 0;
    }

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};

Rectangle.prototype.copy = function () {
    return new Rectangle(this.x, this.y, this.width. this.height);
}

Rectangle.prototype.intersects = function(other) {
    return (this.x < (other.x + other.width) && (this.x + this.width) > other.x &&
        this.y < (other.y + other.height) && (this.y + this.height) > other.y); 
}

module.exports = Rectangle;
