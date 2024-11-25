class CombatManager {
    constructor() {
        this.battles = new Map(); // Map to track stats internally (not for display)
        this.reset();
    }

    reset() {
        this.battles.clear();
        
        // Initialize battle stats for tracking only
        for (let i = 0; i < PARAMS.numBands / 2; i++) {
            this.battles.set(i, {
                teamOne: {
                    alive: PARAMS.bandSize,
                    dead: 0,
                    fleeing: 0
                },
                teamTwo: {
                    alive: PARAMS.bandSize,
                    dead: 0,
                    fleeing: 0
                }
            });
        }
    }

    flee(team, battleId) {
        const battle = this.battles.get(battleId);
        if (!battle) return;

        if (team) {
            battle.teamOne.fleeing++;
            battle.teamOne.alive--;
        } else {
            battle.teamTwo.fleeing++;
            battle.teamTwo.alive--;
        }
    }

    dead(team, battleId) {
        const battle = this.battles.get(battleId);
        if (!battle) return;

        if (team) {
            battle.teamOne.dead++;
            battle.teamOne.alive--;
        } else {
            battle.teamTwo.dead++;
            battle.teamTwo.alive--;
        }
    }

    update() {
        // No central update needed - each battle handles its own combat
    }
    
    draw(ctx) {
        // Removed all drawing - stats are tracked internally only
    }
}