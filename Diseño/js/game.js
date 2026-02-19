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
                id: 'mash',
                instruction: '¡MACHACA EL BOTÓN!',
                setup: (container, difficulty) => {
                    const clicksNeeded = 3 + Math.floor(difficulty / 2); // Increase clicks by 1 every 2 levels
                    let clicks = 0;

                    const btn = document.createElement('button');
                    btn.className = 'game-btn';
                    btn.textContent = clicksNeeded;
                    btn.style.fontSize = '2rem';
                    btn.style.color = 'white';

                    btn.onmousedown = () => { // Using onmousedown for faster response
                        clicks++;
                        const remaining = clicksNeeded - clicks;
                        btn.textContent = remaining;
                        btn.style.transform = `scale(${0.9 + (Math.random() * 0.2)})`;

                        // Particle effect could go here

                        if (clicks >= clicksNeeded) {
                            this.onWin();
                        }
                    };

                    container.appendChild(btn);

                    return {
                        cleanup: () => { }
                    };
                }
            },
            {
                id: 'math',
                instruction: '¡CALCULA!',
                setup: (container, difficulty) => {
                    const range = 5 + (difficulty * 2);
                    const n1 = Math.floor(Math.random() * range) + 1;
                    const n2 = Math.floor(Math.random() * range) + 1;
                    const correctAns = n1 + n2;

                    // Generate wrong answer
                    let wrongAns = correctAns + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
                    if (wrongAns === correctAns) wrongAns += 1;
                    if (wrongAns < 0) wrongAns = 0;

                    const question = document.createElement('div');
                    question.style.fontSize = '3rem';
                    question.style.fontWeight = 'bold';
                    question.style.marginBottom = '1rem';
                    question.textContent = `${n1} + ${n2}`;
                    container.appendChild(question);

                    const optionsDiv = document.createElement('div');
                    optionsDiv.className = 'math-options-container';

                    const btn1 = document.createElement('div');
                    btn1.className = 'math-option';
                    const btn2 = document.createElement('div');
                    btn2.className = 'math-option';

                    // Randomize position
                    if (Math.random() > 0.5) {
                        btn1.textContent = correctAns;
                        btn1.dataset.correct = 'true';
                        btn2.textContent = wrongAns;
                        btn2.dataset.correct = 'false';
                    } else {
                        btn1.textContent = wrongAns;
                        btn1.dataset.correct = 'false';
                        btn2.textContent = correctAns;
                        btn2.dataset.correct = 'true';
                    }

                    const handleAns = (e) => {
                        if (e.target.dataset.correct === 'true') {
                            this.onWin();
                        } else {
                            this.onFail();
                        }
                    };

                    btn1.onclick = handleAns;
                    btn2.onclick = handleAns;

                    optionsDiv.appendChild(btn1);
                    optionsDiv.appendChild(btn2);
                    container.appendChild(optionsDiv);

                    return { cleanup: () => { } };
                }
            },
            {
                id: 'space',
                instruction: '¡ESPERA...',
                setup: (container, difficulty) => {
                    const hintA = document.createElement('div');
                    hintA.className = 'key-hint';
                    hintA.textContent = '⛔'; // Stop sign or wait
                    container.appendChild(hintA);

                    let canPress = false;
                    let triggered = false;

                    // Random delay between 500ms and 2000ms (clamped by game time)
                    // We need to ensure the "GO" signal happens before time runs out.
                    // Max time is this.maxTime. Let's say signal must appear at least 500ms before end.
                    const safeMaxTime = Math.max(500, this.maxTime - 800);
                    const delay = 500 + Math.random() * (Math.min(2000, safeMaxTime));

                    const timeout = setTimeout(() => {
                        triggered = true;
                        canPress = true;
                        this.hud.instruction.textContent = "¡ESPACIO YA!";
                        this.hud.instruction.style.color = '#00f3ff';
                        hintA.textContent = 'SPACE';
                        hintA.style.color = '#00f3ff';
                        container.style.backgroundColor = 'rgba(0, 243, 255, 0.1)';
                    }, delay);

                    return {
                        onInput: (e) => {
                            if (e.code === 'Space') {
                                if (canPress) {
                                    this.onWin();
                                } else {
                                    this.onFail(); // Pressed too early
                                }
                            }
                        },
                        cleanup: () => {
                            clearTimeout(timeout);
                            container.style.backgroundColor = '';
                        }
                    };
                }
            },
            {
                id: 'arrows',
                instruction: '¡DIRECCIÓN!',
                setup: (container, difficulty) => {
                    const directions = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
                    const symbols = { 'ArrowUp': '⬆️', 'ArrowDown': '⬇️', 'ArrowLeft': '⬅️', 'ArrowRight': '➡️' };
                    const target = directions[Math.floor(Math.random() * directions.length)];

                    const arrowDisplay = document.createElement('div');
                    arrowDisplay.style.fontSize = '6rem';
                    arrowDisplay.textContent = symbols[target];
                    arrowDisplay.style.filter = 'drop-shadow(0 0 10px rgba(0,243,255,0.5))';
                    container.appendChild(arrowDisplay);

                    return {
                        onInput: (e) => {
                            if (directions.includes(e.code)) {
                                if (e.code === target) {
                                    this.onWin();
                                } else {
                                    this.onFail();
                                }
                            }
                        },
                        cleanup: () => { }
                    };
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

        // Difficulty Scaling: Time gets shorter, but clamped to 1.5s minimum
        // Curve: 4s -> 1.5s. Reduce 100ms every 2 points?
        // Logic: 0 score = 4000ms. 20 score = 2000ms.
        this.maxTime = Math.max(1500, this.baseTime - (this.score * 100));

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
