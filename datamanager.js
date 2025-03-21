class DataManager {
    constructor(board) {
        this.board = board;
        this.geneLabels = [
            "Cohesion Radius", "Alignment Radius", "Separation Radius", 
            "Charge Radius", "Flee Radius", "Cohesion Weight", 
            "Alignment Weight", "Separation Weight", "Charge Weight", 
            "Flee Weight", "Aggression", "Vocalization Radius", 
            "Vocalization Probability", "Signal Interpretation"
        ];
        this.geneData = [];
        
        // Initialize heatmaps for gene distribution visualization
        this.heatmaps = [];
        for (let i = 0; i < this.geneLabels.length; i++) {
            // Create empty array for gene data
            this.geneData[i] = [];
            
            // Calculate position for heatmap
            const numCols = 3;
            const row = Math.floor(i / numCols);
            const col = i % numCols;
            
            const xPos = PARAMS.worldWidth + (col * 220) + 50;
            const yPos = (row * 120) + 50;
            
            // Create heatmap with proper parameters
            this.heatmaps.push(new GeneHeatmap(gameEngine, xPos, yPos, this.geneData[i], this.geneLabels[i]));
        }
        
        // Population tracking
        this.populationData = {
            generations: [],
            totalWarriors: [],
            fleeRates: [],
            vocalizations: {
                totalSignals: [],
                fleeSignals: [],
                chargeSignals: []
            }
        };
        
        // Initialize with empty data
        this.updateData();
    }
    
    updateData() {
        if (!gameEngine.bandManager) return;
        
        // Get all warriors from all bands
        let allWarriors = [];
        gameEngine.bandManager.bands.forEach(band => {
            allWarriors = allWarriors.concat(band);
        });
        
        // Skip if no warriors
        if (allWarriors.length === 0) return;
        
        // Track generation
        const generation = gameEngine.board.generation;
        this.populationData.generations.push(generation);
        
        // Track population
        this.populationData.totalWarriors.push(allWarriors.length);
        
        // Calculate flee rate
        let fleeing = 0;
        allWarriors.forEach(warrior => {
            if (warrior.fleeing) fleeing++;
        });
        this.populationData.fleeRates.push(fleeing / allWarriors.length);
        
        // Track vocalization stats if vocalization manager exists
        if (gameEngine.vocalManager) {
            const vocalStats = gameEngine.vocalManager.getAggregateStats();
            this.populationData.vocalizations.totalSignals.push(vocalStats.totalSignals);
            this.populationData.vocalizations.fleeSignals.push(vocalStats.fleeSignals);
            this.populationData.vocalizations.chargeSignals.push(vocalStats.chargeSignals);
        }
        
        // Update gene distributions
        for (let i = 0; i < this.geneLabels.length; i++) {
            // Create histogram of gene values
            let histogram = new Array(20).fill(0);
            
            allWarriors.forEach(warrior => {
                if (i < warrior.genes.length) {
                    // Scale gene value to 0-19 range
                    let binIndex = Math.min(19, Math.max(0, Math.floor(warrior.genes[i].value * 20)));
                    histogram[binIndex]++;
                }
            });
            
            // Add data to the appropriate heatmap
            this.heatmaps[i].addData(histogram);
        }
        
        // Limit data to most recent 200 generations
        const maxDataPoints = 200;
        if (this.populationData.generations.length > maxDataPoints) {
            this.populationData.generations = this.populationData.generations.slice(-maxDataPoints);
            this.populationData.totalWarriors = this.populationData.totalWarriors.slice(-maxDataPoints);
            this.populationData.fleeRates = this.populationData.fleeRates.slice(-maxDataPoints);
            this.populationData.vocalizations.totalSignals = this.populationData.vocalizations.totalSignals.slice(-maxDataPoints);
            this.populationData.vocalizations.fleeSignals = this.populationData.vocalizations.fleeSignals.slice(-maxDataPoints);
            this.populationData.vocalizations.chargeSignals = this.populationData.vocalizations.chargeSignals.slice(-maxDataPoints);
        }
    }
    
    draw(ctx) {
        const graphType = document.querySelector('input[name="graphType"]:checked').value;
        
        if (graphType === "genes") {
            // Draw gene heatmaps
            for (let i = 0; i < this.heatmaps.length; i++) {
                this.heatmaps[i].draw(ctx);
            }
        } else if (graphType === "population") {
            // Draw population graphs
            ctx.save();
            
            // Draw total warriors graph
            this.drawGraph(ctx, 
                PARAMS.worldWidth + 50, 50, 
                400, 200,
                this.populationData.generations, this.populationData.totalWarriors,
                "Total Warriors", "Generation", "Count", "rgb(0, 150, 0)");
                
            // Draw flee rate graph
            this.drawGraph(ctx, 
                PARAMS.worldWidth + 50, 300, 
                400, 200,
                this.populationData.generations, this.populationData.fleeRates,
                "Flee Rate", "Generation", "Rate", "rgb(200, 0, 0)");
                
            ctx.restore();
        } else if (graphType === "vocalization") {
            // Draw vocalization graphs
            ctx.save();
            
            // Draw total signals graph
            this.drawGraph(ctx, 
                PARAMS.worldWidth + 50, 50, 
                400, 150,
                this.populationData.generations, this.populationData.vocalizations.totalSignals,
                "Total Signals", "Generation", "Count", "rgb(0, 100, 200)");
                
            // Draw flee/charge signal ratio graph
            const fleeChargeRatio = [];
            for (let i = 0; i < this.populationData.vocalizations.fleeSignals.length; i++) {
                const total = this.populationData.vocalizations.fleeSignals[i] + 
                             this.populationData.vocalizations.chargeSignals[i];
                fleeChargeRatio.push(total > 0 ? 
                    this.populationData.vocalizations.fleeSignals[i] / total : 0);
            }
            
            this.drawGraph(ctx, 
                PARAMS.worldWidth + 50, 250, 
                400, 150,
                this.populationData.generations, fleeChargeRatio,
                "Flee/Total Signal Ratio", "Generation", "Ratio", "rgb(150, 0, 150)");
                
            ctx.restore();
        }
    }
    
    drawGraph(ctx, x, y, width, height, xData, yData, title, xLabel, yLabel, color) {
        if (xData.length < 2 || yData.length < 2) return;
        
        // Draw background
        ctx.fillStyle = "rgba(240, 240, 240, 0.8)";
        ctx.fillRect(x, y, width, height);
        
        // Draw border
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Draw title
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(title, x + width/2, y - 5);
        
        // Draw axes labels
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(xLabel, x + width/2, y + height + 15);
        
        ctx.save();
        ctx.translate(x - 15, y + height/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
        
        // Find min/max values
        const minX = Math.min(...xData);
        const maxX = Math.max(...xData);
        const minY = 0; // Always start at 0 for these graphs
        const maxY = Math.max(...yData) * 1.1; // Add 10% padding
        
        // Draw data line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < xData.length; i++) {
            // Scale data points to fit graph dimensions
            const xPos = x + ((xData[i] - minX) / (maxX - minX || 1)) * width;
            const yPos = y + height - ((yData[i] - minY) / (maxY - minY || 1)) * height;
            
            if (i === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }
        
        ctx.stroke();
        
        // Draw Y-axis scale
        ctx.fillStyle = "black";
        ctx.font = "10px Arial";
        ctx.textAlign = "right";
        
        for (let i = 0; i <= 5; i++) {
            const value = (maxY - minY) * (i/5) + minY;
            const yPos = y + height - (i/5) * height;
            ctx.fillText(value.toFixed(1), x - 5, yPos + 3);
            
            // Draw horizontal grid line
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.moveTo(x, yPos);
            ctx.lineTo(x + width, yPos);
            ctx.stroke();
        }
        
        // Draw X-axis scale
        ctx.textAlign = "center";
        
        for (let i = 0; i <= 5; i++) {
            const value = (maxX - minX) * (i/5) + minX;
            const xPos = x + (i/5) * width;
            ctx.fillText(Math.round(value).toString(), xPos, y + height + 12);
            
            // Draw vertical grid line
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }
    }
}