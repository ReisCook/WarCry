var PARAMS = {
    // world
    worldWidth: 800,
    worldHeight: 800,
    
    // bands
    numBands: 50,
    bandSize: 50,

    // game engine
    updatesPerDraw: 1,
    reportingPeriod: 1,  // How often to update data visualization
    maxGenerations: 1000,

    // database
    db: "warcryDB",
    collection: "test"
};

function loadParameters() {
    console.log(PARAMS);
};

const runs = [
];