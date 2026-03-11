const COLORS = [
    { id: 'blue', hex: '#0037fd', class: 'token-blue' },
    { id: 'yellow', hex: '#fff200', class: 'token-yellow' },
    { id: 'coral', hex: '#ff0f0f', class: 'token-coral' },
    { id: 'mint', hex: '#00ff37', class: 'token-mint' }
];

let secretSequence = [];
let currentRowIndex = 0;
let currentColIndex = 0;
let gridState = Array.from({ length: 10 }, () => Array(4).fill(null));
let gameActive = true;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initGame() {
    // Generate secret sequence
    secretSequence = shuffle([...COLORS]);
    console.log("Secret sequence (for dev):", secretSequence.map(c => c.id));

    renderHistoryGrid();
    renderSelectionPool();
    updateAttemptCounter();
}

function renderHistoryGrid() {
    const gridContainer = document.getElementById('history-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    for (let r = 0; r < 10; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = `history-row ${r === currentRowIndex ? 'active' : ''}`;
        rowDiv.id = `row-${r}`;

        const circlesDiv = document.createElement('div');
        circlesDiv.className = 'row-circles';

        for (let c = 0; c < 4; c++) {
            const circle = document.createElement('div');
            circle.className = 'history-circle';
            circle.id = `circle-${r}-${c}`;
            circlesDiv.appendChild(circle);
        }

        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'row-score';
        scoreDiv.id = `score-${r}`;
        scoreDiv.innerHTML = `
            <span class="score-num">-</span>
            <span class="score-label">Aciertos</span>
        `;

        rowDiv.appendChild(circlesDiv);
        rowDiv.appendChild(scoreDiv);
        gridContainer.appendChild(rowDiv);
    }
}

function renderSelectionPool() {
    const container = document.getElementById('player-slots');
    if (!container) return;
    container.innerHTML = '';

    COLORS.forEach((color) => {
        const token = document.createElement('div');
        token.className = `color-token ${color.class}`;
        token.dataset.colorId = color.id;

        token.addEventListener('click', () => handleColorSelect(color));

        container.appendChild(token);
    });
}

function handleColorSelect(color) {
    if (!gameActive || currentRowIndex >= 10) return;

    // Paint the current circle
    const circle = document.getElementById(`circle-${currentRowIndex}-${currentColIndex}`);
    if (circle) {
        circle.style.backgroundColor = color.hex;
        circle.classList.add('filled');
        gridState[currentRowIndex][currentColIndex] = color;
    }

    currentColIndex++;

    // If row is complete
    if (currentColIndex === 4) {
        checkRowAttempt(currentRowIndex);
    }
}

function checkRowAttempt(rowIndex) {
    const playerRow = gridState[rowIndex];
    let correctPositions = 0;

    for (let i = 0; i < 4; i++) {
        if (playerRow[i].id === secretSequence[i].id) {
            correctPositions++;
        }
    }

    // Update score UI for this row
    const scoreNum = document.querySelector(`#score-${rowIndex} .score-num`);
    if (scoreNum) {
        scoreNum.innerText = correctPositions;
        scoreNum.style.color = correctPositions === 4 ? 'var(--mint-green)' :
            correctPositions > 0 ? 'var(--neon-yellow)' : 'rgba(255, 255, 255, 1)';
    }

    updateFeedback(correctPositions);

    if (correctPositions === 4) {
        winGame();
    } else {
        prepareNextRow();
    }
}

function prepareNextRow() {
    // Remove active class from old row
    const oldRow = document.getElementById(`row-${currentRowIndex}`);
    if (oldRow) oldRow.classList.remove('active');

    currentRowIndex++;
    currentColIndex = 0;

    if (currentRowIndex < 10) {
        const newRow = document.getElementById(`row-${currentRowIndex}`);
        if (newRow) {
            newRow.classList.add('active');
            newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        updateAttemptCounter();
    } else {
        endGame(false);
    }
}

function updateAttemptCounter() {
    const counterEl = document.getElementById('attempt-counter');
    if (counterEl) {
        counterEl.innerText = `INTENTO: ${String(currentRowIndex + 1).padStart(2, '0')}`;
    }
}

function updateFeedback(count) {
    const feedbackEl = document.getElementById('feedback');
    if (!feedbackEl) return;

    if (count === 4) {
        feedbackEl.innerText = "¡Has encontrado el orden exacto!";
        feedbackEl.style.color = "var(--neon-yellow)";
    } else if (count === 0) {
        feedbackEl.innerText = "Ouch! Ningún color en su lugar.";
        feedbackEl.style.color = "rgba(255, 255, 255, 1)";
    } else {
        feedbackEl.innerText = `¡Ya tienes ${count} en el lugar correcto!`;
        feedbackEl.style.color = "var(--neon-yellow)";
    }
}

function winGame() {
    gameActive = false;
    revealSecret();

    // Show victory message above header
    const viewTitle = document.getElementById('game-title');
    if (viewTitle) viewTitle.style.display = 'none';

    const playerSlots = document.getElementById('player-slots');
    if (playerSlots) playerSlots.style.display = 'none';

    const victoryMsg = document.getElementById('victory-message');
    if (victoryMsg) victoryMsg.style.display = 'block';

    // Show play again button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.style.display = 'block';
}

function endGame(won) {
    gameActive = false;
    if (!won) {
        const viewTitle = document.getElementById('game-title');
        if (viewTitle) viewTitle.style.display = 'none';

        const playerSlots = document.getElementById('player-slots');
        if (playerSlots) playerSlots.style.display = 'none';

        const endMsg = document.getElementById('end-message');
        if (endMsg) endMsg.style.display = 'block';

        const feedbackEl = document.getElementById('feedback');
        feedbackEl.innerText = "¡Vuelve a intentarlo!";
        revealSecret();

        // Show play again button even in game over
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.style.display = 'block';
    }
}

function revealSecret() {
    const slots = document.querySelectorAll('.mystery-slot');
    slots.forEach((slot, i) => {
        slot.innerText = '';
        slot.style.backgroundColor = secretSequence[i].hex;
        slot.style.border = 'none';
        slot.classList.add('revealed');
        // Naïve shape
        slot.style.borderRadius = secretSequence[i].class === 'token-blue' ? '50% 50%' :
            secretSequence[i].class === 'token-yellow' ? '50% 50%' :
                secretSequence[i].class === 'token-coral' ? '50% 50%' :
                    '50% 50%';
    });
}

document.addEventListener('DOMContentLoaded', initGame);
