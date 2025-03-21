var PARAMS = {
    // world
    worldWidth: 800,
    worldHeight: 800,
    
    // bands
    numBands: 50,
    bandSize: 50,

    // warrior
    warriorHealth: 5,
    warriorMaxSpeed: 50,
    warriorMaxForce: 5,
    warriorRadius: 5,

    // vocalization
    signalModel: "closest", // "closest" or "average"
    vocalCooldown: 1, // seconds between vocalizations

    // game engine
    updatesPerDraw: 1,
    reportingPeriod: 1,
    maxGenerations: 1000,

    // evolution
    mutationRate: 0.1,

    // database
    db: "warcryDB",
    collection: "test"
};

function loadParameters() {
    // Update UI to match current parameters
    document.getElementById('worldWidth').value = PARAMS.worldWidth;
    document.getElementById('worldHeight').value = PARAMS.worldHeight;
    document.getElementById('bandSize').value = PARAMS.bandSize;
    document.getElementById('warriorHealth').value = PARAMS.warriorHealth;
    document.getElementById('warriorMaxSpeed').value = PARAMS.warriorMaxSpeed;
    document.getElementById('warriorMaxForce').value = PARAMS.warriorMaxForce;
    document.getElementById('warriorRadius').value = PARAMS.warriorRadius;
    document.getElementById('updatesPerDraw').value = PARAMS.updatesPerDraw;
    document.getElementById('updatesPerDrawValue').textContent = PARAMS.updatesPerDraw;
    
    // Set signal model radio button
    if (document.getElementById('signalModelClosest')) {
        document.getElementById('signalModelClosest').checked = (PARAMS.signalModel === "closest");
    }
    if (document.getElementById('signalModelAverage')) {
        document.getElementById('signalModelAverage').checked = (PARAMS.signalModel === "average");
    }
};