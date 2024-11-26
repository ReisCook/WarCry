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

        // Set up managers
        this.bandManager = gameEngine.bandManager;
        this.combatManager = gameEngine.combatManager;

        // Reset tracking
        this.generation = 0;
        this.lastCycleCount = 0;
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
    }
}