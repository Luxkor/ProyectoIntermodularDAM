class Game {
    constructor() {
        this.lives = 4;
        this.score = 0;
        this.timer = 0;
        this.baseTime = 4000;
        this.maxTime = this.baseTime;
        this.gameInterval = null;
        this.currentMicrogame = null;
        this.lastMicrogameId = null;
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

        // Fullscreen Logic
        const fsBtn = document.getElementById('fullscreen-btn');
        if (fsBtn) fsBtn.addEventListener('click', () => this.toggleFullscreen());

        // Microgames Registry
        this.microgames = Object.values(window.Microgames || {});
    }

    openDiary() {
        this.diaryModal.classList.add('active');
    }

    closeDiary() {
        this.diaryModal.classList.remove('active');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
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

        // Pick Random Game (Avoiding repeats)
        const pool = this.microgames.filter(m => m.id !== this.lastMicrogameId);
        const gameDef = pool[Math.floor(Math.random() * pool.length)];
        this.lastMicrogameId = gameDef.id;

        // Setup UI
        this.hud.instruction.textContent = gameDef.instruction;
        this.hud.instruction.style.color = ''; // Reset color

        // Initialize Game Logic
        const instance = gameDef.setup(this.hud.interactiveArea, this.score, this);
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
        if (!this.isGameActive || !this.currentMicrogame) return;
        this.cleanupCurrentGame();

        this.score++;
        this.updateScoreDisplay();

        // Small delay/feedback before next
        this.hud.instruction.textContent = "¡BIEN!";
        this.hud.instruction.style.color = '#00f3ff';

        setTimeout(() => this.nextMicrogame(), 500);
    }

    onFail() {
        if (!this.isGameActive || !this.currentMicrogame) return;
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
