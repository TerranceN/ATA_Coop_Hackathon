var Vector2 = require('./vector2')
var Rectangle = require('./rectangle')
var Room = require('./room')
var Utility = require('./utility');

var ground = 0;
var wall = 1;
var nothing = 2;

var World = function() {
	this.size = new Vector2(35, 35);
	this.gridunit = 45;

	this.width = this.size.x * this.gridunit;
	this.height = this.size.y * this.gridunit;
	this.rooms = new Array();

	this.tiles = new Array(this.size.x);

	for (var i = 0; i < this.size.x; ++i) {
		this.tiles[i] = new Array(this.size.y);
		for (var j = 0; j < this.size.y; ++j) {
			this.tiles[i][j] = 2;
		}
	}

	this.generate();
}

World.prototype.make = function(other) {
	this.size = other.size;
	this.gridunit = other.gridunit;

	this.width = other.width;
	this.height = other.height;
	this.rooms = other.rooms;

	this.tiles = other.tiles;
}

World.prototype.generate = function() {
	var maxSize = 10;
	var minSize = 4;
	var radius = 10;

	var i = 0;
	var retries = 20;
	var rooms = 20;
	for (i; i < rooms; ++i) {
		var size = new Vector2(Math.floor(Math.random() * (maxSize - minSize) + minSize),
						Math.floor(Math.random() * (maxSize - minSize) + minSize));
		var position = new Vector2(Math.floor(Math.random() * (this.size.x - size.x)), 
									Math.floor(Math.random() * (this.size.y - size.y)));

		var room = new Room(new Rectangle(position.x, position.y, size.x, size.y));

		var collides = false;
		for (var j = 0; j < this.rooms.length; ++j) {
			if (room.bounds.intersects(this.rooms[j].bounds)) {
				collides = true;
				break;
			}
		}

		if (!collides) {
			this.rooms.push(room);
			for (var j = 0; j < size.x; ++j) {
				for (var k = 0; k < size.y; ++k) {
					if (j == 0 || k == 0 || j == size.x - 1 || k == size.y - 1) { // WALL
						this.tiles[position.x + j][position.y + k] = 1;
					} else { // FLOOR
						this.tiles[position.x + j][position.y + k] = 0;
					}
				}
			}
		} else {
			// awww ya, dat hack
			if (retries > 0) {
				i--;
			}
			retries--;
		}
	}

	this.connectRooms();
}

World.prototype.connectRooms = function() {
	var unconnectedRooms = new Array();
	for (var i = 0; i < this.rooms.length; ++i) {
		unconnectedRooms.push(this.rooms[i]);
	}

	while(unconnectedRooms.length > 0) {
		var roomA = unconnectedRooms[0];

		var closestNeighbour;
		var minDistance = -1;
		for (var j = 0; j < this.rooms.length; ++j) {
			var roomB = this.rooms[j];
			if (roomA == roomB) {
				continue;
			}

			var distance = roomA.distance(roomB);
			if (distance < minDistance || minDistance == -1) {
				minDistance = distance;
				closestNeighbour = roomB;
			}
		}

		this.connect(roomA, closestNeighbour);
		//this.connect(roomA, this.rooms[Math.floor(Math.random() * this.rooms.length)])

		unconnectedRooms.splice(0, 1);
	}
}

World.prototype.connect = function(roomA, roomB) {
	var xDir = Utility.sign(roomB.center.x - roomA.center.x);
	var yDir = Utility.sign(roomB.center.y - roomA.center.y);

	console.log("I wish I was a a little big taller");

	for (var i = roomA.center.x; xDir != 0 && (xDir == -1 ? i >= roomB.center.x : i <= roomB.center.x); i += xDir) {
		this.tiles[i][roomA.center.y] = 0;
		if (this.tiles[i][roomA.center.y - 1] == 2) {
			this.tiles[i][roomA.center.y - 1] = 1; // WALL
		}
		if (this.tiles[i][roomA.center.y + 1] == 2) {
			this.tiles[i][roomA.center.y + 1] = 1; // WALL
		}
	}
	for (var i = roomA.center.y; yDir != 0 && (yDir == -1 ? i >= roomB.center.y : i <= roomB.center.y); i += yDir) {
		this.tiles[roomB.center.x][i] = 0;
		if (this.tiles[roomB.center.x - 1][i] == 2) {
			this.tiles[roomB.center.x - 1][i] = 1; // WALL
		}
		if (this.tiles[roomB.center.x + 1][i] == 2) {
			this.tiles[roomB.center.x + 1][i] = 1; // WALL
		}
	}

}

World.prototype.toTileCoord = function(position) {
	return new Vector2(Math.floor(position.x / this.gridunit), Math.floor(position.y / this.gridunit));
}

module.exports = World;