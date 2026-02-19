class Game {
    constructor() {
        this.lives = 4;
        this.score = 0;
        this.timer = 0;
        this.baseTime = 4000;
        this.maxTime = this.baseTime;
        this.gameInterval = null;
        this.currentMicrogame = null;
        this.isGameActive = false;

        // DOM Elements
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen')
        };
        this.hud = {
            lives: document.querySelector('.lives'),
            score: document.getElementById('score'),
            timerBar: document.getElementById('timer-bar'),
            instruction: document.getElementById('instruction-text'),
            interactiveArea: document.getElementById('interactive-area'),
            finalScore: document.getElementById('final-score')
        };

        // Bindings
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());

        // Global Input Listener
        document.addEventListener('keydown', (e) => {
            if (this.isGameActive && this.currentMicrogame && this.currentMicrogame.onInput) {
                this.currentMicrogame.onInput(e);
            }
        });

        // Diary Logic
        this.diaryModal = document.getElementById('diary-modal');
        const diaryBtn = document.getElementById('diary-btn');
        const closeDiaryBtn = document.getElementById('close-diary-btn');

        if (diaryBtn) diaryBtn.addEventListener('click', () => this.openDiary());
        if (closeDiaryBtn) closeDiaryBtn.addEventListener('click', () => this.closeDiary());

        // Microgames Registry
        this.microgames = [
            {
                id: 'beach',
                instruction: '¡LIMPIA LA PLAYA!',
                setup: (container, difficulty) => {
                    const beach = document.createElement('div');
                    beach.className = 'beach-container';
                    container.appendChild(beach);

                    const bin = document.createElement('div');
                    bin.className = 'trash-can';
                    bin.innerHTML = '🗑️';
                    beach.appendChild(bin);

                    const trashEmojis = ['🧴', '🥫', '🍕', '🥤', '🍌', '🦴'];
                    const numItems = 2 + Math.min(2, Math.floor(difficulty / 10)); // Fewer items at start
                    let itemsLeft = numItems;

                    const createTrash = () => {
                        const item = document.createElement('div');
                        item.className = 'trash-item';
                        item.innerHTML = trashEmojis[Math.floor(Math.random() * trashEmojis.length)];

                        // Random position - avoid the bin area
                        const x = Math.random() * (container.clientWidth - 80);
                        const y = Math.random() * (container.clientHeight - 80);
                        item.style.left = `${x}px`;
                        item.style.top = `${y}px`;

                        let isDragging = false;
                        let startX, startY;
                        let startLeft, startTop;

                        const onMove = (e) => {
                            if (!isDragging) return;
                            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                            const deltaX = clientX - startX;
                            const deltaY = clientY - startY;

                            item.style.left = `${startLeft + deltaX}px`;
                            item.style.top = `${startTop + deltaY}px`;

                            const itemRect = item.getBoundingClientRect();
                            const binRect = bin.getBoundingClientRect();

                            const isOver = (
                                itemRect.left < binRect.right &&
                                itemRect.right > binRect.left &&
                                itemRect.top < binRect.bottom &&
                                itemRect.bottom > binRect.top
                            );

                            if (isOver) {
                                bin.classList.add('hover');
                            } else {
                                bin.classList.remove('hover');
                            }
                        };

                        const onEnd = () => {
                            if (!isDragging) return;
                            isDragging = false;

                            const itemRect = item.getBoundingClientRect();
                            const binRect = bin.getBoundingClientRect();

                            const itemCenter = {
                                x: itemRect.left + itemRect.width / 2,
                                y: itemRect.top + itemRect.height / 2
                            };
                            const binCenter = {
                                x: binRect.left + binRect.width / 2,
                                y: binRect.top + binRect.height / 2
                            };

                            const dist = Math.sqrt(Math.pow(itemCenter.x - binCenter.x, 2) + Math.pow(itemCenter.y - binCenter.y, 2));

                            if (dist < 70) { // Catch radius
                                item.style.transform = 'scale(0)';
                                item.style.opacity = '0';
                                setTimeout(() => item.remove(), 200);
                                bin.classList.remove('hover');
                                itemsLeft--;

                                if (itemsLeft <= 0) {
                                    setTimeout(() => this.onWin(), 100);
                                }
                            }

                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onEnd);
                            window.removeEventListener('touchmove', onMove);
                            window.removeEventListener('touchend', onEnd);
                        };

                        const onStart = (e) => {
                            isDragging = true;
                            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

                            startLeft = parseInt(item.style.left) || 0;
                            startTop = parseInt(item.style.top) || 0;

                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onEnd);
                            window.addEventListener('touchmove', onMove, { passive: false });
                            window.addEventListener('touchend', onEnd);

                            if (e.cancelable) e.preventDefault();
                        };

                        item.addEventListener('mousedown', onStart);
                        item.addEventListener('touchstart', onStart, { passive: false });

                        beach.appendChild(item);
                    };

                    // Initial spawn
                    setTimeout(() => {
                        for (let i = 0; i < numItems; i++) {
                            createTrash();
                        }
                    }, 50);

                    return { cleanup: () => { } };
                }
            }
        ];
    }

    openDiary() {
        this.diaryModal.classList.add('active');
    }

    closeDiary() {
        this.diaryModal.classList.remove('active');
    }

    resetGame() {
        this.lives = 4;
        this.score = 0;
        this.baseTime = 4000;
        this.updateLivesDisplay();
        this.updateScoreDisplay();
        this.startGame();
    }

    startGame() {
        this.isGameActive = true;
        this.switchScreen('game');
        this.nextMicrogame();
    }

    switchScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }

    updateLivesDisplay() {
        this.hud.lives.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const heart = document.createElement('span');
            heart.textContent = '❤️';
            heart.className = 'heart';
            this.hud.lives.appendChild(heart);
        }
    }

    updateScoreDisplay() {
        this.hud.score.textContent = this.score;
    }

    nextMicrogame() {
        if (this.lives <= 0) {
            this.gameOver();
            return;
        }

        clearInterval(this.gameInterval);
        this.hud.interactiveArea.innerHTML = ''; // Clear previous

        // Difficulty Scaling: Every 10 points, time decreases by 400ms
        const difficultyLevel = Math.floor(this.score / 10);
        this.maxTime = Math.max(1200, this.baseTime - (difficultyLevel * 400));

        this.timer = this.maxTime;

        // Pick Random Game
        const gameDef = this.microgames[Math.floor(Math.random() * this.microgames.length)];

        // Setup UI
        this.hud.instruction.textContent = gameDef.instruction;
        this.hud.instruction.style.color = ''; // Reset color

        // Initialize Game Logic
        const instance = gameDef.setup(this.hud.interactiveArea, this.score);
        this.currentMicrogame = {
            ...instance,
            def: gameDef
        };

        // Start Loop
        this.gameInterval = setInterval(() => this.update(), 16);
    }

    update() {
        if (!this.isGameActive) return;

        this.timer -= 16;
        const pct = (this.timer / this.maxTime) * 100;
        this.hud.timerBar.style.width = `${pct}%`;

        // Color change urgency
        if (pct < 30) this.hud.timerBar.style.backgroundColor = '#ff0055';
        else this.hud.timerBar.style.backgroundColor = '';

        if (this.timer <= 0) {
            this.onFail();
        }
    }

    onWin() {
        if (!this.isGameActive) return;
        this.cleanupCurrentGame();

        this.score++;
        this.updateScoreDisplay();

        // Small delay/feedback before next
        this.hud.instruction.textContent = "¡BIEN!";
        this.hud.instruction.style.color = '#00f3ff';

        setTimeout(() => this.nextMicrogame(), 500);
    }

    onFail() {
        if (!this.isGameActive) return;
        this.cleanupCurrentGame();

        this.lives--;
        this.updateLivesDisplay();

        this.hud.instruction.textContent = "¡FALLO!";
        this.hud.instruction.style.color = '#ff0055';

        document.body.style.animation = 'shake 0.5s';
        setTimeout(() => document.body.style.animation = '', 500);

        setTimeout(() => {
            if (this.lives > 0) {
                this.nextMicrogame();
            } else {
                this.gameOver();
            }
        }, 1000);
    }

    cleanupCurrentGame() {
        clearInterval(this.gameInterval);
        if (this.currentMicrogame && this.currentMicrogame.cleanup) {
            this.currentMicrogame.cleanup();
        }
        this.currentMicrogame = null;
    }

    gameOver() {
        this.isGameActive = false;
        this.cleanupCurrentGame();
        this.hud.finalScore.textContent = this.score;
        this.switchScreen('gameOver');
    }
}

// Global Animation Styles (Shake)
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0% { transform: translate(1px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0px) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
}
`;
document.head.appendChild(style);

const game = new Game();
