module.exports.sign = function (num) {
    if (num < 0) {
        return -1;
    } else if (num > 0) {
        return 1;
    } else {
        return 0;
    }
}

module.exports.randIntInRange = function (lo, hi) {
    return Math.floor(Math.random() * (hi - lo) + lo);
}