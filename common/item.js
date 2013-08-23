
function Item(id, type) {
    this.id = id;
    this.type = type;
}

Item.TYPES = {
    OBJECTIVE:0,
    WEAPON:1,
    POWER:2,
    MODIFIER:3
}

Item.MAX_OWN = [1, Infinity, 1, Infinity];
