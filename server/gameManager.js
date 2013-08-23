
var World = require("../common/world");
minPlayers = 3;
var io;

var gameManager = function (IOin) {
    this.state = 0;
    this.gamePlayers = [];
    this.gameAssassins = [];
    this.gameStart = 0;
    this.lastActive = Date.now();
    this.world = new World();
    io = IOin;
};


gameManager.prototype.GAMEOVER = 0;
gameManager.prototype.WAITINGFORPLAYERS = 1;
gameManager.prototype.RUNNING = 2;

gameManager.prototype.newGame = function ( players ){
    //count up number of players who want to play
    activeplayers = [];
    for (player in players){
        if (player.nextGame){
            activeplayers.push(player);
        }
    }
    
    if (activeplayers.length > minPlayers){
        //generate world and inform players
        this.world = new World(activeplayers.length);
        io.sockets.emit('newgame', {'world': world});
        io.sockets.emit('gamemessage', {'message': 'New game started!'});
        this.gameplayers = activeplayers;

        //assign identities to players
        startidentity = 0;
        for (player in activeplayers){
            player.active = true;
            player.socket.leave('spectator');
            player.position = World.getSpawn();
            player.identity = startidentity;
            info = player.getIdentityInfo();
            player.socket.emit('gamemessage', {'message': "You are <span style='color:" + data['color'] + ";'>" + data['name'] + "</span>"});
        }

        //choose players to be assasins
        tries = 0;
        this.assassinCount = 0;
        numAssassin = int(activeplayers.length * 0.2);
        if(numAssassin < 1){ numAssassin = 1;}
        while (this.gameAssassins.length < numAssassin && tries < 100){
            picked = int(Math.random() * activeplayers.length);
            if (activeplayers[picked].role != 1){
                activeplayers[picked].role = 1;
                activeplayers[picked].socket.emit('gamemessage', {'message': "You are an assassin this round!"});
                this.gameAssassins.push(activeplayers[picked]);
            }
            tries++;
        }

        this.state = this.RUNNING;
        this.gameStart = Date.now();
    } else {
    this.state = this.WAITINGFORPLAYERS;
    this.lastActive = Date.now();
    io.sockets.emit('gamemessage', {'message': "Waiting for more players..."})
    }
}

gameManager.prototype.checkState = function () {
    if (this.state == this.RUNNING) {
        if (this.gamePlayers.length - this.gameAssassins.length <= 0){
            this.endGame("Game Over: The assassin's have killed everyone else.")
        }
        // add winstate for non-assassins
    }
}

gameManager.prototype.endGame = function ( message ) {
    this.state == this.GAMEOVER;
    this.lastActive = Date.now();
    io.sockets.emit('gamemessage', {'message': message});
}

module.exports = gameManager;