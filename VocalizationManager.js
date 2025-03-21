class VocalizationManager {
    constructor() {
        this.vocalizations = new Map(); // Map to track vocalization stats
        this.reset();
    }

    reset() {
        this.vocalizations.clear();
        
        // Initialize vocalization stats for tracking
        for (let i = 0; i < PARAMS.numBands / 2; i++) {
            this.vocalizations.set(i, {
                teamOne: {
                    fleeSignals: 0,
                    chargeSignals: 0,
                    totalSignals: 0
                },
                teamTwo: {
                    fleeSignals: 0,
                    chargeSignals: 0,
                    totalSignals: 0
                }
            });
        }
    }

    trackVocalization(team, battleId, signal) {
        const battle = this.vocalizations.get(battleId);
        if (!battle) return;

        const teamStats = team ? battle.teamOne : battle.teamTwo;
        
        if (signal === 0) { // Flee signal
            teamStats.fleeSignals++;
        } else { // Charge signal
            teamStats.chargeSignals++;
        }
        
        teamStats.totalSignals++;
    }

    getAggregateStats() {
        let totalStats = {
            fleeSignals: 0,
            chargeSignals: 0,
            totalSignals: 0
        };

        this.vocalizations.forEach(battle => {
            totalStats.fleeSignals += battle.teamOne.fleeSignals + battle.teamTwo.fleeSignals;
            totalStats.chargeSignals += battle.teamOne.chargeSignals + battle.teamTwo.chargeSignals;
            totalStats.totalSignals += battle.teamOne.totalSignals + battle.teamTwo.totalSignals;
        });

        return totalStats;
    }

    update() {
        // No central update needed - stats are tracked through method calls
    }
    
    draw(ctx) {
        // No drawing needed - stats are tracked internally
    }
}