var Vector2 = require('./vector2');
var Rectangle = require('./rectangle');
var Room = require('./room');
var Utility = require('./utility');
var Tile = require('./tile');
var Searchable = require('./searchable');

var ground = 0;
var wall = 1;
var nothing = 2;

var World = function( numPlayers ) {
	if (typeof(numPlayers) == 'undefined') {
		numPlayers = 5;
	}
	this.size = new Vector2( numPlayers * 10, numPlayers * 10 );
	this.gridunit = 35;
	this.lastStructureId = 1;
	this.numPlayers = numPlayers;

	this.searchables = new Array();
	this.width = this.size.x * this.gridunit;
	this.height = this.size.y * this.gridunit;
	this.rooms = new Array();

	this.tiles = new Array(this.size.x);

	for (var i = 0; i < this.size.x; ++i) {
		this.tiles[i] = new Array(this.size.y);
		for (var j = 0; j < this.size.y; ++j) {
			this.tiles[i][j] = new Tile(2);
		}
	}

	this.generate();
}

World.prototype.getSpawn = function(){
	return Vector2(10,10);
}

World.prototype.make = function(other) {
	this.size = other.size;
	this.gridunit = other.gridunit;

	this.width = other.width;
	this.height = other.height;
	this.rooms = other.rooms;

	console.log(this.searchables);

	this.searchables = new Array(other.searchables.length);
	for (var i = 0; i < this.searchables.length; i++) {
		this.searchables[i] = new Searchable(Searchable.RUG);
		this.searchables[i].position = new Vector2(other.searchables[i].position.x, other.searchables[i].position.y);
	}	
	console.log(this.searchables);

	this.numPlayers = other.numPlayers;

	this.tiles = other.tiles;
}

World.prototype.generate = function() {
	var maxSize = 15;
	var minSize = 9;
	var radius = 10;

	var i = 0;
	var finalRooms = 0;
	var retries = this.numPlayers * 4;
	var rooms = this.numPlayers * 5;
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
			finalRooms++;
			var structureId = this.getStructureId();
			for (var j = 0; j < size.x; ++j) {
				for (var k = 0; k < size.y; ++k) {
					if (j == 0 || k == 0 || j == size.x - 1 || k == size.y - 1) { // NOTHING
						this.tiles[position.x + j][position.y + k] = new Tile(2);
					} else if (j == 1 || k == 1 || j == size.x - 2 || k == size.y - 2) { // WALL
						this.tiles[position.x + j][position.y + k] = new Tile(1);
						this.tiles[position.x + j][position.y + k].owner_id = structureId;	
					} else { // FLOOR
						this.tiles[position.x + j][position.y + k] = new Tile(0);	
						this.tiles[position.x + j][position.y + k].owner_id = structureId;	
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

	this.rooms.length = finalRooms;

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

		//this.connect(roomA, closestNeighbour);
		var connections = Math.ceil(Math.random() * 2);
		for (var i = 0; i < connections; ++i) {
			// Connect to random room
			var roomB = roomA;
			while (roomB == roomA) {
				roomB = this.rooms[Math.floor(Math.random() * this.rooms.length)];	
			}
			this.connect(roomA, roomB);
		}

		unconnectedRooms.splice(0, 1);
	}

	this.createObjects();
}

World.prototype.connect = function(roomA, roomB) {
	var xDir = Utility.sign(roomB.center.x - roomA.center.x);
	var yDir = Utility.sign(roomB.center.y - roomA.center.y);

	var structureId = this.getStructureId();
	for (var i = roomA.center.x; xDir != 0 && (xDir == -1 ? i >= roomB.center.x : i <= roomB.center.x); i += xDir) {
		if (this.tiles[i][roomA.center.y].id != 0) {
			this.tiles[i][roomA.center.y] = new Tile(0); // GROUND
			this.tiles[i][roomA.center.y].owner_id = structureId;	
		}
		if (this.tiles[i][roomA.center.y - 1].id == 2) {
			if (this.tiles[i][roomA.center.y - 2].id == 0) {
				this.tiles[i][roomA.center.y - 1] = new Tile(0); // GROUND
				this.tiles[i][roomA.center.y - 1].owner_id = structureId; 
			} else {
				this.tiles[i][roomA.center.y - 1] = new Tile(1); // WALL
				this.tiles[i][roomA.center.y - 1].owner_id = structureId; 
			}
		}
		if (this.tiles[i][roomA.center.y + 1].id == 2) {
			if (this.tiles[i][roomA.center.y + 2].id == 0) {
				this.tiles[i][roomA.center.y + 1] = new Tile(0); // GROUND	
				this.tiles[i][roomA.center.y + 1].owner_id = structureId; 	
			} else {
				this.tiles[i][roomA.center.y + 1] = new Tile(1); // WALL
				this.tiles[i][roomA.center.y + 1].owner_id = structureId; 
			}
		}
	}
	structureId = this.getStructureId();
	for (var i = roomA.center.y; yDir != 0 && (yDir == -1 ? i >= roomB.center.y : i <= roomB.center.y); i += yDir) {
		if (this.tiles[roomB.center.x][i].id != 0) {
			this.tiles[roomB.center.x][i] = new Tile(0); // GROUND	
			this.tiles[roomB.center.x][i].owner_id = structureId;	
		}
		if (this.tiles[roomB.center.x - 1][i].id == 2) {
			if (this.tiles[roomB.center.x - 2][i].id == 0) {
				this.tiles[roomB.center.x - 1][i] = new Tile(0); // GROUND	
				this.tiles[roomB.center.x - 1][i].owner_id = structureId; 	
			} else {
				this.tiles[roomB.center.x - 1][i] = new Tile(1); // WALL
				this.tiles[roomB.center.x - 1][i].owner_id = structureId; 
			}
		}
		if (this.tiles[roomB.center.x + 1][i].id == 2) {
			if (this.tiles[roomB.center.x + 2][i].id == 0) {
				this.tiles[roomB.center.x + 1][i] = new Tile(0); // GROUND		
				this.tiles[roomB.center.x + 1][i].owner_id = structureId; 
			} else {
				this.tiles[roomB.center.x + 1][i] = new Tile(1); // WALL
				this.tiles[roomB.center.x + 1][i].owner_id = structureId;
			}
		}
	}
}

World.prototype.createObjects = function() {
	console.log("create objects");
	// Create rugs
	var numRugs = 20;//Math.floor(Math.random() * 5 + 2);

	for (var i = 0; i < numRugs; ++i) {
		var rug = new Searchable(Searchable.RUG);

		var room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
		//this.toTileCoord(
		//*this.gridunit - rug.size.x
		rug.position = new Vector2(room.bounds.x + Math.floor(Math.random() * room.bounds.width),
			room.bounds.y + Math.floor(Math.random() * room.bounds.height)).scale(this.gridunit).add(rug.size.scale(1/2));
		this.searchables.push(rug);
	}

}

World.prototype.toTileCoord = function(position) {
	return new Vector2(Math.floor(position.x / this.gridunit), Math.floor(position.y / this.gridunit));
}

World.prototype.draw = function (canvas, ctx) {
	for (var i = 0; i < this.searchables.length; ++i) {
		console.log(this.searchables[i].position);
		this.searchables[i].render(canvas, ctx);
	}
}

World.prototype.getRandomSpawnPos = function() {
	var room = this.rooms[Math.floor(Math.random() * this.rooms.length)];

	return new Vector2(room.center.x*this.gridunit, room.center.y*this.gridunit);
}

World.prototype.getStructureId = function() {
	this.lastStructureId *= 2;
	return this.lastStructureId / 2;
}

module.exports = World;
