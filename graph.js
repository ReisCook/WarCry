class Graph {
    constructor(game, x, y, data, label) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.data = data;
        this.label = label;
        this.xSize = 350;
        this.ySize = 135;
        this.ctx = game.ctx;
        this.colors = ["#4A90E2"];  // Blue for data lines
        this.maxVal = 0;
        this.fontSize = 12;
        this.fontFamily = 'Arial';
    }

    draw(ctx) {
        if (!document.getElementById("graphs").checked) return;
        
        this.updateMax();
        ctx.save();
        
        // Draw background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.xSize, this.ySize);
        
        // Draw grid
        this.drawGrid(ctx);
        
        // Draw data lines
        if (this.data[0].length > 1) {
            this.drawDataLines(ctx);
        }

        // Draw border and title
        this.drawBorder(ctx);
        this.drawTitle(ctx);
        
        ctx.restore();
    }

    drawGrid(ctx) {
        ctx.strokeStyle = "#EEEEEE";
        ctx.lineWidth = 0.5;

        // Draw vertical grid lines
        for (let i = 1; i < 10; i++) {
            const x = this.x + (this.xSize / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, this.y);
            ctx.lineTo(x, this.y + this.ySize);
            ctx.stroke();
        }

        // Draw horizontal grid lines
        for (let i = 1; i < 5; i++) {
            const y = this.y + (this.ySize / 5) * i;
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.xSize, y);
            ctx.stroke();
        }
    }

    drawDataLines(ctx) {
        ctx.save();
        for (let j = 0; j < this.data.length; j++) {
            const data = this.data[j];
            
            ctx.strokeStyle = this.colors[j];
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            let xPos = this.x;
            let yPos = data.length > this.xSize ? 
                this.y + this.ySize - Math.floor(data[data.length - this.xSize] / this.maxVal * this.ySize) :
                this.y + this.ySize - Math.floor(data[0] / this.maxVal * this.ySize);
            
            ctx.moveTo(xPos, yPos);
            
            const length = Math.min(data.length, this.xSize);
            for (let i = 1; i < length; i++) {
                const index = data.length > this.xSize ?
                    data.length - this.xSize - 1 + i : i;
                xPos++;
                yPos = this.y + this.ySize - Math.floor(data[index] / this.maxVal * this.ySize);
                yPos = Math.max(this.y, Math.min(this.y + this.ySize, yPos));
                
                ctx.lineTo(xPos, yPos);
            }
            ctx.stroke();
            
            // Draw current value
            const currentValue = data[data.length - 1];
            ctx.fillStyle = "#000000";
            ctx.textAlign = "left";
            ctx.fillText(currentValue.toFixed(0), this.x + this.xSize + 5, yPos);
        }
        ctx.restore();
    }

    drawBorder(ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.xSize, this.ySize);
    }

    drawTitle(ctx) {
        ctx.fillStyle = "#000000";
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = "center";
        ctx.fillText(this.label, this.x + this.xSize / 2, this.y - 5);
    }

    updateMax() {
        // Find maximum value across all data series
        this.maxVal = Math.max(1, Math.max(...[].concat(...this.data)));
        
        // Round up to a nice number
        const pow10 = Math.pow(10, Math.floor(Math.log10(this.maxVal)));
        this.maxVal = Math.ceil(this.maxVal / pow10) * pow10;
    }

    update() {
        // No update logic needed
    }

    // Helper method to add new data point
    addDataPoint(seriesIndex, value) {
        if (seriesIndex < this.data.length) {
            this.data[seriesIndex].push(value);
            this.updateMax();
        }
    }

    // Helper method to clear data
    clearData() {
        this.data = this.data.map(() => []);
        this.maxVal = 0;
    }
}