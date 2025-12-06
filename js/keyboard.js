// Virtual Keyboard Component for High Score Entry
class VirtualKeyboard {
    constructor(options = {}) {
        this.maxLength = options.maxLength || 12;
        this.onComplete = options.onComplete || (() => {});
        this.onCancel = options.onCancel || (() => {});
        this.currentValue = '';
        this.overlay = null;
        this.container = null;
    }

    show(rank, score) {
        this.rank = rank;
        this.score = score;
        this.currentValue = '';
        this.createOverlay();
        this.render();
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.add('keyboard-closing');
            setTimeout(() => {
                this.overlay.remove();
                this.overlay = null;
                this.container = null;
            }, 300);
        }
    }

    createOverlay() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'keyboard-overlay';
        
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'keyboard-container';
        
        this.overlay.appendChild(this.container);
        document.body.appendChild(this.overlay);

        // Trigger animation
        requestAnimationFrame(() => {
            this.overlay.classList.add('keyboard-visible');
        });
    }

    render() {
        const rankDisplay = this.rank ? `You placed #${this.rank}!` : '';
        
        this.container.innerHTML = `
            <div class="keyboard-header">
                <span class="keyboard-highscore-label"><span class="hs-new">NEW</span> <span class="hs-high">HIGH</span> <span class="hs-score">SCORE!</span></span>
                <span class="keyboard-rank">${rankDisplay}</span>
            </div>
            
            <div class="keyboard-input-row">
                <div class="keyboard-input-display">${this.getDisplayValue()}</div>
                <div class="keyboard-score">${this.score.toLocaleString()}</div>
            </div>
            
            <div class="keyboard-keys">
                ${this.renderKeys()}
            </div>
            
            <div class="keyboard-actions">
                <button class="keyboard-key keyboard-key-backspace" data-action="backspace">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M19 5H9l-6 7 6 7h10a2 2 0 002-2V7a2 2 0 00-2-2zm-3 9l-1.41 1.41L12 13l-2.59 2.41L8 14l2.59-2.59L8 9l1.41-1.41L12 10l2.59-2.41L16 9l-2.59 2.59L16 14z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="keyboard-key keyboard-key-space" data-action="space">SPACE</button>
                <button class="keyboard-key keyboard-key-done" data-action="done">
                    DONE
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        `;

        this.attachEventListeners();
    }

    getDisplayValue() {
        const display = this.currentValue.padEnd(this.maxLength, '?');
        return display.split('').map((char, i) => {
            const isEntered = i < this.currentValue.length;
            return `<span class="${isEntered ? 'entered' : 'placeholder'}">${char}</span>`;
        }).join('');
    }

    renderKeys() {
        const rows = [
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'],
            ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
        ];

        return rows.map(row => `
            <div class="keyboard-row">
                ${row.map(key => `
                    <button class="keyboard-key" data-key="${key}">${key}</button>
                `).join('')}
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Key buttons - use mousedown/touchstart for immediate feedback
        this.container.querySelectorAll('.keyboard-key[data-key]').forEach(btn => {
            const pressHandler = (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this.playKeySound();
                this.addCharacter(btn.dataset.key);
            };
            const releaseHandler = () => {
                btn.classList.remove('pressed');
            };
            btn.addEventListener('mousedown', pressHandler);
            btn.addEventListener('touchstart', pressHandler, { passive: false });
            btn.addEventListener('mouseup', releaseHandler);
            btn.addEventListener('mouseleave', releaseHandler);
            btn.addEventListener('touchend', releaseHandler);
            btn.addEventListener('touchcancel', releaseHandler);
        });

        // Action buttons - use mousedown/touchstart for immediate feedback
        this.container.querySelectorAll('.keyboard-key[data-action]').forEach(btn => {
            const pressHandler = (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this.playKeySound();
                this.handleAction(btn.dataset.action);
            };
            const releaseHandler = () => {
                btn.classList.remove('pressed');
            };
            btn.addEventListener('mousedown', pressHandler);
            btn.addEventListener('touchstart', pressHandler, { passive: false });
            btn.addEventListener('mouseup', releaseHandler);
            btn.addEventListener('mouseleave', releaseHandler);
            btn.addEventListener('touchend', releaseHandler);
            btn.addEventListener('touchcancel', releaseHandler);
        });

        // Physical keyboard support
        this.keyHandler = (e) => {
            if (e.key === 'Backspace') {
                e.preventDefault();
                this.playKeySound();
                this.handleAction('backspace');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.playKeySound();
                this.handleAction('done');
            } else if (e.key === ' ') {
                e.preventDefault();
                this.playKeySound();
                this.handleAction('space');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                this.playKeySound();
                this.addCharacter(e.key.toUpperCase());
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    addCharacter(char) {
        if (this.currentValue.length < this.maxLength) {
            this.currentValue += char;
            this.updateDisplay();
        }
    }

    handleAction(action) {
        switch (action) {
            case 'backspace':
                if (this.currentValue.length > 0) {
                    this.currentValue = this.currentValue.slice(0, -1);
                    this.updateDisplay();
                }
                break;
            case 'space':
                if (this.currentValue.length < this.maxLength) {
                    this.currentValue += ' ';
                    this.updateDisplay();
                }
                break;
            case 'done':
                this.complete();
                break;
        }
    }

    updateDisplay() {
        const displayEl = this.container.querySelector('.keyboard-input-display');
        if (displayEl) {
            displayEl.innerHTML = this.getDisplayValue();
        }
    }

    playKeySound() {
        // Use key-press sound for immediate feedback
        try {
            const audio = new Audio('audio/key-press.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => {});
        } catch (e) {
            // Ignore sound errors
        }
    }

    complete() {
        const name = this.currentValue.trim() || 'PLAYER';
        document.removeEventListener('keydown', this.keyHandler);
        this.hide();
        this.onComplete(name, this.score, this.rank);
    }
}

// Export for use
window.VirtualKeyboard = VirtualKeyboard;
