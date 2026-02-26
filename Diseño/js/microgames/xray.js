window.Microgames = window.Microgames || {};

window.Microgames.xray = {
    id: 'xray',
    instruction: '¡ENCUÉNTRALO!',
    setup: (container, score, game) => {
        const xrayContainer = document.createElement('div');
        xrayContainer.className = 'xray-container';
        container.appendChild(xrayContainer);

        const target = document.createElement('div');
        target.className = 'xray-target';
        const gems = ['💎', '🏆', '👑', '🔑', '⭐'];
        target.innerHTML = gems[Math.floor(Math.random() * gems.length)];

        // Random position
        const x = 50 + Math.random() * (container.clientWidth - 100);
        const y = 50 + Math.random() * (container.clientHeight - 100);
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        xrayContainer.appendChild(target);

        const overlay = document.createElement('div');
        overlay.className = 'xray-overlay';
        xrayContainer.appendChild(overlay);

        const moveHandler = (e) => {
            const rect = xrayContainer.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const mx = clientX - rect.left;
            const my = clientY - rect.top;

            // Adjust light size based on difficulty
            const radius = Math.max(40, 80 - Math.floor(score / 5) * 5);
            overlay.style.background = `radial-gradient(circle at ${mx}px ${my}px, transparent ${radius}px, rgba(0, 0, 0, 0.95) ${radius + 40}px)`;
        };

        let hasFound = false;
        target.onclick = (e) => {
            if (hasFound) return;
            hasFound = true;
            target.style.pointerEvents = 'none'; // Disable further clicks
            xrayContainer.style.cursor = 'default';

            e.stopPropagation();
            target.style.transform = 'scale(2)';
            target.style.filter = 'brightness(2) drop-shadow(0 0 10px #00f3ff)';
            setTimeout(() => game.onWin(), 200);
        };

        xrayContainer.addEventListener('mousemove', moveHandler);
        xrayContainer.addEventListener('touchmove', moveHandler, { passive: false });

        const style = document.createElement('style');
        style.id = 'xray-styles';
        style.textContent = `
            .xray-container {
                position: relative;
                width: 100%;
                height: 100%;
                background: #1a1a1a;
                overflow: hidden;
                cursor: none;
                border-radius: 20px;
            }
            .xray-target {
                position: absolute;
                font-size: 40px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                user-select: none;
                z-index: 1;
                transition: transform 0.2s;
            }
            .xray-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                pointer-events: none;
                z-index: 2;
            }
        `;
        document.head.appendChild(style);

        return {
            cleanup: () => {
                const s = document.getElementById('xray-styles');
                if (s) s.remove();
                xrayContainer.removeEventListener('mousemove', moveHandler);
                xrayContainer.removeEventListener('touchmove', moveHandler);
            }
        };
    }
};
