class GeneHeatmap {
    constructor(game, x, y, data, label) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.xSize = 200;
        this.ySize = 100;
        this.label = label;
        this.data = data;

        this.maxBuckets = 20;
        this.maxCycles = 200;  // Increased to 200 generations
        this.currentCycle = 0;
        this.maxCount = 0;
    }

    draw(ctx) {
        if (!document.getElementById("graphs").checked) return;
        
        ctx.save();
        
        // Clear background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.xSize, this.ySize);

        // Draw heatmap
        if (this.data.length > 0) {
            const cellWidth = Math.ceil(this.xSize / this.maxCycles);
            const cellHeight = Math.ceil(this.ySize / this.maxBuckets);
            
            this.maxCount = Math.max(1, Math.max(...[].concat(...this.data)));

            // Draw each cell
            for (let cycleIdx = 0; cycleIdx < this.data.length; cycleIdx++) {
                const cycleData = this.data[cycleIdx];
                
                for (let bucketIdx = this.maxBuckets - 1; bucketIdx >= 0; bucketIdx--) {
                    const count = cycleData[bucketIdx];
                    
                    let intensity = 0;
                    if (count > 0) {
                        intensity = Math.min(255, Math.floor((count / this.maxCount) * 255));
                    }
                    
                    ctx.fillStyle = count > 0 ? 
                        `rgb(${255-intensity}, ${255-intensity}, 255)` : 
                        "#FFFFFF";
                    
                    ctx.fillRect(
                        this.x + (cycleIdx * cellWidth),
                        this.y + ((this.maxBuckets - 1 - bucketIdx) * cellHeight),
                        cellWidth,
                        cellHeight
                    );
                }
            }
        }

        // Draw border and title
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.xSize, this.ySize);
        
        ctx.fillStyle = "#000000";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.label, this.x + this.xSize / 2, this.y - 4);
        
        ctx.restore();
    }

    update() {
        this.currentCycle = this.data.length;
        if (this.currentCycle >= this.maxCycles) {
            // Instead of resetting, shift data to keep last 200 generations
            while (this.data.length > this.maxCycles) {
                this.data.shift();
            }
        }
    }

    reset() {
        this.data = [];
        this.maxCount = 0;
        this.currentCycle = 0;
    }

    addData(bucketCounts) {
        if (bucketCounts.length === this.maxBuckets) {
            this.data.push([...bucketCounts]);
            if (this.data.length > this.maxCycles) {
                this.data.shift();
            }
            this.update();
        }
    }
}
