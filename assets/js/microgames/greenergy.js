window.Microgames = window.Microgames || {};

window.Microgames.greenergy = {
    id: 'greenergy',
    instruction: '¡RECOGE ENERGÍA VERDE!',
    setup: (container, difficulty, game) => {
        const greenErgyContainer = document.createElement('div');
        greenErgyContainer.className = 'greenergy-container';
        container.appendChild(greenErgyContainer);

        // Energy sources
        const goodEnergy = ['☀️', '💨', '💧']; // Solar, Wind, Hydro
        const badEnergy = ['⚫', '🛢️']; // Coal, Oil
        
        let collectedCount = 0;
        const targetCollect = 2 + Math.min(2, Math.floor(difficulty / 10));
        let gameEnded = false;
        const animationIntervals = [];

        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'greenergy-score';
        scoreDisplay.textContent = `Recolectados: ${collectedCount}/${targetCollect}`;
        greenErgyContainer.appendChild(scoreDisplay);

        const createEnergySource = () => {
            const isGood = Math.random() > 0.3; // 70% good, 30% bad
            const source = document.createElement('div');
            source.className = isGood ? 'energy-source good' : 'energy-source bad';
            source.innerHTML = isGood 
                ? goodEnergy[Math.floor(Math.random() * goodEnergy.length)]
                : badEnergy[Math.floor(Math.random() * badEnergy.length)];

            const x = Math.random() * (container.clientWidth - 80);
            const y = -50;
            source.style.left = `${x}px`;
            source.style.top = `${y}px`;

            let yVelocity = 3 + Math.floor(difficulty / 12);
            let isActive = true;

            const clickHandler = () => {
                if (!isActive || gameEnded) return;
                isActive = false;

                if (isGood) {
                    source.classList.add('collected');
                    collectedCount++;
                    scoreDisplay.textContent = `Recolectados: ${collectedCount}/${targetCollect}`;  

                    if (collectedCount >= targetCollect) {
                        gameEnded = true;
                        game.onWin();
                    }
                    
                    setTimeout(() => {
                        source.remove();
                    }, 300);
                } else {
                    // Wrong energy source - fail
                    if (!gameEnded) {
                        gameEnded = true;
                        source.style.opacity = '0.5';
                        game.onFail();
                    }
                }
            };

            source.addEventListener('click', clickHandler);

            greenErgyContainer.appendChild(source);

            const animationInterval = setInterval(() => {
                const currentTop = parseFloat(source.style.top);
                if (!isActive || currentTop > container.clientHeight) {
                    clearInterval(animationInterval);
                    if (isActive && !gameEnded) {
                        gameEnded = true;
                        source.remove();
                        game.onFail();
                    }
                    return;
                }

                source.style.top = `${currentTop + yVelocity}px`;
            }, 16);
            
            animationIntervals.push(animationInterval);
        };

        // Create energy sources periodically
        const spawnInterval = setInterval(() => {
            if (collectedCount >= targetCollect) {
                clearInterval(spawnInterval);
                return;
            }
            createEnergySource();
        }, 700 - Math.floor(difficulty / 5) * 60);

        const style = document.createElement('style');
        style.id = 'greenergy-styles';
        style.textContent = `
            .greenergy-container {
                position: relative;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #0a4d0a 0%, #1a6b1a 100%);
                overflow: hidden;
                border-radius: 20px;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 20px;
            }
            
            .greenergy-score {
                position: absolute;
                top: 20px;
                font-size: 18px;
                font-weight: bold;
                color: #00ff00;
                text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
                z-index: 10;
            }
            
            .energy-source {
                position: absolute;
                font-size: 50px;
                cursor: pointer;
                user-select: none;
                transition: transform 0.1s;
                filter: drop-shadow(0 0 5px rgba(0, 255, 0, 0.3));
            }
            
            .energy-source:hover {
                transform: scale(1.2);
            }
            
            .energy-source.good {
                animation: glow 1s infinite alternate;
            }
            
            .energy-source.bad {
                opacity: 0.7;
                filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.5));
            }
            
            .energy-source.bad:hover {
                transform: scale(1.1);
            }
            
            .energy-source.collected {
                animation: collect 0.3s ease-out forwards;
            }
            
            @keyframes glow {
                from {
                    filter: drop-shadow(0 0 5px rgba(0, 255, 0, 0.3));
                }
                to {
                    filter: drop-shadow(0 0 15px rgba(0, 255, 0, 0.8));
                }
            }
            
            @keyframes collect {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                100% {
                    transform: scale(0.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        return {
            cleanup: () => {
                clearInterval(spawnInterval);
                animationIntervals.forEach(interval => clearInterval(interval));
                const s = document.getElementById('greenergy-styles');
                if (s) s.remove();
            }
        };
    }
};
