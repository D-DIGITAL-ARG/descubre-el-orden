const COLORS = [
    { id: 'blue', name: 'Azul', hex: '#0037fd', from: 'from-blue-400', to: 'to-blue-700', glow: 'neo-glow-blue' },
    { id: 'yellow', name: 'Amarillo', hex: '#fff200', from: 'from-yellow-300', to: 'to-yellow-600', glow: 'neo-glow-yellow' },
    { id: 'coral', name: 'Rojo', hex: '#ff0f0f', from: 'from-red-400', to: 'to-red-700', glow: 'neo-glow-red' },
    { id: 'mint', name: 'Verde', hex: '#00ff37', from: 'from-emerald-400', to: 'to-emerald-700', glow: 'neo-glow-green' }
];

let secretSequence = [];
let currentRowIndex = 0;
let currentColIndex = 0;
let gridState = Array.from({ length: 10 }, () => Array(4).fill(null));
let rowResults = Array(10).fill(null);
let gameActive = true;

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function initGame() {
    secretSequence = shuffle(COLORS);
    renderHistoryGrid();
    renderSelectionPool();
    updateUI();
}

function renderHistoryGrid() {
    const gridContainer = document.getElementById('history-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    for (let r = 0; r < 10; r++) {
        const rowDiv = document.createElement('div');
        const isActive = r === currentRowIndex && gameActive;
        // py-1 para que las filas sean ultra compactas en el historial
        rowDiv.className = `glass-panel rounded-xl py-1 px-4 lg:p-2 flex items-center justify-between group transition-all duration-300 ${isActive ? 'border-primary/80 bg-white/10' : 'hover:border-primary/30'}`;
        rowDiv.id = `row-${r}`;

        const circlesDiv = document.createElement('div');
        circlesDiv.className = 'flex gap-1.5';

        for (let c = 0; c < 4; c++) {
            const circle = document.createElement('div');
            circle.className = 'history-circle';
            circle.id = `circle-${r}-${c}`;

            if (gridState[r][c]) {
                const color = gridState[r][c];
                circle.style.background = `radial-gradient(circle at 30% 30%, ${color.hex}, rgba(0,0,0,0))`;
                circle.classList.add('filled');
            }
            circlesDiv.appendChild(circle);
        }

        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'flex items-center gap-2';
        scoreDiv.id = `score-${r}`;

        const score = rowResults[r] !== null ? rowResults[r] : '-';
        const scoreColor = rowResults[r] === 4 ? 'text-green-400' : 'text-primary';
        // Texto más pequeño para aciertos
        scoreDiv.innerHTML = `<span class="score-num text-lg lg:text-xl font-black ${scoreColor}">${score}</span> <span class="uppercase tracking-tighter text-[10px] font-black text-slate-400">ACIERTOS</span>`;

        rowDiv.appendChild(circlesDiv);
        rowDiv.appendChild(scoreDiv);
        gridContainer.appendChild(rowDiv);
    }
}

function renderSelectionPool() {
    const container = document.getElementById('player-slots');
    if (!container) return;
    container.innerHTML = '';

    COLORS.forEach(color => {
        const btn = document.createElement('button');
        btn.className = `mystery-slot sphere-3d ${color.from} ${color.to} ${color.glow} cursor-pointer transition-transform hover:scale-105 active:scale-95 !border-white/10`;
        btn.style.background = `radial-gradient(circle at 30% 30%, ${color.hex}, rgba(0,0,0,0))`;
        btn.addEventListener('click', () => handleColorSelect(color));
        container.appendChild(btn);
    });
}

function handleColorSelect(color) {
    if (!gameActive || currentRowIndex >= 10) return;

    const circle = document.getElementById(`circle-${currentRowIndex}-${currentColIndex}`);
    if (circle) {
        circle.style.background = `radial-gradient(circle at 30% 30%, ${color.hex}, rgba(0,0,0,0))`;
        circle.classList.add('filled', 'animate-pop');
        gridState[currentRowIndex][currentColIndex] = color;
    }

    currentColIndex++;
    if (currentColIndex === 4) {
        checkRowAttempt(currentRowIndex);
    }
}

function checkRowAttempt(rowIndex) {
    const playerRow = gridState[rowIndex];
    let correct = 0;
    for (let i = 0; i < 4; i++) {
        if (playerRow[i].id === secretSequence[i].id) correct++;
    }
    rowResults[rowIndex] = correct;

    if (correct === 4) {
        winGame();
    } else {
        prepareNextRow();
    }
}

function prepareNextRow() {
    currentRowIndex++;
    currentColIndex = 0;
    if (currentRowIndex < 10) {
        renderHistoryGrid();
        updateUI();
        const activeRow = document.getElementById(`row-${currentRowIndex}`);
        if (activeRow) activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        endGame(false);
    }
}

function updateUI() {
    const badge = document.getElementById('attempt-badge');
    if (badge) badge.innerText = `INTENTO: ${String(currentRowIndex + 1).padStart(2, '0')}`;

    const feedback = document.getElementById('feedback');
    if (feedback && currentRowIndex > 0) {
        const lastScore = rowResults[currentRowIndex - 1];
        feedback.innerText = lastScore == 0 ? "¡Ouch! Ningún color en su lugar." : `¡Ya tienes ${lastScore} en el lugar correcto!`;
        feedback.className = "text-lg lg:text-lg text-yellow-400 font-medium animate-pulse";
    }
}

function winGame() {
    gameActive = false;
    renderHistoryGrid();
    revealSecret();
    document.getElementById('victory-header').style.display = 'block';
    document.getElementById('game-title').style.display = 'none';
    document.getElementById('selection-container').style.display = 'none';
    document.getElementById('reset-container').style.display = 'flex';
}

function endGame(won) {
    gameActive = false;
    renderHistoryGrid();
    revealSecret();
    if (!won) {
        document.getElementById('failure-header').style.display = 'block';
        document.getElementById('game-title').style.display = 'none';
        document.getElementById('selection-container').style.display = 'none';
        document.getElementById('reset-container').style.display = 'flex';
    }
}

function revealSecret() {
    const slots = document.querySelectorAll('#hidden-zone .mystery-slot');
    slots.forEach((slot, i) => {
        slot.innerHTML = '';
        slot.className = `mystery-slot revealed ${secretSequence[i].from} ${secretSequence[i].to}`;
        slot.style.background = `radial-gradient(circle at 30% 30%, ${secretSequence[i].hex}, rgba(0,0,0,0))`;
    });
}

document.addEventListener('DOMContentLoaded', initGame);
