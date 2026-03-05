window.Microgames = window.Microgames || {};

window.Microgames.beach = {
    id: 'beach',
    instruction: '¡LIMPIA LA PLAYA!',
    setup: (container, difficulty, game) => {
        const beach = document.createElement('div');
        beach.className = 'beach-container';
        container.appendChild(beach);

        const bin = document.createElement('div');
        bin.className = 'trash-can';
        bin.innerHTML = '🗑️';
        beach.appendChild(bin);

        const trashEmojis = ['🧴', '🥫', '🍕', '🥤', '🍌', '🦴'];
        const numItems = 2 + Math.min(2, Math.floor(difficulty / 10));
        let itemsLeft = numItems;

        const createTrash = () => {
            const item = document.createElement('div');
            item.className = 'trash-item';
            item.innerHTML = trashEmojis[Math.floor(Math.random() * trashEmojis.length)];

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

                if (dist < 70) {
                    item.style.transform = 'scale(0)';
                    item.style.opacity = '0';
                    setTimeout(() => item.remove(), 200);
                    bin.classList.remove('hover');
                    itemsLeft--;

                    if (itemsLeft <= 0) {
                        game.onWin();
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

        setTimeout(() => {
            for (let i = 0; i < numItems; i++) {
                createTrash();
            }
        }, 50);

        return { cleanup: () => { } };
    }
};
