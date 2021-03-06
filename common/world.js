var Vector2 = require('./vector2');
var Rectangle = require('./rectangle');
var Room = require('./room');
var Utility = require('./utility');
var Tile = require('./tile');
var Searchable = require('./searchable');
var Item = require('./item');

var World = function( numPlayers ) {
    this.lastObjectId = 0;
	if (typeof(numPlayers) == 'undefined') {
		numPlayers = 5;
	}
	this.size = new Vector2( numPlayers * 12, numPlayers * 12 );
	this.gridunit = 32;
	this.lastRoomId = 1;
	this.lastHallId = 1;
	this.numPlayers = numPlayers;

	this.searchables = new Array();
	this.width = this.size.x * this.gridunit;
	this.height = this.size.y * this.gridunit;
	this.rooms = new Array();
    this.objectiveRoomIdx = -1;

	this.tiles = new Array(this.size.x);

	for (var i = 0; i < this.size.x; ++i) {
		this.tiles[i] = new Array(this.size.y);
		for (var j = 0; j < this.size.y; ++j) {
			this.tiles[i][j] = new Tile(Tile.VOID, 0);
		}
	}

	this.generate();
}

World.prototype.getNextObjectId = function () {
    this.lastObjectId++;
    return this.lastObjectId;
}

World.prototype.getObjectById = function (objID) {
	for (var i = 0; i < this.searchables.length; i++) {
		if (this.searchables[i].id == objID) {
			return this.searchables[i];	
		}
	}
	return null;
}

World.prototype.getSpawn = function(){
	return Vector2(10,10);
}

World.prototype.activeObjective = function (player) {
    return this.rooms[this.objectiveRoomIdx].bounds.contains(player.position.scale(1/this.gridunit));
}

World.prototype.make = function(other) {
	this.size = other.size;
	this.gridunit = other.gridunit;

	this.width = other.width;
	this.height = other.height;
	this.rooms = other.rooms;

	this.searchables = new Array(other.searchables.length);
	for (var i = 0; i < this.searchables.length; i++) {
		this.searchables[i] = new Searchable(other.searchables[i].id, new Vector2(other.searchables[i].position.x, other.searchables[i].position.y), other.searchables[i].angle, other.searchables[i].type);
		this.searchables[i].make(other.searchables[i]);
	}	

	this.numPlayers = other.numPlayers;

	this.tiles = other.tiles;
    
    this.objectiveRoomIdx = other.objectiveRoomIdx;
}

