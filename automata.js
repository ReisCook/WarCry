class Automata {
    constructor() {
        gameEngine.board = this;
        this.x = 0;
        this.y = 0;
        this.generation = 0;
        this.lastCycleCount = 0;  // Track last cycle count to detect changes

        loadParameters();
        this.buildAutomata();
    }

    buildAutomata() {
        // Reset entities and graphs
        gameEngine.entities = [];
        gameEngine.addEntity(this);
        gameEngine.graphs = [];

        // Initialize data manager for tracking evolution
        this.dataMan = new DataManager(this);
        gameEngine.addGraph(this.dataMan);

        // Initialize managers
        gameEngine.bandManager = new BandManager();
        gameEngine.combatManager = new CombatManager();
        gameEngine.vocalManager = new VocalizationManager(); // Added vocalization manager

        // Set up managers
        this.bandManager = gameEngine.bandManager;
        this.combatManager = gameEngine.combatManager;
        this.vocalManager = gameEngine.vocalManager; // Added reference

        // Reset tracking
        this.generation = 0;
        this.lastCycleCount = 0;

        // Adjust canvas size based on world parameters
        const canvas = document.getElementById('gameWorld');
        canvas.width = PARAMS.worldWidth * 2;  // Double size to accommodate graphs
        canvas.height = PARAMS.worldHeight;
        
        // Reset context after canvas resize
        gameEngine.ctx = canvas.getContext('2d');
    }

    reset() {
        loadParameters();
        this.buildAutomata();
    }

    update() {
        // Check if the cycle count has increased
        if (this.bandManager.cycleCount > this.lastCycleCount) {
            this.generation = this.bandManager.cycleCount;
            this.lastCycleCount = this.bandManager.cycleCount;
            console.log("Cycle complete, generation: " + this.generation);
        }
    }

    draw(ctx) {
        // Only draw simulation elements if visuals are checked
        if (document.getElementById("visuals").checked) {
            const displayWidth = PARAMS.worldWidth / 5;
            const displayHeight = PARAMS.worldHeight / 5;

            // Draw battle area grid
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;

            // Draw vertical grid lines
            for (let i = 0; i <= 5; i++) {
                ctx.beginPath();
                ctx.moveTo(i * displayWidth, 0);
                ctx.lineTo(i * displayWidth, PARAMS.worldHeight);
                ctx.stroke();
            }

            // Draw horizontal grid lines
            for (let i = 0; i <= 5; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * displayHeight);
                ctx.lineTo(PARAMS.worldWidth, i * displayHeight);
                ctx.stroke();
            }

            // Draw battle area labels
            ctx.font = "10px Arial";
            ctx.fillStyle = "#000000";
            ctx.textAlign = "left";
            for (let i = 0; i < 25; i++) {
                const row = Math.floor(i / 5);
                const col = i % 5;
                ctx.fillText(`Battle ${i + 1}`, 
                    col * displayWidth + 5, 
                    row * displayHeight + 15);
            }

            // Draw inner border for each battle area
            ctx.lineWidth = 1;
            for (let i = 0; i < 25; i++) {
                const row = Math.floor(i / 5);
                const col = i % 5;
                ctx.strokeStyle = "#666666";
                ctx.strokeRect(
                    col * displayWidth + 2,
                    row * displayHeight + 2,
                    displayWidth - 4,
                    displayHeight - 4
                );
            }
        }

        // Draw info text in top right
        ctx.font = "12px Arial";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "right";
        ctx.fillText(`Generation: ${this.generation}`, PARAMS.worldWidth - 10, 20);
        ctx.fillText(`Total Battles: ${this.bandManager.activeBattles.length}`, PARAMS.worldWidth - 10, 40);
        ctx.fillText(`Active Battles: ${this.bandManager.activeBattles.filter(b => !b.complete).length}`, PARAMS.worldWidth - 10, 60);
        
        // Added vocalization stats display (removed signal follow rate)
        if (this.vocalManager) {
            const stats = this.vocalManager.getAggregateStats();
            ctx.fillText(`Total Signals: ${stats.totalSignals}`, PARAMS.worldWidth - 10, 80);
            ctx.fillText(`Flee/Charge Ratio: ${(stats.fleeSignals / (stats.totalSignals || 1)).toFixed(2)}`, PARAMS.worldWidth - 10, 100);
        }
    }
}