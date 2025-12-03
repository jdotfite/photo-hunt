function showPopup(message, buttonText, buttonCallback) {
    const popup = document.createElement('div');
    popup.className = 'popup';

    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';

    const messageElement = document.createElement('h2');
    messageElement.textContent = message;
    popupContent.appendChild(messageElement);

    const button = document.createElement('button');
    button.textContent = buttonText;
    button.addEventListener('click', () => {
        popup.classList.add('popup-closing');
        setTimeout(() => {
            document.body.removeChild(popup);
            buttonCallback();
        }, 200);
    });
    popupContent.appendChild(button);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);
    
    return popup; // Return reference for manual control
}

// Auto-dismissing popup (no button)
function showTimedPopup(message, duration, callback) {
    const popup = document.createElement('div');
    popup.className = 'popup';

    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content popup-timed';

    const messageElement = document.createElement('h2');
    messageElement.textContent = message;
    popupContent.appendChild(messageElement);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    // Auto-dismiss after duration
    setTimeout(() => {
        popup.classList.add('popup-closing');
        setTimeout(() => {
            if (popup.parentNode) {
                document.body.removeChild(popup);
            }
            if (callback) callback();
        }, 200);
    }, duration);
    
    return popup;
}

function showGameOverPopup(score, callback) {
    showPopup(`Game Over\nFinal Score: ${score}`, 'Try Again', callback);
}

function showStartGamePopup(callback) {
    showPopup('Welcome to Spot the Difference!\nClick the button below to start the game!', 'Start Game', callback);
}
