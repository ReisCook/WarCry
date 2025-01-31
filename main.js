var gameEngine = new GameEngine();

var ASSET_MANAGER = new AssetManager();

var socket = null;
if (window.io !== undefined) {
    console.log("Database connected!");

    socket = io.connect('http://73.19.38.112:8888');

    socket.on("connect", function () {
        databaseConnected();
    });
    
    socket.on("disconnect", function () {
        databaseDisconnected();
    });

    socket.addEventListener("log", console.log);
}

function reset() {
    // Reset will trigger loadParameters() which updates UI
    gameEngine.board.reset();
}

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    gameEngine.init(ctx);
    
    // Create initial automata
    new Automata();

    // Initialize UI with current parameters
    loadParameters();

    gameEngine.start();
});
