var Vector2 = function (x, y) {
    if (typeof(y) == 'undefined') {
        if (typeof(x) == 'undefined') {
            x = 0;
        }
        y = x;
    }

    this.x = x;
    this.y = y;
};

Vector2.prototype.add = function (other) {
    return new Vector2(this.x + other.x, this.y + other.y);
};

Vector2.prototype.scale = function (factor) {
    return new Vector2(this.x * factor, this.y * factor);
};

module.exports = Vector2;
