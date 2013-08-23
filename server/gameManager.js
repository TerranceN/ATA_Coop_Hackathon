
var World = require("../common/world");
minPlayers = 2;
var io;

var gameManager = function (IOin) {
    this.state = 0;
    this.gameStart = 0;
    this.lastActive = Date.now();
    this.world = new World();
    this.gameID = 0;
    io = IOin;
};


gameManager.prototype.GAMEOVER = 0;
gameManager.prototype.WAITINGFORPLAYERS = 1;
gameManager.prototype.PREPARINGTOSTART = 2;
gameManager.prototype.STARTING = 3;
gameManager.prototype.RUNNING = 4;

gameManager.prototype.newGame = function ( players ){
    //count up number of players who want to play
    activeplayers = [];
    for (var x = 0; x < players.length; x++){
        if (players[x].nextGame){
            activeplayers.push(players[x]);
        }
    }
    console.log(activeplayers.length);
    
    if (activeplayers.length > minPlayers){
        if (this.state == this.PREPARINGTOSTART){
            //generate world and inform players
            console.log("generating world");
            this.world = new World(activeplayers.length);
            this.gameID++;
            io.sockets.emit('newgame', {'world': this.world, 'gameID':this.gameID});
            io.sockets.emit('gamemessage', {'message': 'Game initializing.'});

            //assign identities to players
            startidentity = 0;
            for (var x = 0; x < players.length; x++){
                players[x].alive = true;
                players[x].socket.leave('spectator');
                players[x].position = this.world.getRandomSpawnPos();
                players[x].identity = startidentity;
                players[x].role = 0;
                players[x].visitedStructures = 0;
                info = players[x].getIdentityInfo();
                console.log("init player ", players[x].id);
                players[x].socket.emit('gamemessage', {'message': "You are <span style='color:" + info['color'] + ";'>" + info['name'] + "</span>"});
                startidentity++;
            }

            //choose players to be assassins
            var tries = 0;
            var assassinCount = 0;
            numAssassin = Math.floor(activeplayers.length * 0.2);
            if(numAssassin < 1){ numAssassin = 1;}
            while (assassinCount < numAssassin && tries < 100){
                picked = Math.floor(Math.random() * activeplayers.length);
                if (activeplayers[picked].role != 1){
                    activeplayers[picked].role = 1;
                    activeplayers[picked].socket.emit('gamemessage', {'message': "You are an assassin this round!"});
                    assassinCount++;
                }
                tries++;
            }

            this.state = this.STARTING;
            this.gameStart = Date.now();
        } else if (this.state == this.WAITINGFORPLAYERS || this.state == this.GAMEOVER) {
            io.sockets.emit('gamemessage', {'message': 'Preparing to start new game...'});
            this.state = this.PREPARINGTOSTART;
            this.lastActive = Date.now();
        }
    } else {
    this.state = this.WAITINGFORPLAYERS;
    this.lastActive = Date.now();
    io.sockets.emit('gamemessage', {'message': "Waiting for more players..."})
    }
}

gameManager.prototype.checkState = function ( players ) {
    info = this.userCount( players );
    //console.log( this.state, info );
    if (this.state == this.RUNNING) {
        if (info['all'] == 0) {
            this.endGame("Game Over: Doesn't seem like anyone wants to play.");
        }
        if (info['player'] - info['assassin'] <= 0){
            this.endGame("Game Over: The assassins have killed everyone else.");
        }
        if (info['assassin'] == 0){
            this.endGame("Game Over: The assassins are dead. Everyone is safe.");
        }
    } else if (this.state == this.STARTING) {
        if (info['ready'] == info['player']) {
            this.state = this.RUNNING;
        }

    }
}

gameManager.prototype.userCount = function ( players ) {
    info = {'all':0, 'ready':0, 'player':0, 'assassin':0};
    for (var x=0; x<players.length; x++) {
        if (players[x].alive) {
            if (players[x].role == 1) {
                info['assassin']++;
            }
            info['player']++;
        }
        if (players[x].gameID == this.gameID) {
            info['ready']++;
        }
        info['all']++;
    }
    return info;
}

gameManager.prototype.endGame = function ( message ) {
    this.lastActive = Date.now();
    this.state = this.GAMEOVER;
    io.sockets.emit('gamemessage', {'message': message});
}

module.exports = gameManager;