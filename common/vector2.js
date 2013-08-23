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

Vector2.prototype.copy = function () {
    return new Vector2(this.x, this.y);
};

Vector2.prototype.add = function (other) {
    return new Vector2(this.x + other.x, this.y + other.y);
};

Vector2.prototype.scale = function (factor) {
    return new Vector2(this.x * factor, this.y * factor);
};

Vector2.prototype.length = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
};

Vector2.prototype.inner = function(other) {
    return (this.x*other.x) + (this.y*other.y);
};

Vector2.prototype.getNormalized = function () {
    var len = this.length();
    if (len != 0) {
        return new Vector2(this.x / len, this.y / len);
    } else {
        return new Vector2();
    }
};

module.exports = Vector2;
