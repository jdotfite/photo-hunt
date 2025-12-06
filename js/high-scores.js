/**
 * High Scores Manager - Modular & Reusable
 * Can be used for any game by passing a unique gameId
 * 
 * Usage:
 *   const scores = new HighScores('myGameId');
 *   if (scores.isHighScore(playerScore)) {
 *       const rank = scores.getRank(playerScore);
 *       // Show name entry UI...
 *       scores.addScore(playerName, playerScore);
 *   }
 */
class HighScores {
    /**
     * @param {string} gameId - Unique identifier for the game (used in localStorage key)
     * @param {object} options - Configuration options
     * @param {number} options.maxScores - Maximum number of scores to keep (default: 10)
     * @param {array} options.defaultScores - Custom default scores (optional)
     */
    constructor(gameId = 'defaultGame', options = {}) {
        this.gameId = gameId;
        this.maxScores = options.maxScores || 10;
        this.storageKey = `highScores_${gameId}`;
        this.defaultScores = options.defaultScores || null;
        this.scores = this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : this.getDefaultScores();
        } catch (e) {
            console.error('Error loading high scores:', e);
            return this.getDefaultScores();
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (e) {
            console.error('Error saving high scores:', e);
        }
    }

    getDefaultScores() {
        // Use custom defaults if provided
        if (this.defaultScores) {
            return [...this.defaultScores];
        }
        
        // Default arcade-style high scores
        const defaults = [];
        const names = ['ACE', 'PRO', 'MAX', 'ZAP', 'RAD', 'JET', 'SKY', 'REX', 'VIC', 'SAM'];
        const baseScore = 50000;
        
        for (let i = 0; i < this.maxScores; i++) {
            defaults.push({
                name: names[i] || `P${i + 1}`,
                score: Math.max(1000, baseScore - (i * 5000)),
                date: Date.now()
            });
        }
        
        return defaults;
    }

    /**
     * Check if a score qualifies for the high score list
     * @param {number} score - The score to check
     * @returns {boolean} - True if score would make the list
     */
    isHighScore(score) {
        if (score <= 0) return false;
        if (this.scores.length < this.maxScores) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    /**
     * Get the rank a score would achieve (1-based)
     * @param {number} score - The score to check
     * @returns {number} - Rank (1-10), or 0 if not a high score
     */
    getRank(score) {
        if (score <= 0) return 0;
        
        for (let i = 0; i < this.scores.length; i++) {
            if (score > this.scores[i].score) {
                return i + 1;
            }
        }
        
        if (this.scores.length < this.maxScores) {
            return this.scores.length + 1;
        }
        
        return 0;
    }

    /**
     * Add a new high score entry
     * @param {string} name - Player name (max 12 chars, will be uppercased)
     * @param {number} score - The score achieved
     * @returns {number} - The final rank of the new score
     */
    addScore(name, score) {
        const entry = {
            name: (name || 'PLAYER').toUpperCase().substring(0, 12).trim(),
            score: score,
            date: Date.now()
        };

        // Insert into correct position
        const rank = this.getRank(score);
        if (rank > 0) {
            this.scores.splice(rank - 1, 0, entry);
            this.scores = this.scores.slice(0, this.maxScores);
            this.save();
        }

        return rank;
    }

    /**
     * Get all scores
     * @returns {array} - Copy of the scores array
     */
    getScores() {
        return [...this.scores];
    }

    /**
     * Get the top/highest score entry
     * @returns {object|null} - Top score entry {name, score, date} or null
     */
    getTopScore() {
        return this.scores.length > 0 ? { ...this.scores[0] } : null;
    }

    /**
     * Get a specific score by rank
     * @param {number} rank - 1-based rank
     * @returns {object|null} - Score entry or null
     */
    getScoreByRank(rank) {
        return this.scores[rank - 1] || null;
    }

    /**
     * Clear all scores and reset to defaults
     */
    reset() {
        this.scores = this.getDefaultScores();
        this.save();
    }

    /**
     * Clear all scores completely (empty list)
     */
    clearAll() {
        this.scores = [];
        this.save();
    }

    /**
     * Export scores as JSON string
     * @returns {string} - JSON representation
     */
    export() {
        return JSON.stringify({
            gameId: this.gameId,
            scores: this.scores,
            exportDate: Date.now()
        });
    }

    /**
     * Import scores from JSON string
     * @param {string} json - JSON string from export()
     * @returns {boolean} - Success
     */
    import(json) {
        try {
            const data = JSON.parse(json);
            if (data.scores && Array.isArray(data.scores)) {
                this.scores = data.scores.slice(0, this.maxScores);
                this.save();
                return true;
            }
        } catch (e) {
            console.error('Error importing scores:', e);
        }
        return false;
    }
}

// Create global instance for Photo Hunt
window.highScores = new HighScores('photoHunt', {
    maxScores: 8,
    defaultScores: [
        { name: 'Player', score: 0, date: Date.now() },
        { name: 'Player', score: 0, date: Date.now() },
        { name: 'Player', score: 0, date: Date.now() },
        { name: 'Player', score: 0, date: Date.now() },
        { name: 'Player', score: 0, date: Date.now() },
        { name: 'Player', score: 0, date: Date.now() },
        { name: 'Player', score: 0, date: Date.now() },
        { name: 'Player', score: 0, date: Date.now() }
    ]
});

// Reset to defaults on first load (clears old localStorage data for testing)
// Remove this line in production to persist scores between sessions
window.highScores.reset();

// Export class for use in other games
window.HighScores = HighScores;
