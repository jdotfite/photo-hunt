/**
 * Intro Screen Controller
 * Handles the title screen with high scores and game start
 */

class IntroScreen {
    constructor() {
        this.introScreen = document.getElementById('introScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.startBtn = document.getElementById('startGameBtn');
        this.scoresList = document.getElementById('highScoresList');
        this.onStart = null;
        
        this.init();
    }

    init() {
        // Populate high scores
        this.renderHighScores();
        
        // Start button click
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startGame());
        }
        
        // Touch anywhere to start (excluding the button itself for double-trigger prevention)
        if (this.introScreen) {
            this.introScreen.addEventListener('click', (e) => {
                // Start game on any click
                this.startGame();
            });
        }
        
        // Keyboard start
        document.addEventListener('keydown', (e) => {
            if (this.introScreen && !this.introScreen.classList.contains('hidden')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.startGame();
                }
            }
        });
    }

    renderHighScores() {
        if (!this.scoresList || !window.highScores) return;
        
        const scores = window.highScores.getScores();
        
        let html = '';
        for (let i = 0; i < 10; i++) {
            const score = scores[i];
            const rank = i + 1;
            const name = score ? score.name : '---';
            const points = score ? score.score.toLocaleString() : '0';
            
            // Add special styling for top 3
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-gold';
            else if (rank === 2) rankClass = 'rank-silver';
            else if (rank === 3) rankClass = 'rank-bronze';
            
            html += `
                <div class="score-row ${rankClass}">
                    <span class="score-rank">${rank}.</span>
                    <span class="score-name">${name}</span>
                    <span class="score-dots"></span>
                    <span class="score-points">${points}</span>
                </div>
            `;
        }
        
        this.scoresList.innerHTML = html;
    }

    startGame() {
        if (!this.introScreen || this.introScreen.classList.contains('hidden')) return;
        
        // Add exit animation
        this.introScreen.classList.add('intro-exit');
        
        // Wait for animation then hide and show game
        setTimeout(() => {
            this.introScreen.classList.add('hidden');
            this.introScreen.classList.remove('intro-exit');
            this.gameScreen.classList.remove('hidden');
            
            // Trigger game start callback
            if (this.onStart) {
                this.onStart();
            }
        }, 400);
    }

    show() {
        // Refresh high scores
        this.renderHighScores();
        
        // Show intro, hide game
        this.gameScreen.classList.add('hidden');
        this.introScreen.classList.remove('hidden');
        this.introScreen.classList.remove('intro-exit');
    }
}

// Create global instance
window.introScreen = new IntroScreen();
