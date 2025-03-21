class Warrior {
    constructor(other) {
        this.radius = PARAMS.warriorRadius;
        this.health = PARAMS.warriorHealth;
        this.maxSpeed = PARAMS.warriorMaxSpeed;
        this.maxForce = PARAMS.warriorMaxForce;
        this.battleId = 0;

        // Real coordinates in worldWidth x worldHeight space
        this.x = 0;
        this.y = 0;

        this.genes = [];
        // Use the genes from `other` if defined, otherwise generate default genes
        for (let i = 0; i < 15; i++) {
            this.genes.push(new RealGene(other?.genes[i] || { value: Math.random() }));
        }

        // visual radiuses
        this.cohesionRadius = this.genes[0].value * 500;
        this.alignmentRadius = this.genes[1].value * 500;
        this.separationRadius = this.genes[2].value * 500;
        this.chargeRadius = this.genes[3].value * 500;
        this.fleeRadius = this.genes[4].value * 500;

        // movement weights
        this.cohesionWeight = this.genes[5].value * 10;
        this.alignmentWeight = this.genes[6].value * 10;
        this.separationWeight = this.genes[7].value * 10;
        this.chargeWeight = this.genes[8].value * 10;
        this.fleeWeight = this.genes[9].value * 10;

        // vocalization parameters - reduced from 500 to 200
        this.vocalizationRadius = this.genes[11].value * 200;
        this.vocalizationProbability = this.genes[12].value;
        this.signalInterpretation = Math.round(this.genes[14].value); // binary 0 or 1

        this.accelerationScale = 1;
        this.target = null;
        this.fleeing = false;
        this.aggression = this.genes[10].value;
        
        // Vocalization properties
        this.isVocalizing = false;
        this.currentSignal = 0; // 0 or 1
        this.lastVocalizationTime = 0;
        this.vocalizationCooldown = 1; // seconds between vocalizations
        this.receivedSignals = []; // Array to store signals received from other warriors
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
        const dist = distance(this, other);
        const minDist = this.radius + other.radius;
        const overlap = minDist - dist;
        
        return {
            hasCollision: dist < minDist,
            overlap: overlap
        };
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
        for(let i = 0; i < this.genes.length; i++) {
            this.genes[i].mutate();
        }
    }

    reset(team, battleId = 0) {
        this.team = team;
        this.battleId = battleId;
        this.health = PARAMS.warriorHealth; // Use current parameter value
        this.target = null;
        this.fleeing = false;
        this.color = this.team ? "Red" : "Blue";
        this.fleecolor = this.team ? "Pink" : "Lightblue";
        this.isVocalizing = false;
        this.lastVocalizationTime = 0;
        this.receivedSignals = [];

        // Spawn in worldWidth x worldHeight space
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

    // New methods for vocalization
    tryVocalize() {
        // Check if enough time has passed since last vocalization
        const currentTime = gameEngine.timer.gameTime;
        if (currentTime - this.lastVocalizationTime < this.vocalizationCooldown) {
            return;
        }

        // Decide whether to vocalize based on probability
        if (Math.random() > this.vocalizationProbability) {
            return;
        }

        // Set the signal based on current behavior (fleeing or charging)
        this.currentSignal = this.fleeing ? 0 : 1;
        
        // If signal interpretation is 1, invert the signal
        if (this.signalInterpretation === 1) {
            this.currentSignal = 1 - this.currentSignal;
        }

        this.isVocalizing = true;
        this.lastVocalizationTime = currentTime;

        // Track vocalization metrics
        if (gameEngine.vocalManager) {
            gameEngine.vocalManager.trackVocalization(this.team, this.battleId, this.currentSignal);
        }
    }

    stopVocalizing() {
        this.isVocalizing = false;
    }

    receiveSignal(signal, distance, signaler) {
        // Store the received signal with its distance and the signaler
        this.receivedSignals.push({
            signal: signal,
            distance: distance,
            signaler: signaler
        });
    }

    processSignals() {
        if (this.receivedSignals.length === 0) return null;

        let signalToFollow;
        
        // Choose signal processing model based on parameters
        if (PARAMS.signalModel === "closest") {
            // Find the closest signal
            let closestSignal = this.receivedSignals.reduce((closest, current) => {
                return (current.distance < closest.distance) ? current : closest;
            }, { distance: Infinity });
            
            signalToFollow = closestSignal.signal;
        } else {
            // Average all signals
            let signalSum = this.receivedSignals.reduce((sum, current) => sum + current.signal, 0);
            let averageSignal = signalSum / this.receivedSignals.length;
            signalToFollow = (averageSignal >= 0.5) ? 1 : 0;
        }

        // Convert signal to action based on interpretation
        if (this.signalInterpretation === 1) {
            signalToFollow = 1 - signalToFollow;
        }

        // Clear received signals for next update
        this.receivedSignals = [];
        
        return signalToFollow;
    }
    
    update() {    
        var cohesionCount = 0;
        var alignmentCount = 0;
        
        var cohesion = { x: 0, y: 0 };
        var alignment = { x: 0, y: 0 };
        var separation = { x: 0, y: 0 };
        var charge = { x: 0, y: 0 };
    
        const battle = gameEngine.bandManager.activeBattles[this.battleId];
        if (!battle) return;
        
        const battleEntities = battle.entities;
        this.target = null;
    
        // Try to vocalize based on current state
        if (this.fleeing || this.target) {
            this.tryVocalize();
        } else {
            this.stopVocalizing();
        }

        for (var i = 0; i < battleEntities.length; i++) {
            var ent = battleEntities[i];
            if (ent === this) continue;
    
            var dist = distance(this, ent);
            var collisionResult = this.collide(ent);
    
            // Check for incoming signals from team members
            if (this.team === ent.team && ent.isVocalizing && dist <= ent.vocalizationRadius) {
                this.receiveSignal(ent.currentSignal, dist, ent);
            }

            if (collisionResult.hasCollision) {
                // Calculate collision normal
                const normalX = this.x - ent.x;
                const normalY = this.y - ent.y;
                
                // Normalize the collision vector
                const normalLength = Math.sqrt(normalX * normalX + normalY * normalY);
                const unitNormalX = normalX / normalLength;
                const unitNormalY = normalY / normalLength;
    
                // Calculate movement amount (half the overlap)
                const moveAmount = collisionResult.overlap / 2;
    
                // Move this warrior away from collision
                this.x += unitNormalX * moveAmount;
                this.y += unitNormalY * moveAmount;
    
                // Move other warrior away from collision
                ent.x -= unitNormalX * moveAmount;
                ent.y -= unitNormalY * moveAmount;
    
                // Apply damage if warriors are on different teams
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
    
        // Process received signals

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

        // Draw vocalization circle if warrior is vocalizing and display option is enabled
        if (this.isVocalizing && document.getElementById("showVocalizations").checked) {
            // FIX: Use consistent scaling for vocalization radius
            const displayWidth = PARAMS.worldWidth / 5;
            const vocalRadius = this.vocalizationRadius * displayWidth / PARAMS.worldWidth;
            
            ctx.beginPath();
            ctx.strokeStyle = this.currentSignal === 0 ? "rgba(0, 0, 255, 0.2)" : "rgba(255, 0, 0, 0.2)";
            ctx.arc(display.x, display.y, vocalRadius, 0, Math.PI * 2, false);
            ctx.stroke();
            
            // Draw speech bubble indicator
            ctx.beginPath();
            ctx.fillStyle = this.currentSignal === 0 ? "rgba(0, 0, 255, 0.8)" : "rgba(255, 0, 0, 0.8)";
            ctx.arc(display.x, display.y - display.radius * 2, display.radius * 0.7, 0, Math.PI * 2, false);
            ctx.fill();
        }

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
