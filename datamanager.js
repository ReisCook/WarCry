class DataManager {
    constructor(automata) {
        this.automata = automata;
        this.initData();
    }

    initData() {
        // Population graph data
        this.totalPop = [];

        // Gene data storage
        this.radiusData = {
            cohesion: [],
            alignment: [],
            separation: [],
            charge: [],
            flee: []
        };

        this.weightData = {
            cohesion: [],
            alignment: [],
            separation: [],
            charge: [],
            flee: []
        };

        // Initialize visualizations
        this.initializeVisualizations();
    }

    initializeVisualizations() {
        // Constants for positioning
        const graphHeight = 135;
        const graphSpacing = 25;
        const heatmapHeight = 100;
        const heatmapSpacing = 25;
        const startY = 25;  
        const leftX = 810;
        const rightX = 1020;

        // Initialize population graph
        this.populationGraph = new Graph(
            gameEngine, 
            leftX, 
            startY, 
            [this.totalPop], 
            "Warriors"
        );

        let currentY = startY + graphHeight + graphSpacing;

        // Initialize radius heatmaps (left column)
        this.radiusHeatmaps = {
            cohesion: new GeneHeatmap(gameEngine, leftX, currentY, 
                this.radiusData.cohesion, "Cohesion R"),
            alignment: new GeneHeatmap(gameEngine, leftX, 
                currentY + heatmapHeight + heatmapSpacing, 
                this.radiusData.alignment, "Align R"),
            separation: new GeneHeatmap(gameEngine, leftX, 
                currentY + (heatmapHeight + heatmapSpacing) * 2, 
                this.radiusData.separation, "Sep R"),
            charge: new GeneHeatmap(gameEngine, leftX, 
                currentY + (heatmapHeight + heatmapSpacing) * 3, 
                this.radiusData.charge, "Charge R"),
            flee: new GeneHeatmap(gameEngine, leftX, 
                currentY + (heatmapHeight + heatmapSpacing) * 4, 
                this.radiusData.flee, "Flee R")
        };

        // Initialize weight heatmaps (right column)
        this.weightHeatmaps = {
            cohesion: new GeneHeatmap(gameEngine, rightX, currentY, 
                this.weightData.cohesion, "Cohesion W"),
            alignment: new GeneHeatmap(gameEngine, rightX, 
                currentY + heatmapHeight + heatmapSpacing, 
                this.weightData.alignment, "Align W"),
            separation: new GeneHeatmap(gameEngine, rightX, 
                currentY + (heatmapHeight + heatmapSpacing) * 2, 
                this.weightData.separation, "Sep W"),
            charge: new GeneHeatmap(gameEngine, rightX, 
                currentY + (heatmapHeight + heatmapSpacing) * 3, 
                this.weightData.charge, "Charge W"),
            flee: new GeneHeatmap(gameEngine, rightX, 
                currentY + (heatmapHeight + heatmapSpacing) * 4, 
                this.weightData.flee, "Flee W")
        };
    }

    updateData() {
        // Get all warriors from all active battles
        let allWarriors = [];
        gameEngine.bandManager.activeBattles.forEach(battle => {
            allWarriors = allWarriors.concat(battle.entities);
        });
        
        // Update population count
        this.totalPop.push(allWarriors.length);
        if (this.totalPop.length > 200) {  // Keep last 200 generations
            this.totalPop.shift();
        }

        // Initialize bucket arrays
        const radiusBuckets = {
            cohesion: new Array(20).fill(0),
            alignment: new Array(20).fill(0),
            separation: new Array(20).fill(0),
            charge: new Array(20).fill(0),
            flee: new Array(20).fill(0)
        };

        const weightBuckets = {
            cohesion: new Array(20).fill(0),
            alignment: new Array(20).fill(0),
            separation: new Array(20).fill(0),
            charge: new Array(20).fill(0),
            flee: new Array(20).fill(0)
        };

        // Process each warrior's genes
        allWarriors.forEach(warrior => {
            // Process radius genes (0-4)
            this.processGene(warrior.genes[0].value, radiusBuckets.cohesion);
            this.processGene(warrior.genes[1].value, radiusBuckets.alignment);
            this.processGene(warrior.genes[2].value, radiusBuckets.separation);
            this.processGene(warrior.genes[3].value, radiusBuckets.charge);
            this.processGene(warrior.genes[4].value, radiusBuckets.flee);

            // Process weight genes (5-9)
            this.processGene(warrior.genes[5].value, weightBuckets.cohesion);
            this.processGene(warrior.genes[6].value, weightBuckets.alignment);
            this.processGene(warrior.genes[7].value, weightBuckets.separation);
            this.processGene(warrior.genes[8].value, weightBuckets.charge);
            this.processGene(warrior.genes[9].value, weightBuckets.flee);
        });

        // Update heatmap data
        this.updateHeatmapData(radiusBuckets, weightBuckets);
    }

    processGene(value, bucketArray) {
        let bucket = Math.floor(value * 20);
        if (bucket >= 20) bucket = 19;
        bucketArray[bucket]++;
    }

    updateHeatmapData(radiusBuckets, weightBuckets) {
        // Update radius data
        this.radiusData.cohesion.push(radiusBuckets.cohesion);
        this.radiusData.alignment.push(radiusBuckets.alignment);
        this.radiusData.separation.push(radiusBuckets.separation);
        this.radiusData.charge.push(radiusBuckets.charge);
        this.radiusData.flee.push(radiusBuckets.flee);

        // Update weight data
        this.weightData.cohesion.push(weightBuckets.cohesion);
        this.weightData.alignment.push(weightBuckets.alignment);
        this.weightData.separation.push(weightBuckets.separation);
        this.weightData.charge.push(weightBuckets.charge);
        this.weightData.flee.push(weightBuckets.flee);

        // Keep only last 200 generations for all data arrays
        Object.values(this.radiusData).forEach(dataArray => {
            while (dataArray.length > 200) {
                dataArray.shift();
            }
        });

        Object.values(this.weightData).forEach(dataArray => {
            while (dataArray.length > 200) {
                dataArray.shift();
            }
        });
    }

    draw(ctx) {
        if (!document.getElementById("graphs").checked) return;

        const selectedTab = document.querySelector('input[name="graphType"]:checked').value;

        if (selectedTab === "population") {
            this.populationGraph.draw(ctx);
        } else {
            Object.values(this.radiusHeatmaps).forEach(heatmap => heatmap.draw(ctx));
            Object.values(this.weightHeatmaps).forEach(heatmap => heatmap.draw(ctx));
        }
    }

    update() {
        Object.values(this.radiusHeatmaps).forEach(heatmap => heatmap.update());
        Object.values(this.weightHeatmaps).forEach(heatmap => heatmap.update());
    }

    logData() {
        const data = {
            db: PARAMS.db,
            collection: PARAMS.collection,
            data: {
                PARAMS: PARAMS,
                totalPop: this.totalPop,
                radiusData: this.radiusData,
                weightData: this.weightData
            }
        };

        if (socket) socket.emit("insert", data);
    }
}