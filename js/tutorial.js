/**
 * Interactive Tutorial System
 * Guides players through the game with step-by-step highlights
 */

class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.spotlight = null;
        this.tooltip = null;
        this.pulseRing = null;
        
        // Tutorial steps - each highlights a different UI element
        this.steps = [
            {
                element: null, // Full screen intro
                title: "WELCOME TO PHOTO HUNT!",
                text: "Let's learn how to play. Two images will appear side by side - your goal is to find the differences between them!",
                position: "center",
                showImages: false
            },
            {
                element: '.image-container',
                title: "SPOT THE DIFFERENCES",
                text: "Tap anywhere you see a difference. The same spot will be marked on both images when you find one!",
                position: "top",
                showImages: true,
                highlightDifference: true
            },
            {
                element: '.round-score',
                title: "EARN POINTS",
                text: "This shows points for the current difference. Find it quickly before the points count down!",
                position: "left"
            },
            {
                element: '.pellet-container',
                title: "WATCH THE TIMER",
                text: "These pellets show your remaining time. When they run out, the game is over!",
                position: "bottom"
            },
            {
                element: '.total-score',
                title: "YOUR TOTAL SCORE",
                text: "Points from all differences you find add up here. Try to beat the high score!",
                position: "bottom"
            },
            {
                element: '.differences-found',
                title: "TRACK YOUR PROGRESS",
                text: "See how many differences you've found and how many remain in the current round.",
                position: "bottom"
            },
            {
                element: '.hints-container',
                title: "USE HINTS WISELY",
                text: "Stuck? Tap a hint button to reveal a difference. Unused hints give bonus points at the end of each round!",
                position: "bottom"
            },
            {
                element: '.round-badge',
                title: "ADVANCE THROUGH ROUNDS",
                text: "Find all differences to move to the next round. Each round has new images and challenges!",
                position: "bottom"
            },
            {
                element: null,
                title: "YOU'RE READY!",
                text: "Now it's your turn! Tap anywhere to start playing. Good luck!",
                position: "center",
                isFinal: true
            }
        ];
        
        this.createOverlayElements();
        this.bindEvents();
    }
    
    createOverlayElements() {
        // Main overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-spotlight"></div>
            <div class="tutorial-pulse-ring"></div>
            <div class="tutorial-tooltip">
                <div class="tutorial-step-indicator"></div>
                <h3 class="tutorial-title"></h3>
                <p class="tutorial-text"></p>
                <div class="tutorial-buttons">
                    <button class="tutorial-btn tutorial-skip">SKIP</button>
                    <button class="tutorial-btn tutorial-back">← BACK</button>
                    <button class="tutorial-btn tutorial-next">NEXT →</button>
                </div>
            </div>
            <div class="tutorial-tap-hint">
                <div class="tap-circle"></div>
                <span>TAP HERE!</span>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        this.spotlight = this.overlay.querySelector('.tutorial-spotlight');
        this.pulseRing = this.overlay.querySelector('.tutorial-pulse-ring');
        this.tooltip = this.overlay.querySelector('.tutorial-tooltip');
        this.tapHint = this.overlay.querySelector('.tutorial-tap-hint');
    }
    
    bindEvents() {
        const nextBtn = this.overlay.querySelector('.tutorial-next');
        const backBtn = this.overlay.querySelector('.tutorial-back');
        const skipBtn = this.overlay.querySelector('.tutorial-skip');
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextStep();
        });
        
        backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevStep();
        });
        
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.end();
        });
        
        // Click on overlay to advance (except on tooltip)
        this.overlay.addEventListener('click', (e) => {
            if (!this.tooltip.contains(e.target)) {
                this.nextStep();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            if (e.key === 'Escape') {
                this.end();
            } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextStep();
            } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
                e.preventDefault();
                this.prevStep();
            }
        });
    }
    
    start() {
        this.isActive = true;
        this.currentStep = 0;
        
        // Show game screen but in tutorial mode
        const introScreen = document.getElementById('introScreen');
        const gameScreen = document.getElementById('gameScreen');
        const howToScreen = document.getElementById('howToScreen');
        
        // Hide intro and how-to screens
        if (introScreen) introScreen.classList.add('hidden');
        if (howToScreen) howToScreen.classList.add('hidden');
        
        // Show game screen
        if (gameScreen) gameScreen.classList.remove('hidden');
        
        // Load tutorial images
        this.loadTutorialContent();
        
        // Show overlay
        this.overlay.classList.add('active');
        
        // Start first step
        setTimeout(() => this.showStep(0), 300);
    }
    
    loadTutorialContent() {
        // Set up tutorial state for the game UI
        const scoreValue = document.getElementById('scoreValue');
        const timerValue = document.getElementById('timerValue');
        const differencesCount = document.getElementById('differencesCount');
        const roundNumber = document.getElementById('roundNumber');
        const pelletTimer = document.getElementById('pelletTimer');
        
        if (scoreValue) scoreValue.textContent = '1,250';
        if (timerValue) timerValue.textContent = '847';
        if (differencesCount) differencesCount.textContent = '2';
        if (roundNumber) roundNumber.textContent = '1';
        
        // Create pellets if not exists
        if (pelletTimer && pelletTimer.children.length === 0) {
            const numPellets = window.gameSettings?.numPellets || 40;
            for (let i = 0; i < numPellets; i++) {
                const pellet = document.createElement('div');
                pellet.className = 'pellet';
                // Color thresholds based on percentage
                const redThreshold = Math.floor(numPellets * 0.2);
                const yellowThreshold = Math.floor(numPellets * 0.5);
                if (i < redThreshold) pellet.classList.add('red');
                else if (i < yellowThreshold) pellet.classList.add('yellow');
                else pellet.classList.add('green');
                pelletTimer.appendChild(pellet);
            }
        }
        
        // Show most pellets as active (simulating plenty of time)
        if (pelletTimer) {
            const pellets = pelletTimer.querySelectorAll('.pellet');
            const activeCount = Math.floor(pellets.length * 0.85);
            pellets.forEach((p, i) => {
                p.classList.toggle('depleted', i >= activeCount);
            });
        }
        
        // Load tutorial images
        const image1 = document.getElementById('image1');
        const image2 = document.getElementById('image2');
        
        if (image1) image1.src = 'images/tutorial/image1.svg';
        if (image2) image2.src = 'images/tutorial/image2.svg';
        
        // Reset hints to available state
        const hints = document.querySelectorAll('.hint-btn');
        hints.forEach(h => h.classList.remove('used'));
    }
    
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.end();
            return;
        }
        
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        // Update step indicator
        const indicator = this.overlay.querySelector('.tutorial-step-indicator');
        indicator.textContent = `Step ${stepIndex + 1} of ${this.steps.length}`;
        
        // Update tooltip content
        this.tooltip.querySelector('.tutorial-title').textContent = step.title;
        this.tooltip.querySelector('.tutorial-text').textContent = step.text;
        
        // Update button text and visibility for navigation
        const nextBtn = this.overlay.querySelector('.tutorial-next');
        const backBtn = this.overlay.querySelector('.tutorial-back');
        const skipBtn = this.overlay.querySelector('.tutorial-skip');
        
        // Hide back button on first step
        backBtn.style.display = stepIndex === 0 ? 'none' : 'block';
        
        if (step.isFinal) {
            nextBtn.textContent = "LET'S PLAY!";
            skipBtn.style.display = 'none';
        } else {
            nextBtn.textContent = stepIndex === this.steps.length - 2 ? 'FINISH' : 'NEXT →';
            skipBtn.style.display = 'block';
        }
        
        // Position spotlight and tooltip
        if (step.element) {
            const target = document.querySelector(step.element);
            if (target) {
                this.highlightElement(target, step.position);
                this.spotlight.classList.add('visible');
                this.pulseRing.classList.add('visible');
            }
        } else {
            // Full screen / center mode
            this.spotlight.classList.remove('visible');
            this.pulseRing.classList.remove('visible');
            this.positionTooltipCenter();
        }
        
        // Show tap hint for image step
        if (step.highlightDifference) {
            this.showTapHint();
        } else {
            this.tapHint.classList.remove('visible');
        }
        
        // Animate tooltip entrance
        this.tooltip.classList.add('animate-in');
        setTimeout(() => this.tooltip.classList.remove('animate-in'), 300);
    }
    
    highlightElement(element, position) {
        const rect = element.getBoundingClientRect();
        const padding = 10;
        
        // Position spotlight
        this.spotlight.style.left = `${rect.left - padding}px`;
        this.spotlight.style.top = `${rect.top - padding}px`;
        this.spotlight.style.width = `${rect.width + padding * 2}px`;
        this.spotlight.style.height = `${rect.height + padding * 2}px`;
        
        // Position pulse ring
        this.pulseRing.style.left = `${rect.left - padding}px`;
        this.pulseRing.style.top = `${rect.top - padding}px`;
        this.pulseRing.style.width = `${rect.width + padding * 2}px`;
        this.pulseRing.style.height = `${rect.height + padding * 2}px`;
        
        // Position tooltip based on position hint
        this.positionTooltip(rect, position);
    }
    
    positionTooltip(targetRect, position) {
        const tooltip = this.tooltip;
        const tooltipRect = tooltip.getBoundingClientRect();
        const margin = 20;
        
        let left, top;
        
        switch (position) {
            case 'top':
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                top = targetRect.top - tooltipRect.height - margin;
                break;
            case 'bottom':
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                top = targetRect.bottom + margin;
                break;
            case 'left':
                left = targetRect.left - tooltipRect.width - margin;
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                left = targetRect.right + margin;
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
            default:
                this.positionTooltipCenter();
                return;
        }
        
        // Keep tooltip on screen
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.transform = 'none';
    }
    
    positionTooltipCenter() {
        this.tooltip.style.left = '50%';
        this.tooltip.style.top = '50%';
        this.tooltip.style.transform = 'translate(-50%, -50%)';
    }
    
    showTapHint() {
        // Position tap hint over the first difference area on the images
        const imageContainer = document.querySelector('.image-container');
        if (imageContainer) {
            const rect = imageContainer.getBoundingClientRect();
            // Position in the center-ish of the left image
            this.tapHint.style.left = `${rect.left + rect.width * 0.25}px`;
            this.tapHint.style.top = `${rect.top + rect.height * 0.4}px`;
            this.tapHint.classList.add('visible');
        }
    }
    
    nextStep() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.end(true); // End and start game
        } else {
            this.showStep(this.currentStep);
        }
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }
    
    end(startGame = false) {
        this.isActive = false;
        this.overlay.classList.remove('active');
        
        if (startGame) {
            // Start the actual game directly without going through intro screen
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen) {
                gameScreen.classList.remove('hidden');
                
                // Trigger game start callback directly
                if (window.introScreen && window.introScreen.onStart) {
                    window.introScreen.onStart();
                }
            }
        } else {
            // Reset game screen and go back to intro screen
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen) gameScreen.classList.add('hidden');
            
            const introScreen = document.getElementById('introScreen');
            if (introScreen) introScreen.classList.remove('hidden');
        }
    }
}

// Create global instance
window.tutorial = new Tutorial();
