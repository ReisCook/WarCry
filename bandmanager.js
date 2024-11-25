class BandManager {
    // Define helper methods before using them in constructor
    presetGenes() {
        let genes = [];
        genes.push(new RealGene({ value: 0 }));     // cohesionRadius
        genes.push(new RealGene({ value: 0 }));     // alignmentRadius
        genes.push(new RealGene({ value: 0 }));     // separationRadius
        genes.push(new RealGene({ value: 0.25 }));  // chargeRadius
        genes.push(new RealGene({ value: 0.25 }));  // fleeRadius
        genes.push(new RealGene({ value: 0 }));     // cohesionWeight
        genes.push(new RealGene({ value: 0 }));     // alignmentWeight
        genes.push(new RealGene({ value: 0 }));     // separationWeight
        genes.push(new RealGene({ value: 1 }));     // chargeWeight
        genes.push(new RealGene({ value: 1 }));     // fleeWeight
        return genes;
    }
    
    zeroGenes() {
        let genes = [];
        for(let i = 0; i < 10; i++) {
            genes.push(new RealGene({ value: 0 }));
        }
        return genes;
    }
    
    randomGenes() {
        let genes = [];
        for(let i = 0; i < 10; i++) {
            genes.push(new RealGene({ value: Math.random() }));
        }
        return genes;
    }

    createBand(loadStyle) {
        let band = [];
        let warrior;
        
        switch(loadStyle) {
            case 0: // Zero genes
                warrior = new Warrior({ genes: this.zGenes });
                break;
            case 1: // Random genes
                warrior = new Warrior({ genes: this.randomGenes() });
                break;
            default: // Preset genes
                warrior = new Warrior({ genes: this.pGenes });
        }
        
        warrior.mutate();
        for (let i = 0; i < PARAMS.bandSize; i++) {
            let newWarrior = new Warrior(warrior);
            newWarrior.mutate();
            band.push(newWarrior);
        }
    
        return band;
    }

    constructor() {
        this.bands = [];
        this.bandIndex = 0;
        this.cycleCount = 0;
        
        // Array to track all active battles
        this.activeBattles = [];

        // Initialize preset genes
        this.zGenes = this.zeroGenes();
        this.pGenes = this.presetGenes();

        // Create initial bands
        for(let i = 0; i < PARAMS.numBands; i++) {
            this.bands.push(this.createBand(2));
        }

        // Start first cycle of battles
        this.initiateCycle();
    }

    initiateCycle() {
        this.activeBattles = [];
        let totalPairs = PARAMS.numBands / 2;  // 25 pairs

        // Create all battles for this cycle
        for(let i = 0; i < totalPairs; i++) {
            let battle = {
                band1: this.bands[i * 2],
                band2: this.bands[i * 2 + 1],
                entities: [],
                complete: false,
                id: i
            };
            
            // Initialize warriors for this battle
            this.initializeBattle(battle);
            this.activeBattles.push(battle);
        }

        console.log(`Initiated cycle ${this.cycleCount} with ${this.activeBattles.length} battles`);
    }

    initializeBattle(battle) {
        battle.entities = [];
        
        // Add warriors from band1 (team true)
        battle.band1.forEach(warrior => {
            let clone = new Warrior(warrior);
            clone.reset(true, battle.id);
            battle.entities.push(clone);
        });
        
        // Add warriors from band2 (team false)
        battle.band2.forEach(warrior => {
            let clone = new Warrior(warrior);
            clone.reset(false, battle.id);
            battle.entities.push(clone);
        });
    }

    isBattleComplete(battle) {
        if (battle.entities.length === 0) return true;
        
        const team = battle.entities[0].team;
        return battle.entities.every(entity => entity.team === team);
    }

    isCycleComplete() {
        return this.activeBattles.every(battle => battle.complete);
    }

    update() {
        // Update all active battles
        this.activeBattles.forEach(battle => {
            if (!battle.complete) {
                // Update all warriors in this battle
                battle.entities.forEach(warrior => {
                    if (!warrior.removeFromWorld) {
                        warrior.update();
                    }
                });

                // Remove defeated warriors
                battle.entities = battle.entities.filter(warrior => !warrior.removeFromWorld);

                // Check if battle is complete
                if (this.isBattleComplete(battle)) {
                    battle.complete = true;
                    this.processBattleResults(battle);
                }
            }
        });

        // Check if all battles in the cycle are complete
        if (this.isCycleComplete()) {
            console.log(`Cycle ${this.cycleCount} complete. Processing data and starting next cycle.`);
            
            // Update data visualization after full cycle
            if (gameEngine.board && gameEngine.board.dataMan) {
                console.log("Collecting end-of-cycle data");
                gameEngine.board.dataMan.updateData();
            }

            // Reset combat manager
            gameEngine.combatManager.reset();

            // Increment cycle counter
            this.cycleCount++;

            // Start next cycle
            this.initiateCycle();
        }
    }

    processBattleResults(battle) {
        // Separate survivors by team
        const survivingTeam1 = battle.entities.filter(w => w.team === true);
        const survivingTeam2 = battle.entities.filter(w => w.team === false);

        // Generate new bands based on survivors
        const newBand1 = this.generateNewBand(battle.band1, survivingTeam1, true);
        const newBand2 = this.generateNewBand(battle.band2, survivingTeam2, false);

        // Update bands array
        const index1 = this.bands.indexOf(battle.band1);
        const index2 = this.bands.indexOf(battle.band2);
        this.bands[index1] = newBand1;
        this.bands[index2] = newBand2;
    }

    generateNewBand(oldBand, survivingWarriors, team) {
        let newBand = [];
        let numSurvivors = survivingWarriors.length;

        if (numSurvivors === 0) {
            // Generate new random warriors if no survivors
            for (let i = 0; i < PARAMS.bandSize; i++) {
                let warrior = new Warrior();
                warrior.mutate();
                warrior.team = team;
                newBand.push(warrior);
            }
            return newBand;
        }

        // Clone survivors
        survivingWarriors.forEach(warrior => {
            let clone = new Warrior(warrior);
            clone.team = team;
            newBand.push(clone);
        });

        // Generate remaining warriors through crossover
        while (newBand.length < PARAMS.bandSize) {
            let parent1 = survivingWarriors[Math.floor(Math.random() * numSurvivors)];
            let parent2 = survivingWarriors[Math.floor(Math.random() * numSurvivors)];
            let child = this.crossoverWarriors(parent1, parent2);
            child.team = team;
            newBand.push(child);
        }

        return newBand;
    }

    crossoverWarriors(parent1, parent2) {
        let child = new Warrior();
        for (let i = 0; i < parent1.genes.length; i++) {
            let gene1 = parent1.genes[i];
            let gene2 = parent2.genes[i];
            let childGene = new RealGene();
            childGene.value = Math.random() < 0.5 ? gene1.value : gene2.value;
            childGene.mutate();
            child.genes[i] = childGene;
        }
        return child;
    }

    draw(ctx) {
        // Draw all warriors from all active battles
        this.activeBattles.forEach(battle => {
            battle.entities.forEach(warrior => {
                if (!warrior.removeFromWorld) {
                    warrior.draw(ctx);
                }
            });
        });
    }
}