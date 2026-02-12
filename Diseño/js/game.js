class Game {
    constructor() {
        this.lives = 4;
        this.score = 0;
        this.timer = 0;
        this.maxTime = 3000; // Faster loop for testing flow
        this.gameInterval = null;

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

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());
    }

    resetGame() {
        this.lives = 4;
        this.score = 0;
        this.maxTime = 3000;
        this.updateLivesDisplay();
        this.updateScoreDisplay();
        this.startGame();
    }

    startGame() {
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
        this.hud.interactiveArea.innerHTML = '<p style="color: #666;">(Espacio para Minijuego)</p>';

        // Set Timer
        this.timer = this.maxTime;

        this.hud.instruction.textContent = "Sobrevive...";

        // Start Loop
        this.gameInterval = setInterval(() => this.update(), 16);
    }

    update() {
        this.timer -= 16;
        const pct = (this.timer / this.maxTime) * 100;
        this.hud.timerBar.style.width = `${pct}%`;

        if (this.timer <= 0) {
            this.onFail(); // Auto-fail since there's no game to win yet
        }
    }

    onWin() {
        // Placeholder for future win logic
        clearInterval(this.gameInterval);
        this.score++;
        this.updateScoreDisplay();
        this.nextMicrogame();
    }

    onFail() {
        clearInterval(this.gameInterval);

        this.lives--;
        this.updateLivesDisplay();

        this.hud.instruction.textContent = "TIEMPO!";
        this.hud.instruction.style.color = '#ff0055';

        document.body.style.animation = 'shake 0.5s';
        setTimeout(() => document.body.style.animation = '', 500);

        setTimeout(() => {
            this.hud.instruction.style.color = '';
            this.nextMicrogame();
        }, 1000);
    }

    gameOver() {
        clearInterval(this.gameInterval);
        this.hud.finalScore.textContent = this.score;
        this.switchScreen('gameOver');
    }
}

// Add shake animation
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
