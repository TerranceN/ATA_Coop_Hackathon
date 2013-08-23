
function Item(id, type, use) {
    this.id = id;  // unique ID assigned by game
    this.type = type;  // type of item
    this.use = use;  // a function called when item is used
}

Item.TYPES = {
    objective:0,
    weapon:1,
    power:2,
    modifier:3
}

Item.MAX_OWN = [1, Infinity, 1, Infinity];  // Use by Item.MAX_OWN[Item.Types[< type >]]
