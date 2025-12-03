// Load settings from localStorage or use defaults
const savedSettings = localStorage.getItem('photoHuntSettings');
const loadedSettings = savedSettings ? JSON.parse(savedSettings) : null;

const gameSettings = {
    searchTime: loadedSettings?.searchTime ?? 999,
    searchTimeMin: loadedSettings?.searchTimeMin ?? 10, // Minimum timer value (original game allows very low points)
    initialRoundTime: loadedSettings?.initialRoundTime ?? 120,
    roundTimeReduction: loadedSettings?.roundTimeReduction ?? 0.05,
    minRoundTimeFactor: loadedSettings?.minRoundTimeFactor ?? 0.15,
    countdownRate: 30, // 1 point every 30ms = smooth countdown (~33 points/sec)
    numPellets: loadedSettings?.numPellets ?? 40,
    showRedOutlines: loadedSettings?.showRedOutlines ?? false,
    showBlueX: loadedSettings?.showBlueX ?? false,
    display43Mode: loadedSettings?.display43Mode ?? false,
    sounds: {
        roundNew: loadedSettings?.sounds?.roundNew ?? 'audio/round-new.mp3',
        pellet: loadedSettings?.sounds?.pellet ?? 'audio/pellet.mp3',
        success: loadedSettings?.sounds?.success ?? 'audio/success.mp3',
        miss: loadedSettings?.sounds?.miss ?? 'audio/miss.mp3',
        correct: loadedSettings?.sounds?.correct ?? 'audio/correct.mp3',
        outOfTime: loadedSettings?.sounds?.outOfTime ?? 'audio/out-of-time.mp3',
        hint: loadedSettings?.sounds?.hint ?? 'audio/hint.mp3',
        no: loadedSettings?.sounds?.no ?? 'audio/no.mp3',
        hintBonus: loadedSettings?.sounds?.hintBonus ?? 'audio/hint-bonus.mp3',
        gameOverMissed: loadedSettings?.sounds?.gameOverMissed ?? 'audio/game-over-missed.mp3'
    }
};

// Apply theme from settings
(function applyTheme() {
    const theme = loadedSettings?.theme ?? 'retro-vaporwave';
    const themeLink = document.querySelector('link[href*="themes/"]');
    if (themeLink) {
        themeLink.href = `style/themes/${theme}.css`;
    }
})();

// Apply display mode from settings
(function applyDisplayMode() {
    const display43Mode = loadedSettings?.display43Mode ?? false;
    if (display43Mode) {
        document.body.classList.add('display-4-3');
    } else {
        document.body.classList.remove('display-4-3');
    }
})();

// Apply font from settings
(function applyFont() {
    const font = loadedSettings?.font ?? 'default';
    // Remove any existing font classes
    document.body.classList.remove('font-fredoka', 'font-bangers', 'font-patrick-hand');
    // Apply selected font class
    if (font && font !== 'default') {
        document.body.classList.add(`font-${font}`);
    }
})();