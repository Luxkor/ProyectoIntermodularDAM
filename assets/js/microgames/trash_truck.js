/* ============================================================
   TRASH TRUCK – Microgame for MicroRush
   Mete todas las bolsas de basura al camión en movimiento.
   Sigue el mismo patrón que beach.js:
     window.Microgames.trashTruck = { id, instruction, setup }
   ============================================================ */

window.Microgames = window.Microgames || {};

window.Microgames.trashTruck = {
    id: 'trashTruck',
    instruction: '¡METE LAS BOLSAS AL CAMIÓN!',

    setup(container, score, game) {
        /* ---- CONFIG basada en dificultad (score) ----------- */
        const diffLevel = Math.floor(score / 5);            // cada 5 puntos sube
        const truckSpeed = 1.8 + diffLevel * 0.55;           // px/frame
        const bagCount = Math.min(1 + Math.floor(diffLevel * 0.6), 4);
        const GRAVITY = 0.42;
        const BOUNCE = 0.28;
        const FRICTION = 0.87;
        const BAG_R = 22;

        /* ---- Crear canvas dentro del container ------------- */
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border-radius:15px;cursor:default;';
        // Make container relative so canvas overlays correctly
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.appendChild(canvas);

        let W, H, groundY;

        function resize() {
            const rect = container.getBoundingClientRect();
            W = rect.width || container.offsetWidth || 520;
            H = rect.height || container.offsetHeight || 220;
            canvas.width = W;
            canvas.height = H;
            groundY = H * 0.78;
        }
        resize();

        const ctx = canvas.getContext('2d');

        /* ---- TRUCK ----------------------------------------- */
        const truck = {
            w: Math.min(W * 0.28, 145),
            h: 0,
            x: 0,
            y: 0,
            speed: truckSpeed,
            dir: 1,
            init() {
                this.h = this.w * 0.58;
                this.x = Math.random() * (W - this.w);
                this.y = groundY - this.h;
            },
            get openLeft() { return this.x + this.w * 0.12; },
            get openRight() { return this.x + this.w * 0.65; },
            get openTop() { return this.y + this.h * 0.08; },
            update() {
                this.x += this.speed * this.dir;
                if (this.x + this.w >= W) { this.x = W - this.w; this.dir = -1; }
                if (this.x <= 0) { this.x = 0; this.dir = 1; }
                this.y = groundY - this.h;
            },
            draw() {
                const { x, y, w, h, dir } = this;
                // Body
                ctx.fillStyle = '#2e7d32';
                roundRect(ctx, x + w * 0.04, y + h * 0.28, w * 0.91, h * 0.68, 8);
                ctx.fill();
                // Top shade
                ctx.fillStyle = '#43a047';
                roundRect(ctx, x + w * 0.04, y + h * 0.28, w * 0.91, h * 0.22, 8);
                ctx.fill();
                // Hopper (opening top)
                ctx.fillStyle = '#1b5e20';
                ctx.fillRect(x + w * 0.11, y + h * 0.05, w * 0.54, h * 0.26);
                // Cab
                const cabX = dir === 1 ? x + w * 0.59 : x;
                ctx.fillStyle = '#00897b';
                roundRect(ctx, cabX, y + h * 0.32, w * 0.36, h * 0.62, 8);
                ctx.fill();
                // Windshield
                ctx.fillStyle = 'rgba(180,230,255,0.65)';
                ctx.fillRect(cabX + w * 0.05, y + h * 0.36, w * 0.24, h * 0.21);
                // Wheels
                const wy = y + h * 0.93;
                const wPositions = dir === 1
                    ? [x + w * 0.18, x + w * 0.52, x + w * 0.80]
                    : [x + w * 0.20, x + w * 0.48, x + w * 0.82];
                wPositions.forEach(wx => {
                    ctx.fillStyle = '#212121';
                    ctx.beginPath(); ctx.arc(wx, wy, h * 0.12, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#9e9e9e';
                    ctx.beginPath(); ctx.arc(wx, wy, h * 0.055, 0, Math.PI * 2); ctx.fill();
                });
                // Arrow hint
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.font = `bold ${Math.floor(h * 0.22)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('↓', x + w * 0.38, y + h * 0.24);
            }
        };
        truck.init();

        /* ---- BAGS ------------------------------------------ */
        const BAG_PALETTE = ['#388e3c', '#1565c0', '#6a1b9a', '#bf360c', '#37474f', '#00838f'];
        const bags = [];

        for (let i = 0; i < bagCount; i++) {
            const spread = W * 0.7;
            const startX = W * 0.15 + (bagCount === 1 ? spread / 2 : (i / (bagCount - 1)) * spread);
            bags.push({
                x: startX,
                y: groundY - BAG_R,
                vx: 0, vy: 0,
                color: BAG_PALETTE[i % BAG_PALETTE.length],
                onGround: true,
                scored: false,
                dragged: false,
                offX: 0, offY: 0,
            });
        }

        /* ---- EFFECTS --------------------------------------- */
        let effects = [];
        function spawnFx(x, y, txt) {
            effects.push({ x, y, txt, life: 1.0 });
        }

        /* ---- HELPERS --------------------------------------- */
        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
        }

        function drawBag(bag) {
            if (bag.scored) return;
            const { x, y, color } = bag;
            // Shadow
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(x, groundY + 3, BAG_R * 0.85, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Body
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(x, y, BAG_R, 0, Math.PI * 2); ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.beginPath(); ctx.arc(x - BAG_R * 0.28, y - BAG_R * 0.28, BAG_R * 0.38, 0, Math.PI * 2); ctx.fill();
            // Tie
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - BAG_R + 4);
            ctx.bezierCurveTo(x - 9, y - BAG_R - 7, x + 9, y - BAG_R - 7, x + 5, y - BAG_R + 4);
            ctx.stroke();
            // Icon
            ctx.font = `${Math.floor(BAG_R * 0.9)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🗑', x, y + 2);
            ctx.restore();
        }

        function drawGround() {
            ctx.fillStyle = '#546e7a';
            ctx.fillRect(0, groundY, W, H - groundY);
            ctx.fillStyle = '#455a64';
            ctx.fillRect(0, groundY, W, 5);
            // Dashed centre line
            ctx.save();
            ctx.setLineDash([22, 16]);
            ctx.strokeStyle = '#ffee00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, groundY + (H - groundY) * 0.52);
            ctx.lineTo(W, groundY + (H - groundY) * 0.52);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        function drawSky() {
            const grad = ctx.createLinearGradient(0, 0, 0, groundY);
            grad.addColorStop(0, '#87CEEB');
            grad.addColorStop(1, '#b8e0f7');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, groundY);
            // trees
            [[0.05, 1], [0.2, 0.85], [0.5, 0.9], [0.78, 0.95], [0.93, 0.88]].forEach(([tx, sc]) => {
                const bx = W * tx, th = groundY * 0.35 * sc;
                ctx.fillStyle = '#6d4c41';
                ctx.fillRect(bx - 3, groundY - th * 0.4, 6, th * 0.4);
                ctx.fillStyle = '#388e3c';
                ctx.beginPath(); ctx.arc(bx, groundY - th * 0.4 - th * 0.35, th * 0.28, 0, Math.PI * 2); ctx.fill();
            });
            // clouds
            [[0.12, 18], [0.42, 12], [0.72, 20]].forEach(([cx, cy]) => {
                ctx.fillStyle = 'rgba(255,255,255,0.82)';
                [[0, 0, 18], [20, -7, 13], [-18, -5, 11], [34, 2, 10], [-32, 3, 10]].forEach(([dx, dy, r]) => {
                    ctx.beginPath(); ctx.arc(W * cx + dx, cy + dy, r, 0, Math.PI * 2); ctx.fill();
                });
            });
        }

        function drawFx() {
            effects.forEach(e => {
                ctx.save();
                ctx.globalAlpha = e.life;
                ctx.font = 'bold 22px sans-serif';
                ctx.fillStyle = '#ffd700';
                ctx.textAlign = 'center';
                ctx.fillText(e.txt, e.x, e.y);
                ctx.restore();
                e.y -= 1.2;
                e.life -= 0.025;
            });
            effects = effects.filter(e => e.life > 0);
        }

        /* ---- DRAG ------------------------------------------ */
        let dragging = null;
        let lastMX = 0, lastMY = 0, velX = 0, velY = 0;

        function getPos(e) {
            const r = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: src.clientX - r.left, y: src.clientY - r.top };
        }

        function onDown(e) {
            const { x, y } = getPos(e);
            let best = null, bd = Infinity;
            bags.forEach(bag => {
                if (bag.scored) return;
                const d = Math.hypot(x - bag.x, y - bag.y);
                if (d < BAG_R + 12 && d < bd) { bd = d; best = bag; }
            });
            if (best) {
                dragging = best;
                best.dragged = true;
                best.onGround = false;
                best.vx = best.vy = 0;
                best.offX = x - best.x;
                best.offY = y - best.y;
                lastMX = x; lastMY = y;
                canvas.style.cursor = 'grabbing';
                if (e.cancelable) e.preventDefault();
            }
        }

        function onMove(e) {
            const { x, y } = getPos(e);
            velX = x - lastMX;
            velY = y - lastMY;
            lastMX = x; lastMY = y;
            if (dragging) {
                dragging.x = x - dragging.offX;
                dragging.y = y - dragging.offY;
            }
            if (e.cancelable) e.preventDefault();
        }

        function onUp(e) {
            if (dragging) {
                dragging.vx = velX * 0.55;
                dragging.vy = velY * 0.55;
                dragging.dragged = false;
                dragging = null;
                canvas.style.cursor = 'default';
            }
        }

        canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        canvas.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);

        /* ---- MAIN LOOP ------------------------------------ */
        let rafId = null;
        let finished = false;

        function update() {
            if (finished) return;
            ctx.clearRect(0, 0, W, H);

            drawSky();
            drawGround();
            truck.update();
            truck.draw();

            bags.forEach(bag => {
                if (bag.scored || bag.dragged) { drawBag(bag); return; }

                bag.vy += GRAVITY;
                bag.x += bag.vx;
                bag.y += bag.vy;
                bag.vx *= FRICTION;

                // Ground
                if (bag.y + BAG_R >= groundY) {
                    bag.y = groundY - BAG_R;
                    bag.vy = -bag.vy * BOUNCE;
                    bag.vx *= 0.82;
                    if (Math.abs(bag.vy) < 0.6) { bag.vy = 0; bag.onGround = true; }
                }
                // Wall clamp
                if (bag.x - BAG_R < 0) { bag.x = BAG_R; bag.vx = Math.abs(bag.vx) * 0.5; }
                if (bag.x + BAG_R > W) { bag.x = W - BAG_R; bag.vx = -Math.abs(bag.vx) * 0.5; }

                // Score check
                const inX = bag.x > truck.openLeft && bag.x < truck.openRight;
                const inY = bag.y - BAG_R < truck.openTop + 18 && bag.y + BAG_R > truck.openTop - 10;
                if (inX && inY && bag.vy > 0) {
                    bag.scored = true;
                    spawnFx(bag.x, truck.y - 10, '✅ +1');
                }

                drawBag(bag);
            });

            drawFx();

            // Win condition
            if (!finished && bags.every(b => b.scored)) {
                finished = true;
                cancelAnimationFrame(rafId);
                game.onWin();
                return;

            }

            rafId = requestAnimationFrame(update);
        }

        update();

        /* ---- CLEANUP -------------------------------------- */
        return {
            cleanup() {
                finished = true;
                cancelAnimationFrame(rafId);
                canvas.removeEventListener('mousedown', onDown);
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                canvas.removeEventListener('touchstart', onDown);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onUp);
                canvas.remove();
            }
        };
    }
};