World.prototype.generate = function() {
	var maxSize = 13;
	var minSize = 8;

	var i = 0;
	var finalRooms = 0;
	var retries = this.numPlayers * 15;
	var rooms = Math.min(this.numPlayers * 6, 31);
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
			var structureId = this.getNextRoomId();
			room.structureId = structureId;
			//var tileType = Math.floor(Math.random() * 2);
			for (var j = 0; j < size.x; ++j) {
				for (var k = 0; k < size.y; ++k) {
					if (j == 0 || k == 0 || j == size.x - 1 || k == size.y - 1) {
						this.tiles[position.x + j][position.y + k] = new Tile(Tile.WALL, 0);
						this.tiles[position.x + j][position.y + k].owner_id = structureId;	
					} else { // FLOOR
						this.tiles[position.x + j][position.y + k] = new Tile(Tile.ROOM, 0);	
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

	this.objectiveRoomIdx = Utility.randIntInRange(0, this.rooms.length);

	this.connectRooms();
}

World.prototype.connectRooms = function() {
	var unconnectedRooms = new Array();
	for (var i = 0; i < this.rooms.length; ++i) {
		unconnectedRooms.push(this.rooms[i]);
	}

	var poop = 0;
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
			poop += 2;
		}

		unconnectedRooms.splice(0, 1);

		if (poop >= 31) {
			break;
		}
	}

	// Remove Unconnected rooms so users can't spawn in them
	for (var i = 0; i < unconnectedRooms.length; ++i) {
		unconnectedRooms[i].center = this.rooms[0].center;
	}

	this.secondPass();
}

World.prototype.connect = function(roomA, roomB) {
	var xDir = Utility.sign(roomB.center.x - roomA.center.x);
	var yDir = Utility.sign(roomB.center.y - roomA.center.y);

	var earlyBreak = false;
	var structureId = this.getNextHallId();
	for (var i = roomA.center.x; xDir != 0 && (xDir == -1 ? i >= roomB.center.x : i <= roomB.center.x); i += xDir) {
		if (this.tiles[i][roomA.center.y].id != 0 && this.tiles[i][roomA.center.y].id != 3) {
			this.tiles[i][roomA.center.y] = new Tile(Tile.CORRIDOR, 1);
			this.tiles[i][roomA.center.y].owner_id = structureId;	
		} //else if (this.tiles[i][roomA.center.y].owner_id != roomA.structureId) {
			//earlyBreak = true;
		//}
		if (this.tiles[i][roomA.center.y - 1].id != 0 && this.tiles[i][roomA.center.y - 1].id != 3) {
			this.tiles[i][roomA.center.y - 1] = new Tile(Tile.CORRIDOR, 1);
			this.tiles[i][roomA.center.y - 1].owner_id = structureId;	
		} //else if (this.tiles[i][roomA.center.y - 1].owner_id != roomA.structureId) {
			//earlyBreak = true;
		//}
		if (this.tiles[i][roomA.center.y - 2].id == 2) {
			if (this.tiles[i][roomA.center.y - 3].id == 0) {
				this.tiles[i][roomA.center.y - 2] = new Tile(Tile.CORRIDOR, 1);
				this.tiles[i][roomA.center.y - 2].owner_id = structureId; 
			} else {
				this.tiles[i][roomA.center.y - 2] = new Tile(Tile.WALL, 1);
				this.tiles[i][roomA.center.y - 2].owner_id = structureId; 
			}
		}
		if (this.tiles[i][roomA.center.y + 1].id == 2) {
			if (this.tiles[i][roomA.center.y + 2].id == 0) {
				this.tiles[i][roomA.center.y + 1] = new Tile(Tile.CORRIDOR, 1);
				this.tiles[i][roomA.center.y + 1].owner_id = structureId; 	
			} else {
				this.tiles[i][roomA.center.y + 1] = new Tile(Tile.WALL, 1);
				this.tiles[i][roomA.center.y + 1].owner_id = structureId; 
			}
		}
		if (earlyBreak) {
			break;
		}
	}
	if (!earlyBreak) {
		structureId = this.getNextHallId();
		for (var i = roomA.center.y; yDir != 0 && (yDir == -1 ? i >= roomB.center.y : i <= roomB.center.y); i += yDir) {
			if (this.tiles[roomB.center.x][i].id != 0 && this.tiles[roomB.center.x][i].id != 3) {
				this.tiles[roomB.center.x][i] = new Tile(Tile.CORRIDOR, 1);	
				this.tiles[roomB.center.x][i].owner_id = structureId;	
			} //else if (this.tiles[roomB.center.x][i].owner_id != roomA.structureId) {
				//earlyBreak = true;
			//}
			if (this.tiles[roomB.center.x - 1][i].id != 0 && this.tiles[roomB.center.x - 1][i].id != 3) {
				this.tiles[roomB.center.x - 1][i] = new Tile(Tile.CORRIDOR, 1);
				this.tiles[roomB.center.x - 1][i].owner_id = structureId;	
			} //else if (this.tiles[roomB.center.x - 1][i].owner_id != roomA.structureId) {
				//earlyBreak = true;
			//}
			if (this.tiles[roomB.center.x - 2][i].id == 2) {
				if (this.tiles[roomB.center.x - 3][i].id == 0) {
					this.tiles[roomB.center.x - 2][i] = new Tile(Tile.CORRIDOR, 1);	
					this.tiles[roomB.center.x - 2][i].owner_id = structureId; 	
				} else {
					this.tiles[roomB.center.x - 2][i] = new Tile(Tile.WALL, 1);
					this.tiles[roomB.center.x - 2][i].owner_id = structureId; 
				}
			}
			if (this.tiles[roomB.center.x + 1][i].id == 2) {
				if (this.tiles[roomB.center.x + 2][i].id == 0) {
					this.tiles[roomB.center.x + 1][i] = new Tile(Tile.CORRIDOR, 1);		
					this.tiles[roomB.center.x + 1][i].owner_id = structureId; 
				} else {
					this.tiles[roomB.center.x + 1][i] = new Tile(Tile.WALL, 1);
					this.tiles[roomB.center.x + 1][i].owner_id = structureId;
				}
			}
			if (earlyBreak) {
				break;
			}
		}
	}
}

World.prototype.secondPass = function() {

	for (var i = 1; i < this.size.x - 1; ++i) {
		for (var j = 1; j < this.size.y - 1; ++j) {
			// Make sure floor tiles have proper wall tiles
			if (this.tiles[i][j].id == 0 || this.tiles[i][j].id == 3) {
				if (this.tiles[i - 1][j].id == 2) {
					this.tiles[i - 1][j].id = 1;
				}
				if (this.tiles[i + 1][j].id == 2) {
					this.tiles[i + 1][j].id = 1;
				}
				if (this.tiles[i][j - 1].id == 2) {
					this.tiles[i][j - 1].id = 1;
				}
				if (this.tiles[i][j + 1].id == 2) {
					this.tiles[i][j + 1].id = 1;
				}
				if (this.tiles[i - 1][j - 1].id == 2) {
					this.tiles[i - 1][j - 1].id = 1;
				}
				if (this.tiles[i + 1][j + 1].id == 2) {
					this.tiles[i + 1][j + 1].id = 1;
				}
				if (this.tiles[i - 1][j + 1].id == 2) {
					this.tiles[i - 1][j + 1].id = 1;
				}
				if (this.tiles[i + 1][j - 1].id == 2) {
					this.tiles[i + 1][j - 1].id = 1;
				}
			} else if (this.tiles[i][j] == 1) { // Remove useless walls
				if ((this.tiles[i - 1][j].id == 0 && this.tiles[i + 1][j].id == 0) ||
					(this.tiles[i][j - 1].id == 0 && this.tiles[i][j + 1].id == 0)) {
					this.tiles[i][j].id = 0;
					console.log("remove dat shit");
				}
			}
		}
	}

	this.createObjects();
}

World.prototype.createObjects = function() {
	console.log("create objects");
    world = this;
	// Create rugs
	var numRugs = 25;//Math.floor(Math.random() * 5 + 2);

	for (var i = 0; i < numRugs; ++i) {
		var room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
		var searchable;
		
		var type = Math.floor(Math.random() * 3);
		var angle = (Math.random() - 0.5) * Math.PI / 6; // items can be slightly askew
		if (type == 0) {
			searchable = new Searchable(this.getNextObjectId(), new Vector2(0, 0), angle, Searchable.CRATE, 3000);
		} else {
			searchable = new Searchable(this.getNextObjectId(), new Vector2(0, 0), angle, Searchable.TABLE, 3000);
		//} else {
			//searchable = new Searchable(this.getNextObjectId(), new Vector2(0, 0), 0, Searchable.RUG, 3000);
		}

		var pos = new Vector2(room.bounds.x + 1 + Math.floor(Math.random() * (room.bounds.width - 2 - Math.ceil(searchable.size.x / this.gridunit))),
			room.bounds.y + 1 + Math.floor(Math.random() * (room.bounds.height - 2 - Math.ceil(searchable.size.y / this.gridunit)))).scale(this.gridunit);

		searchable.position = searchable.position.add(searchable.size.scale(1/2)).add(pos);

		this.searchables.push(searchable);
	}
}

World.prototype.toTileCoord = function(position) {
	return new Vector2(Math.floor(position.x / this.gridunit), Math.floor(position.y / this.gridunit));
}

World.prototype.draw = function (canvas, ctx) {
	for (var i = 0; i < this.searchables.length; ++i) {
		this.searchables[i].render(canvas, ctx);
	}
}

World.prototype.getRandomSpawnPos = function() {
	var room = this.rooms[Math.floor(Math.random() * this.rooms.length)];

	return new Vector2(room.center.x*this.gridunit, room.center.y*this.gridunit);
}

World.prototype.getNextRoomId = function() {
	this.lastRoomId *= 2;
	return this.lastRoomId / 2;
}

World.prototype.getNextHallId = function() {
	this.lastHallId *= 2;
	return this.lastHallId / 2;
}

module.exports = World;
