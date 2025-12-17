document.addEventListener("DOMContentLoaded", function() {
    // Game Settings
    let searchTime = gameSettings.searchTime;
    let searchTimeMin = gameSettings.searchTimeMin; // Minimum search time
    let searchTimerValue = searchTime;
    let roundTime = gameSettings.initialRoundTime; // Initial round timer set to 2 minutes
    let differencesFound = 0;
    let score = 0;
    let round = 0; // Start from 0 to use as index for shuffled sets
    let differences = [];
    let totalDifferences = 0;
    let hintsRemaining = 3;
    let shuffledSets = [];

    // DOM Elements
    const scoreValueElement = document.getElementById('scoreValue');
    const searchTimerValueElement = document.getElementById('timerValue');
    const roundTimerElement = document.getElementById('pelletTimer');
    const differencesCountElement = document.getElementById('differencesCount');
    const differencesTotalElement = document.getElementById('differencesTotal');
    const roundNumberElement = document.getElementById('roundNumber');
    const highScoreNameElement = document.getElementById('highScoreName');
    const highScoreValueElement = document.getElementById('highScoreValue');
    const image1 = document.getElementById('image1');
    const image2 = document.getElementById('image2');
    const hintContainer = document.getElementById('hintContainer');
    const hintIcons = hintContainer.querySelectorAll('.hint-btn');

    // Timers
    let timeLeft = roundTime; // Set round timer to initialRoundTime
    let searchTimerInterval;
    let roundTimerInterval;
    let hintWiggleTriggered = false; // Track if hint wiggle has been shown this round
    let gameActive = false; // Track if game is actively running (prevents timer updates after game over)

    // Audio
    let audioContext;
    let correctSoundBuffer;

    // Reusable audio instances
    const roundNewSound = new Audio(gameSettings.sounds.roundNew);
    const successSound = new Audio(gameSettings.sounds.success);
    const missSound = new Audio(gameSettings.sounds.miss);
    const outOfTimeSound = new Audio(gameSettings.sounds.outOfTime);
    const hintSound = new Audio(gameSettings.sounds.hint);
    const noSound = new Audio(gameSettings.sounds.no);
    const hintBonusSound = new Audio(gameSettings.sounds.hintBonus);
    
    // Sound sources for creating new instances (for overlapping sounds)
    const pelletSoundSrc = gameSettings.sounds.pellet;
    const gameOverMissedSoundSrc = gameSettings.sounds.gameOverMissed;

    // Initialize Audio Context
    function initializeAudioContext() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Load and decode the correct sound for pitch adjustment
        fetch(gameSettings.sounds.correct)
            .then(response => response.arrayBuffer())
            .then(data => audioContext.decodeAudioData(data))
            .then(buffer => {
                correctSoundBuffer = buffer;
            });
    }

    // Shuffle function to randomize sets
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Create round timer
    let cachedPellets = []; // Cache pellet elements for performance
    
    function createRoundTimer() {
        roundTimerElement.innerHTML = ''; // Clear previous pellets
        for (let i = 0; i < gameSettings.numPellets; i++) {
            const pellet = document.createElement('div');
            pellet.className = 'pellet';
            if (i < 8) {
                pellet.classList.add('red');
            } else if (i < 19) {
                pellet.classList.add('yellow');
            } else {
                pellet.classList.add('green');
            }
            roundTimerElement.appendChild(pellet);
        }
        // Cache pellets after creation
        cachedPellets = Array.from(roundTimerElement.querySelectorAll('.pellet'));
    }

    // Update the high score display in the header
    function updateHighScoreDisplay() {
        if (window.highScores && highScoreValueElement) {
            const topScore = window.highScores.getTopScore();
            if (topScore) {
                if (highScoreNameElement) highScoreNameElement.textContent = topScore.name;
                highScoreValueElement.textContent = topScore.score.toLocaleString();
            } else {
                if (highScoreNameElement) highScoreNameElement.textContent = '---';
                highScoreValueElement.textContent = '0';
            }
        }
    }

    // Game Flow Functions
    function startRound() {
        updateHighScoreDisplay(); // Update high score when round starts
        loadDifferences().then(() => {
            resetSearchTimer();
            resetRoundTimer();
            differencesFound = 0;
            updateDifferencesFoundDisplay();
            playRoundNewSound();
            startTimers();
            enableClicks();
        });
    }

    function loadImage(imageElement, src) {
        return new Promise((resolve, reject) => {
            // Add loading class to show shimmer
            imageElement.classList.add('loading');
            const wrapper = imageElement.closest('.image-wrapper');
            if (wrapper) wrapper.classList.remove('loaded');
            
            // Set timeout to prevent infinite loading
            const timeout = setTimeout(() => {
                imageElement.classList.remove('loading');
                reject(new Error(`Image load timeout: ${src}`));
            }, 10000); // 10 second timeout
            
            imageElement.onload = () => {
                clearTimeout(timeout);
                // Remove loading class and add loaded to wrapper
                imageElement.classList.remove('loading');
                if (wrapper) wrapper.classList.add('loaded');
                resolve(imageElement);
            };
            
            imageElement.onerror = () => {
                clearTimeout(timeout);
                imageElement.classList.remove('loading');
                reject(new Error(`Failed to load image: ${src}`));
            };
            
            // Clear any previous src to force reload
            imageElement.src = '';
            // Force cache bust on error prone images
            const cacheBuster = new Date().getTime();
            imageElement.src = src.includes('?') ? `${src}&t=${cacheBuster}` : `${src}?t=${cacheBuster}`;
        });
    }

    async function loadDifferences() {
        try {
            if (shuffledSets.length === 0) {
                const response = await fetch(`data/sets.json`);
                const data = await response.json();
                shuffledSets = shuffle(data.sets);
            }

            // Check if player has completed all sets
            if (round >= shuffledSets.length) {
                // Player has completed all available sets - end game with victory
                stopGame();
                playSuccessSound(); // Victory sound
                showTimedPopup("GAME COMPLETE!", 2500, () => {
                    showGameOverPopup(score, resetGame);
                });
                return;
            }

            const set = shuffledSets[round % shuffledSets.length];

            // Deep clone differences to avoid mutating the original data
            differences = set.differences.map(diff => ({ ...diff, found: false }));
            totalDifferences = differences.length;

            try {
                await Promise.all([
                    loadImage(image1, set.image1),
                    loadImage(image2, set.image2)
                ]);
            } catch (imageError) {
                console.error('Error loading images:', imageError);
                // Try to recover by skipping to next round
                showTimedPopup("IMAGE LOAD ERROR", 1500, () => {
                    round++;
                    if (round >= shuffledSets.length) {
                        showGameOverPopup(score, resetGame);
                    } else {
                        startRound();
                    }
                });
                return;
            }

            clearCanvasOverlays(image1);
            clearCanvasOverlays(image2);
            drawRedBoxes(image1);
            drawRedBoxes(image2);

        } catch (error) {
            console.error('Error loading differences:', error);
            // Critical error - return to intro
            showTimedPopup("LOAD ERROR", 1500, () => {
                returnToIntro();
            });
        }
    }

    function startTimers() {
        gameActive = true;
        searchTimerInterval = setInterval(updateSearchTimer, gameSettings.countdownRate);
        roundTimerInterval = setInterval(updateRoundTimer, 1000); // Update the round timer every second
    }

    function stopGame() {
        gameActive = false;
        clearInterval(searchTimerInterval);
        clearInterval(roundTimerInterval);
        disableClicks();
    }

    function updateSearchTimer() {
        if (!gameActive) return; // Don't update if game is not active
        
        if (searchTimerValue > searchTimeMin) {
            searchTimerValue -= 1; // Decrement by 1 (like original game)
            searchTimerValueElement.textContent = searchTimerValue;
        } else {
            searchTimerValue = searchTimeMin;
            searchTimerValueElement.textContent = searchTimerValue;
        }
    }

    function updateRoundTimer() {
        if (!gameActive) return; // Don't update if game is not active
        
        if (timeLeft > 0) {
            timeLeft--;
            const activePellets = Math.ceil(timeLeft / (roundTime / gameSettings.numPellets));
            updatePelletDisplay(activePellets);

            // Trigger hint wiggle when entering red zone (8 pellets or less)
            if (activePellets <= 8 && !hintWiggleTriggered && hintsRemaining > 0) {
                hintWiggleTriggered = true;
                triggerHintWiggle();
            }

            if (timeLeft <= 0) {
                stopGame(); // Stop the game and clear all timers
                playOutOfTimeSound();
                
                // Game Over Sequence:
                // 1. Show "TIME'S UP!" for 1.5 seconds
                showTimedPopup("TIME'S UP!", 1500, () => {
                    // 2. Draw circles around missed differences
                    showMissedDifferences(() => {
                        // 3. Show "GAME OVER" for 3 seconds
                        showTimedPopup("GAME OVER", 3000, () => {
                            // 4. Check for high score - show keyboard or final score popup
                            showGameOverPopup(score, resetGame);
                        });
                    });
                });
            }
        }
    }

    function triggerHintWiggle() {
        // Pulse each available hint button with a slight delay between them
        hintIcons.forEach((btn, index) => {
            if (!btn.classList.contains('used')) {
                setTimeout(() => {
                    btn.classList.add('pulse');
                    btn.addEventListener('animationend', () => {
                        btn.classList.remove('pulse');
                    }, { once: true });
                }, index * 150); // Stagger the animations
            }
        });
    }

    function resetSearchTimer() {
        searchTimerValue = Math.max(searchTime, searchTimeMin);
        searchTimerValueElement.textContent = searchTimerValue;
    }

    // Helper function to update pellet display based on active count
    function updatePelletDisplay(activeCount) {
        cachedPellets.forEach((pellet, index) => {
            pellet.style.opacity = index < activeCount ? '1' : '0.2';
        });
    }

    function resetRoundTimer() {
        timeLeft = roundTime;
        hintWiggleTriggered = false;
        updatePelletDisplay(cachedPellets.length); // All pellets active
    }

    function clearCanvasOverlays(imageElement) {
        const wrapper = imageElement.parentElement;
        // Remove canvas overlays
        const canvases = wrapper.querySelectorAll('canvas');
        canvases.forEach(canvas => canvas.remove());
        // Remove SVG overlays (used for animated missed difference circles)
        const svgs = wrapper.querySelectorAll('svg');
        svgs.forEach(svg => svg.remove());
    }

    function disableClicks() {
        image1.removeEventListener('click', handleImageClickWrapper1);
        image2.removeEventListener('click', handleImageClickWrapper2);
    }

    function enableClicks() {
        image1.addEventListener('click', handleImageClickWrapper1);
        image2.addEventListener('click', handleImageClickWrapper2);
    }

    function handleImageClickWrapper1(event) {
        handleImageClick(event, image1, image2);
    }

    function handleImageClickWrapper2(event) {
        handleImageClick(event, image2, image1);
    }

    function getRelativeCoordinates(event, imageElement) {
        const rect = imageElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const xPercent = x / rect.width;
        const yPercent = y / rect.height;
        return { xPercent, yPercent };
    }

    function drawRedBoxes(imageElement) {
        const canvas = createCanvasOverlay(imageElement);
        const ctx = canvas.getContext('2d');
        differences.forEach(diff => {
            // Use canvas dimensions (which match the actual rendered image size)
            const x = (diff.x / imageElement.naturalWidth) * canvas.width;
            const y = (diff.y / imageElement.naturalHeight) * canvas.height;
            const width = (diff.width / imageElement.naturalWidth) * canvas.width;
            const height = (diff.height / imageElement.naturalHeight) * canvas.height;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            if (gameSettings.showRedOutlines) ctx.stroke();
        });
    }

    function markIncorrect(x, y, imageElement) {
        const canvas = createCanvasOverlay(imageElement);
        const ctx = canvas.getContext('2d');
        if (gameSettings.showBlueX) {
            ctx.beginPath();
            ctx.moveTo(x - 10, y - 10);
            ctx.lineTo(x + 10, y + 10);
            ctx.moveTo(x + 10, y - 10);
            ctx.lineTo(x - 10, y + 10);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        imageElement.parentElement.appendChild(canvas);
        
        // Add shake animation to both image wrappers
        const wrappers = document.querySelectorAll('.image-wrapper');
        wrappers.forEach(wrapper => {
            wrapper.classList.remove('shake');
            // Force reflow to restart animation
            void wrapper.offsetWidth;
            wrapper.classList.add('shake');
            wrapper.addEventListener('animationend', () => {
                wrapper.classList.remove('shake');
            }, { once: true });
        });
        
        reduceRoundTime(10);
        playMissSound();
    }

    function createCanvasOverlay(imageElement) {
        const canvas = document.createElement('canvas');
        const wrapper = imageElement.parentElement;
        
        // Get the actual rendered size and position of the image
        const imgRect = imageElement.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Calculate offset of image within wrapper (for object-fit: contain centering)
        const offsetLeft = imgRect.left - wrapperRect.left;
        const offsetTop = imgRect.top - wrapperRect.top;
        
        canvas.width = imgRect.width;
        canvas.height = imgRect.height;
        canvas.style.position = 'absolute';
        canvas.style.top = offsetTop + 'px';
        canvas.style.left = offsetLeft + 'px';
        canvas.style.pointerEvents = 'none';
        wrapper.appendChild(canvas);
        return canvas;
    }

    function reduceRoundTime(seconds) {
        timeLeft -= seconds;
        if (timeLeft < 0) {
            timeLeft = 0;
        }
        const activePellets = Math.ceil(timeLeft / (roundTime / gameSettings.numPellets));
        updatePelletDisplay(activePellets);

        if (timeLeft <= 0) {
            stopGame(); // Stop the game and clear all timers
            playOutOfTimeSound();
            
            // Game Over Sequence:
            // 1. Show "TIME'S UP!" for 1.5 seconds
            showTimedPopup("TIME'S UP!", 1500, () => {
                // 2. Draw circles around missed differences
                showMissedDifferences(() => {
                    // 3. Show "GAME OVER" for 3 seconds
                    showTimedPopup("GAME OVER", 3000, () => {
                        // 4. Show final score / high score entry
                        showGameOverPopup(score, resetGame);
                    });
                });
            });
        }
    }

    function handleImageClick(event, imageElement, otherImageElement) {
        const { xPercent, yPercent } = getRelativeCoordinates(event, imageElement);
        const imgRect = imageElement.getBoundingClientRect();
        const clickX = xPercent * imgRect.width;
        const clickY = yPercent * imgRect.height;
        
        const found = differences.some((diff, index) => {
            if (diff.found) return false; // Ignore already found differences

            const x = diff.x / imageElement.naturalWidth;
            const y = diff.y / imageElement.naturalHeight;
            const width = diff.width / imageElement.naturalWidth;
            const height = diff.height / imageElement.naturalHeight;

            if (xPercent >= x && xPercent <= x + width &&
                yPercent >= y && yPercent <= y + height) {
                highlightDifference(imageElement, diff);
                highlightDifference(otherImageElement, diff); // Highlight on both images
                diff.found = true; // Mark the difference as found
                differencesFound++;
                updateDifferencesFoundDisplay();
                updateScore(searchTimerValue);
                playCorrectSound();
                
                // Create ripple effect on both images
                createRippleEffect(imageElement, clickX, clickY);
                createRippleEffect(otherImageElement, clickX, clickY);
                
                resetSearchTimer(); // Reset the search timer after finding a difference
                if (differencesFound === totalDifferences) {
                    endRound();
                }
                return true;
            }
            return false;
        });

        if (!found) {
            markIncorrect(clickX, clickY, imageElement);
        }
    }
    
    function createRippleEffect(imageElement, x, y) {
        const wrapper = imageElement.parentElement;
        const imgRect = imageElement.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Calculate offset of image within wrapper
        const offsetLeft = imgRect.left - wrapperRect.left;
        const offsetTop = imgRect.top - wrapperRect.top;
        
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = (offsetLeft + x) + 'px';
        ripple.style.top = (offsetTop + y) + 'px';
        wrapper.appendChild(ripple);
        
        // Remove ripple after animation completes
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    function highlightDifference(imageElement, diff) {
        const canvas = createCanvasOverlay(imageElement);
        const ctx = canvas.getContext('2d');
        // Use canvas dimensions (which match the actual rendered image size)
        const x = (diff.x / imageElement.naturalWidth) * canvas.width;
        const y = (diff.y / imageElement.naturalHeight) * canvas.height;
        const width = (diff.width / imageElement.naturalWidth) * canvas.width;
        const height = (diff.height / imageElement.naturalHeight) * canvas.height;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = 'lightgreen';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function updateDifferencesFoundDisplay() {
        if (differencesCountElement) {
            differencesCountElement.textContent = differencesFound;
        }
        if (differencesTotalElement) {
            differencesTotalElement.textContent = totalDifferences;
        }
    }

    function updateScore(points) {
        score += Math.round(points / 2) * 2; // Ensure the score is an even integer
        scoreValueElement.textContent = score.toLocaleString();
    }

    function endRound() {
        gameActive = false; // Pause game activity during round transition
        clearInterval(searchTimerInterval);
        clearInterval(roundTimerInterval);
        playSuccessSound();
        disableClicks();
        showRoundTimerGoingDown();
    }

    function showRoundTimerGoingDown() {
        let activePelletCount = Math.ceil(timeLeft / (roundTime / gameSettings.numPellets));
        
        function removePellet() {
            if (activePelletCount > 0) {
                activePelletCount--;
                score += 250;
                scoreValueElement.textContent = score.toLocaleString();
                cachedPellets[activePelletCount].style.opacity = '0.2';
                const pelletSound = new Audio(pelletSoundSrc);
                pelletSound.play();
                setTimeout(removePellet, 100);
            } else {
                showHintBonuses();
            }
        }

        removePellet();
    }

    function showHintBonuses() {
        const remainingHints = Array.from(hintIcons).filter(hintIcon => !hintIcon.classList.contains('used'));
        remainingHints.forEach((hintIcon, index) => {
            setTimeout(() => {
                // Add bonus points for unused hints
                score += 1000;
                scoreValueElement.textContent = score.toLocaleString();
                playHintBonusSound();
                
                // Visual feedback - flash the hint button
                hintIcon.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    hintIcon.style.transform = '';
                }, 300);
                
                // Create floating bonus text
                const bonusText = document.createElement('div');
                bonusText.className = 'hint-bonus-popup';
                bonusText.textContent = '+1000 BONUS!';
                
                // Position near the hint icon
                const hintRect = hintIcon.getBoundingClientRect();
                const container = hintIcon.closest('.hints-container');
                bonusText.style.position = 'absolute';
                bonusText.style.left = hintRect.left + hintRect.width / 2 + 'px';
                bonusText.style.top = hintRect.top + 'px';
                
                document.body.appendChild(bonusText);
                
                // Remove after animation
                setTimeout(() => {
                    bonusText.remove();
                }, 2000);
                
                if (index === remainingHints.length - 1) {
                    setTimeout(() => {
                        startNextRound();
                    }, 2000); // Start the next round after 2 seconds
                }
            }, index * 1000); // Delay each hint bonus by 1 second
        });
        
        // If no remaining hints, go to next round immediately
        if (remainingHints.length === 0) {
            setTimeout(startNextRound, 1000);
        }
    }

    function playHintBonusSound() {
        hintBonusSound.pause();
        hintBonusSound.currentTime = 0;
        hintBonusSound.play().catch(error => console.error('Error playing hint bonus sound:', error));
    }

    function startNextRound() {
        round++;
        
        // Check if all sets have been completed
        if (round >= shuffledSets.length) {
            // Player completed all sets - show victory message and celebration
            console.log(`All ${shuffledSets.length} sets completed!`);
            stopGame();
            playSuccessSound(); // Victory sound
            
            // Show celebration message
            showTimedPopup("GAME COMPLETE!", 2500, () => {
                // Go directly to high score entry flow
                showGameOverPopup(score, resetGame);
            });
            return;
        }
        
        roundNumberElement.textContent = round + 1; // Display as 1-based for users
        roundTime = Math.max(gameSettings.initialRoundTime * Math.pow(1 - gameSettings.roundTimeReduction, round), gameSettings.initialRoundTime * gameSettings.minRoundTimeFactor);
        
        // Reset hints for the new round
        hintsRemaining = 3;
        hintIcons.forEach(icon => icon.classList.remove('used'));
        
        setTimeout(startRound, 2000); // Delay before starting next round
    }

    function playMissSound() {
        missSound.pause();
        missSound.currentTime = 0;
        missSound.play().catch(error => console.error('Error playing miss sound:', error));
    }

    function playCorrectSound() {
        const source = audioContext.createBufferSource();
        source.buffer = correctSoundBuffer;
        source.playbackRate.value = 1 + (differencesFound * 0.1); // Increase pitch with each found difference
        source.connect(audioContext.destination);
        source.start(0);
    }

    function playHintSound() {
        hintSound.pause();
        hintSound.currentTime = 0;
        hintSound.play().catch(error => console.error('Error playing hint sound:', error));
    }

    function playNoSound() {
        noSound.pause();
        noSound.currentTime = 0;
        noSound.play().catch(error => console.error('Error playing no sound:', error));
    }

    function playSuccessSound() {
        successSound.currentTime = 0;
        successSound.play();
    }

    function playRoundNewSound() {
        roundNewSound.currentTime = 0;
        roundNewSound.play();
    }

    function playOutOfTimeSound() {
        outOfTimeSound.pause();
        outOfTimeSound.currentTime = 0;
        outOfTimeSound.play().catch(error => console.error('Error playing out-of-time sound:', error));
    }

    function showGameOverPopup(finalScore, callback) {
        console.log('showGameOverPopup called with score:', finalScore);
        console.log('highScores object:', window.highScores);
        console.log('isHighScore result:', window.highScores ? window.highScores.isHighScore(finalScore) : 'no highScores');
        
        // Check if this is a high score
        if (window.highScores && window.highScores.isHighScore(finalScore)) {
            const rank = window.highScores.getRank(finalScore);
            console.log('Showing keyboard for rank:', rank);
            
            // Show keyboard for name entry
            const keyboard = new VirtualKeyboard({
                maxLength: 12,
                onComplete: (name, score, rank) => {
                    // Save the high score
                    window.highScores.addScore(name, score);
                    
                    // Return directly to intro screen (scores will show there)
                    returnToIntro();
                }
            });
            
            keyboard.show(rank, finalScore);
        } else {
            console.log('Not a high score, returning to intro');
            // Not a high score, return directly to intro screen
            returnToIntro();
        }
    }

    function returnToIntro() {
        // Stop any active game
        gameActive = false;
        clearInterval(searchTimerInterval);
        clearInterval(roundTimerInterval);
        
        // Reset game state
        round = 0;
        score = 0;
        hintsRemaining = 3;
        roundTime = gameSettings.initialRoundTime;
        shuffledSets = [];
        hintIcons.forEach(icon => icon.classList.remove('used'));
        scoreValueElement.textContent = '0';
        roundNumberElement.textContent = '1';
        if (differencesCountElement) differencesCountElement.textContent = '0';
        if (differencesTotalElement) differencesTotalElement.textContent = '5';
        
        // Clear any canvases/overlays
        clearCanvasOverlays(image1);
        clearCanvasOverlays(image2);
        
        // Return to intro screen
        if (window.introScreen) {
            window.introScreen.show();
        } else {
            // Fallback to old behavior
            startRound();
        }
    }

    function resetGame() {
        // Stop any active game
        gameActive = false;
        clearInterval(searchTimerInterval);
        clearInterval(roundTimerInterval);
        
        round = 0; // Reset to 0 to ensure correct indexing with shuffled sets
        score = 0;
        hintsRemaining = 3;
        roundTime = gameSettings.initialRoundTime; // Reset difficulty scaling
        shuffledSets = []; // Re-shuffle sets for new game
        hintIcons.forEach(icon => icon.classList.remove('used'));
        scoreValueElement.textContent = '0';
        roundNumberElement.textContent = '1';
        if (differencesCountElement) differencesCountElement.textContent = '0';
        if (differencesTotalElement) differencesTotalElement.textContent = '5';
        startRound();
    }

    // Attach event listeners to hint icons
    hintIcons.forEach((hintIcon, index) => {
        hintIcon.addEventListener('click', () => useHint(index + 1));
    });

    function useHint(hintNumber) {
        const hintIcon = hintIcons[hintNumber - 1];
        if (!hintIcon.classList.contains('used') && hintsRemaining > 0) {
            const remainingDifferences = differences.filter(diff => !diff.found);
            if (remainingDifferences.length > 0) {
                const randomIndex = Math.floor(Math.random() * remainingDifferences.length);
                const hintDiff = remainingDifferences[randomIndex];
                highlightDifference(image1, hintDiff);
                highlightDifference(image2, hintDiff);
                hintDiff.found = true; // Mark the difference as found
                differencesFound++;
                updateDifferencesFoundDisplay();
                if (differencesFound === totalDifferences) {
                    endRound();
                }
                hintsRemaining--;
                hintIcon.classList.add('used');
                playHintSound();
                disableClicks();
                setTimeout(enableClicks, 2000); // Temporarily disable clicks for 2 seconds
            }
        } else {
            playNoSound();
        }
    }

    function showMissedDifferences(callback) {
        const missedDifferences = differences.filter(diff => !diff.found);
        let index = 0;

        function highlightNextDifference() {
            if (index < missedDifferences.length) {
                // Reset seed for first image, second image will use same seed for identical circle
                circleDrawSeed = Math.floor(Math.random() * 1000);
                const savedSeed = circleDrawSeed;
                highlightDifferenceWithRed(image1, missedDifferences[index]);
                circleDrawSeed = savedSeed; // Reset to same seed for matching circle
                highlightDifferenceWithRed(image2, missedDifferences[index]);
                playGameOverMissedSound();
                index++;
                setTimeout(highlightNextDifference, 800); // Highlight next difference after animation completes
            } else if (callback) {
                setTimeout(callback, 500); // Small delay after last circle before showing popup
            }
        }

        highlightNextDifference();
    }

    function playGameOverMissedSound() {
        const sound = new Audio(gameOverMissedSoundSrc);
        sound.play().catch(error => console.error('Error playing game over missed sound:', error));
    }

    // Seeded random number generator for consistent "hand-drawn" circles
    let circleDrawSeed = 1;
    function seededRandom() {
        const x = Math.sin(circleDrawSeed++) * 10000;
        return x - Math.floor(x);
    }
    
    function highlightDifferenceWithRed(imageElement, diff) {
        
        const wrapper = imageElement.parentElement;
        
        // Get the actual rendered size and position of the image
        const imgRect = imageElement.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Calculate offset of image within wrapper (for object-fit: contain centering)
        const offsetLeft = imgRect.left - wrapperRect.left;
        const offsetTop = imgRect.top - wrapperRect.top;
        
        // Calculate position and size scaled to rendered image
        const x = (diff.x / imageElement.naturalWidth) * imgRect.width;
        const y = (diff.y / imageElement.naturalHeight) * imgRect.height;
        const width = (diff.width / imageElement.naturalWidth) * imgRect.width;
        const height = (diff.height / imageElement.naturalHeight) * imgRect.height;
        
        // Create SVG element for animated hand-drawn circle
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = offsetTop + 'px';
        svg.style.left = offsetLeft + 'px';
        svg.style.width = imgRect.width + 'px';
        svg.style.height = imgRect.height + 'px';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        
        // Create a hand-drawn looking path (slightly wobbly ellipse)
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = width / 2 + 5; // Add a little padding
        const radiusY = height / 2 + 5;
        
        // Generate a slightly wobbly ellipse path to look hand-drawn
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const savedSeed = circleDrawSeed; // Save seed before generating path
        const wobblePath = generateWobblyEllipsePath(centerX, centerY, radiusX, radiusY);
        path.setAttribute('d', wobblePath);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#cc0000');
        path.setAttribute('stroke-width', '4');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        // Add a slight rotation for more natural look
        const rotation = (seededRandom() - 0.5) * 6; // -3 to +3 degrees
        path.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY})`);
        
        svg.appendChild(path);
        wrapper.appendChild(svg);
        
        // Get the path length after it's in the DOM
        const pathLength = path.getTotalLength();
        
        // Set up the stroke-dasharray animation
        path.style.strokeDasharray = pathLength;
        path.style.strokeDashoffset = pathLength;
        path.style.transition = 'none';
        
        // Force reflow to ensure initial state is applied
        path.getBoundingClientRect();
        
        // Animate the circle drawing with slight easing variation
        const duration = 0.5 + seededRandom() * 0.2; // 0.5-0.7 seconds
        path.style.transition = `stroke-dashoffset ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
        path.style.strokeDashoffset = '0';
    }
    
    function generateWobblyEllipsePath(cx, cy, rx, ry) {
        // Generate a hand-drawn looking ellipse with slight wobble
        const points = 24; // Number of points around the ellipse
        const wobbleAmount = 2.5; // How much wobble to add
        
        let pathData = '';
        const startAngle = seededRandom() * Math.PI * 0.25; // Random start position
        
        for (let i = 0; i <= points + 2; i++) { // Extra points to overlap start
            const progress = i / points;
            const angle = startAngle + progress * Math.PI * 2;
            
            // Consistent wobble based on position
            const wobbleX = (seededRandom() - 0.5) * wobbleAmount;
            const wobbleY = (seededRandom() - 0.5) * wobbleAmount;
            
            const x = cx + (rx + wobbleX) * Math.cos(angle);
            const y = cy + (ry + wobbleY) * Math.sin(angle);
            
            if (i === 0) {
                pathData = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
            } else {
                // Smooth line to next point
                pathData += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
            }
        }
        
        return pathData;
    }

    // Initialize game when intro screen triggers start
    if (window.introScreen) {
        window.introScreen.onStart = () => {
            initializeAudioContext();
            createRoundTimer();
            startRound();
        };
    } else {
        // Fallback: Start game with popup if intro screen not available
        showStartGamePopup(() => {
            initializeAudioContext();
            createRoundTimer();
            startRound();
        });
    }
});
