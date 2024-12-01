class Warrior {
    constructor(other) {
        this.radius = 5;
        this.health = 10;
        this.maxSpeed = 50;
        this.maxForce = 5;
        this.battleId = 0;

        // Real coordinates in 800x800 space
        this.x = 0;
        this.y = 0;

        this.genes = [];
        // Use the genes from `other` if defined, otherwise generate default genes
        for (let i = 0; i < 11; i++) {
            this.genes.push(new RealGene(other?.genes[i] || { value: Math.random() }));
        }

        // visual radiuses
        this.cohesionRadius = this.genes[0].value * 200;
        this.alignmentRadius = this.genes[1].value * 200;
        this.separationRadius = this.genes[2].value * 200;
        this.chargeRadius = this.genes[3].value * 200;
        this.fleeRadius = this.genes[4].value * 200;

        // movement weights
        this.cohesionWeight = this.genes[5].value * 10;
        this.alignmentWeight = this.genes[6].value * 10;
        this.separationWeight = this.genes[7].value * 10;
        this.chargeWeight = this.genes[8].value * 10;
        this.fleeWeight = this.genes[9].value * 10;

        this.accelerationScale = 1;
        this.target = null;
        this.fleeing = false;
        this.aggression = this.genes[10].value;
    }

    getDisplayCoords() {
        // Convert real coordinates to display coordinates
        const displayWidth = PARAMS.worldWidth / 5;
        const displayHeight = PARAMS.worldHeight / 5;
        const row = Math.floor(this.battleId / 5);
        const col = this.battleId % 5;
        
        return {
            x: (col * displayWidth) + (this.x * displayWidth / PARAMS.worldWidth),
            y: (row * displayHeight) + (this.y * displayHeight / PARAMS.worldHeight),
            radius: this.radius * displayWidth / PARAMS.worldWidth
        };
    }

    collide(other) {
        return distance(this, other) < this.radius + other.radius;
    }

    collideLeft() {
        return (this.x + this.radius) < 0;
    }

    collideRight() {
        return (this.x - this.radius) > PARAMS.worldWidth;
    }

    collideTop() {
        return (this.y + this.radius) < 0;
    }

    collideBottom() {
        return (this.y - this.radius) > PARAMS.worldHeight;
    }

    fled() {
        return this.collideBottom() || this.collideLeft() || this.collideTop() || this.collideRight();
    }

    mutate() {
        for(let i = 0; i < 10; i++) {
            this.genes[i].mutate();
        }
    }

    reset(team, battleId = 0) {
        this.team = team;
        this.battleId = battleId;
        this.health = 10;
        this.target = null;
        this.fleeing = false;
        this.color = this.team ? "Red" : "Blue";
        this.fleecolor = this.team ? "Pink" : "Lightblue";

        // Spawn in full 800x800 space
        this.x = Math.random() * PARAMS.worldWidth / 16;
        if(this.team) this.x = PARAMS.worldWidth - this.x;
        this.y = Math.random() * PARAMS.worldHeight;

        this.velocity = {
            x: this.team ? -Math.random() * this.maxSpeed : Math.random() * this.maxSpeed,
            y: Math.random() * this.maxSpeed / 2 * randomSign()
        };
        limit(this.velocity, this.maxSpeed);
    }

    hit() {
        this.health--;
        if(this.health === 0) {
            this.removeFromWorld = true;
            gameEngine.combatManager.dead(this.team, this.battleId);
        }
        if(this.willFlee() && !this.fleeing) {
            this.fleeing = true;
            gameEngine.combatManager.flee(this.team, this.battleId);
        }
    }

    willFlee() {
        return Math.random() > this.aggression;
    }

    update() {    
        var cohesionCount = 0;
        var alignmentCount = 0;
        
        var cohesion = { x: 0, y: 0 };
        var alignment = { x: 0, y: 0 };
        var separation = { x: 0, y: 0 };
        var charge = { x: 0, y: 0 };
    
        // Only interact with warriors from the same battle
        const battle = gameEngine.bandManager.activeBattles[this.battleId];
        if (!battle) return;
        
        const battleEntities = battle.entities;
        this.target = null;

        for (var i = 0; i < battleEntities.length; i++) {
            var ent = battleEntities[i];
            if (ent === this) continue;

            var dist = distance(this, ent);

            if (this.collide(ent)) {
                if (this.team !== ent.team) {
                    this.hit();
                    ent.hit();
                }
            }

            if (this.team === ent.team) {
                if (dist < this.cohesionRadius) {
                    cohesionCount++;
                    cohesion.x += ent.x;
                    cohesion.y += ent.y;
                }

                if (dist < this.alignmentRadius) {
                    alignmentCount++;
                    alignment.x += ent.velocity.x;
                    alignment.y += ent.velocity.y;
                }

                if (dist < this.separationRadius) {
                    separation.x += (this.x - ent.x) / dist / dist;
                    separation.y += (this.y - ent.y) / dist / dist;
                }
            } else {
                if (!this.fleeing && dist < this.chargeRadius) {
                    if (!this.target || distance(this, this.target) > dist) {
                        this.target = ent;
                    }
                } else if(this.fleeing && dist < this.fleeRadius) {
                    if (!this.target || distance(this, this.target) > dist) {
                        this.target = ent;
                    }
                }
            }
        }
    
        if (cohesionCount > 0) {
            cohesion.x = (cohesion.x / cohesionCount) - this.x;
            cohesion.y = (cohesion.y / cohesionCount) - this.y;
        }

        if (alignmentCount > 0) {
            alignment.x = (alignment.x / alignmentCount) - this.velocity.x;
            alignment.y = (alignment.y / alignmentCount) - this.velocity.y;
        }

        if (this.target) {
            if(!this.fleeing) {
                charge.x = this.target.x - this.x;
                charge.y = this.target.y - this.y;
            } else {
                charge.x = this.x - this.target.x;
                charge.y = this.y - this.target.y;        
            }
        }

        normalize(cohesion);
        normalize(alignment);
        normalize(separation);
        normalize(charge);

        var steeringVector = this.fleeing ? 
        {
            x: (charge.x * this.fleeWeight),
            y: (charge.y * this.fleeWeight)
        } :
        {
            x: (cohesion.x * this.cohesionWeight) + (alignment.x * this.alignmentWeight) + 
               (separation.x * this.separationWeight) + (charge.x * this.chargeWeight),
            y: (cohesion.y * this.cohesionWeight) + (alignment.y * this.alignmentWeight) + 
               (separation.y * this.separationWeight) + (charge.y * this.chargeWeight)
        };
    
        normalize(steeringVector);
        steeringVector.x *= this.accelerationScale;
        limit(steeringVector, this.maxForce);

        this.velocity.x += steeringVector.x;
        this.velocity.y += steeringVector.y;
        limit(this.velocity, this.maxSpeed);

        // Update position in full 800x800 space
        this.x += this.velocity.x * gameEngine.clockTick;
        this.y += this.velocity.y * gameEngine.clockTick;

        if(this.fled()) this.removeFromWorld = true;
    }
    
    draw(ctx) {
        // Get scaled display coordinates
        const display = this.getDisplayCoords();
        
        ctx.beginPath();
        ctx.fillStyle = this.fleeing ? this.fleecolor : this.color;
        ctx.arc(display.x, display.y, display.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();

        var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "Black";
            ctx.moveTo(display.x, display.y);
            ctx.lineTo(
                display.x + (this.velocity.x / speed * display.radius),
                display.y + (this.velocity.y / speed * display.radius)
            );
            ctx.stroke();
            ctx.closePath();
        }
    }
}
