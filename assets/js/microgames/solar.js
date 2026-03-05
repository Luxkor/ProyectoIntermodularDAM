/* ============================================================
   SOLAR PANEL – Microgame for MicroRush  (v2)
   - La PLACA se mueve automáticamente de izquierda a derecha
     (igual que el camión en trash_truck.js).
   - El JUGADOR mueve el RAYO solar con el ratón apuntando
     hacia donde quiere que caiga el rayo.
   - Mientras el rayo incide en la placa → energía sube.
   - Si el rayo no da en la placa → energía baja lentamente.
   - Llega al 100 % para ganar.
   ============================================================ */

window.Microgames = window.Microgames || {};

window.Microgames.solar = {
    id: 'solar',
    instruction: '¡APUNTA EL RAYO A LA PLACA!',

    setup(container, score, game) {

        /* ---- CONFIG por dificultad (score) ----------------- */
        const diff = Math.floor(score / 5);
        const panelSpeed = 1.5 + diff * 0.5;          // como el camión, crece con diff
        const panelW = Math.max(80, 150 - diff * 10); // panel más estrecho al subir
        const PANEL_H = 14;

        /* ---- Canvas ---------------------------------------- */
        const canvas = document.createElement('canvas');
        canvas.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;border-radius:15px;cursor:crosshair;';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let W, H;
        function resize() {
            const r = container.getBoundingClientRect();
            W = r.width || container.offsetWidth || 520;
            H = r.height || container.offsetHeight || 220;
            canvas.width = W;
            canvas.height = H;
        }
        resize();

        /* ---- Sol (fijo en la parte superior-central) ------- */
        const SUN_R = Math.min(W, H) * 0.12;
        const SUN_X = W / 2;
        const SUN_Y = H * 0.22;

        /* ---- Placa (se mueve como el camión) --------------- */
        const PANEL_Y = H * 0.80;
        const panel = {
            x: W / 2 - panelW / 2,
            dir: 1,
            speed: panelSpeed,
            update() {
                this.x += this.speed * this.dir;
                if (this.x + panelW >= W) { this.x = W - panelW; this.dir = -1; }
                if (this.x <= 0) { this.x = 0; this.dir = 1; }
            },
            get left() { return this.x; },
            get right() { return this.x + panelW; },
            get centerX() { return this.x + panelW / 2; }
        };

        /* ---- Rayo: ángulo determinado por la posición del ratón ---- */
        // El rayo parte del sol y apunta hacia donde está el cursor.
        let mouseX = W / 2;
        let mouseY = H;       // por defecto apunta recto hacia abajo

        function getPos(e) {
            const r = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: src.clientX - r.left, y: src.clientY - r.top };
        }

        function onMove(e) {
            const p = getPos(e);
            mouseX = p.x;
            mouseY = p.y;
            if (e.cancelable) e.preventDefault();
        }

        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('touchmove', onMove, { passive: false });
        canvas.addEventListener('touchstart', onMove, { passive: false });

        /* ---- Estado ---------------------------------------- */
        let energy = 0;
        let finished = false;
        let rafId = null;

        /* ---- Colisión rayo ↔ placa ------------------------- */
        function checkHit() {
            // Dirección del rayo (del sol al cursor)
            const dx = mouseX - SUN_X;
            const dy = mouseY - SUN_Y;
            if (dy <= 0) return false;   // apunta hacia arriba, no puede dar en la placa

            // Parámetro t cuando el rayo cruza y = PANEL_Y
            const t = (PANEL_Y - SUN_Y) / dy;
            const ix = SUN_X + dx * t;   // intersección X con la línea de la placa

            return ix >= panel.left && ix <= panel.right;
        }

        /* ---- Dibujo ---------------------------------------- */
        function drawSky() {
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#1a1a2e');
            grad.addColorStop(0.45, '#16213e');
            grad.addColorStop(1, '#0f3460');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Estrellas estáticas
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            for (let i = 0; i < 28; i++) {
                const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * W;
                const sy = (Math.sin(i * 311.7) * 0.5 + 0.5) * H * 0.6;
                const sr = 0.5 + (Math.sin(i * 73.3) * 0.5 + 0.5) * 1.5;
                ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
            }
        }

        function drawRay(hit) {
            const dx = mouseX - SUN_X;
            const dy = mouseY - SUN_Y;
            const len = Math.hypot(dx, dy);
            if (len === 0) return;
            const nx = dx / len, ny = dy / len;
            const ex = SUN_X + nx * Math.max(W, H) * 2;
            const ey = SUN_Y + ny * Math.max(W, H) * 2;

            const grad = ctx.createLinearGradient(SUN_X, SUN_Y, ex, ey);
            grad.addColorStop(0, hit ? 'rgba(255,240,0,0.95)' : 'rgba(255,210,0,0.75)');
            grad.addColorStop(0.5, hit ? 'rgba(255,180,0,0.55)' : 'rgba(255,160,0,0.30)');
            grad.addColorStop(1, 'rgba(255,130,0,0)');

            ctx.save();
            ctx.lineWidth = hit ? 14 : 9;
            ctx.strokeStyle = grad;
            ctx.shadowColor = '#ffd600';
            ctx.shadowBlur = hit ? 32 : 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(SUN_X, SUN_Y);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            // Destellos en el punto de impacto sobre la placa
            if (hit) {
                const t = (PANEL_Y - SUN_Y) / ny;
                const ix = SUN_X + nx * t;
                ctx.globalAlpha = 0.5 + 0.45 * Math.sin(performance.now() * 0.025);
                ctx.fillStyle = '#ffe082';
                ctx.shadowBlur = 28;
                ctx.beginPath(); ctx.arc(ix, PANEL_Y, 10, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }

        function drawSun() {
            // Halo exterior
            const glow = ctx.createRadialGradient(SUN_X, SUN_Y, SUN_R * 0.4, SUN_X, SUN_Y, SUN_R * 2.4);
            glow.addColorStop(0, 'rgba(255,220,50,0.35)');
            glow.addColorStop(1, 'rgba(255,140, 0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(SUN_X, SUN_Y, SUN_R * 2.4, 0, Math.PI * 2); ctx.fill();

            // Corona
            ctx.save();
            ctx.translate(SUN_X, SUN_Y);
            const spikes = 12;
            for (let i = 0; i < spikes; i++) {
                const ang = (i / spikes) * Math.PI * 2 + performance.now() * 0.0007;
                ctx.strokeStyle = `rgba(255,${170 + i * 6},0,0.5)`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * SUN_R * 1.12, Math.sin(ang) * SUN_R * 1.12);
                ctx.lineTo(Math.cos(ang) * SUN_R * 1.58, Math.sin(ang) * SUN_R * 1.58);
                ctx.stroke();
            }
            ctx.restore();

            // Cuerpo
            const body = ctx.createRadialGradient(
                SUN_X - SUN_R * 0.2, SUN_Y - SUN_R * 0.2, SUN_R * 0.1,
                SUN_X, SUN_Y, SUN_R);
            body.addColorStop(0, '#fff9c4');
            body.addColorStop(0.5, '#ffd600');
            body.addColorStop(1, '#ff8f00');
            ctx.fillStyle = body;
            ctx.beginPath(); ctx.arc(SUN_X, SUN_Y, SUN_R, 0, Math.PI * 2); ctx.fill();

            ctx.font = `${Math.floor(SUN_R * 0.85)}px serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('☀', SUN_X, SUN_Y + 1);
        }

        function drawPanel(hit) {
            const px = panel.x;
            const py = PANEL_Y - PANEL_H / 2;

            // Soporte
            ctx.fillStyle = '#607d8b';
            ctx.fillRect(panel.centerX - 4, PANEL_Y + PANEL_H / 2, 8, H - PANEL_Y - PANEL_H / 2);

            // Panel
            const pg = ctx.createLinearGradient(px, 0, px + panelW, 0);
            pg.addColorStop(0, hit ? '#fff176' : '#1565c0');
            pg.addColorStop(0.5, hit ? '#ffee58' : '#1976d2');
            pg.addColorStop(1, hit ? '#fff176' : '#1565c0');
            ctx.fillStyle = pg;
            ctx.beginPath(); ctx.roundRect(px, py, panelW, PANEL_H, 4); ctx.fill();

            // Borde
            ctx.strokeStyle = hit ? '#ffd600' : '#90caf9';
            ctx.lineWidth = 2;
            if (hit) { ctx.shadowColor = '#ffd600'; ctx.shadowBlur = 18; }
            ctx.beginPath(); ctx.roundRect(px, py, panelW, PANEL_H, 4); ctx.stroke();
            ctx.shadowBlur = 0;

            // Rejilla
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const lx = px + panelW * (i / 4);
                ctx.beginPath(); ctx.moveTo(lx, py); ctx.lineTo(lx, py + PANEL_H); ctx.stroke();
            }

            // Flecha indicando dirección de movimiento
            const arrowX = panel.dir === 1 ? panel.right + 10 : panel.left - 10;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(panel.dir === 1 ? '→' : '←', arrowX, PANEL_Y);
        }

        function drawEnergyBar() {
            const BAR_W = Math.min(W * 0.55, 280);
            const BAR_H = 20;
            const bx = (W - BAR_W) / 2;
            const by = H * 0.91;

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('⚡ ENERGÍA', W / 2, by - 7);

            // Track
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath(); ctx.roundRect(bx, by, BAR_W, BAR_H, 10); ctx.fill();

            // Fill
            if (energy > 0) {
                const fg = ctx.createLinearGradient(bx, 0, bx + BAR_W, 0);
                fg.addColorStop(0, '#aeea00');
                fg.addColorStop(0.5, '#ffd600');
                fg.addColorStop(1, '#ff6d00');
                ctx.fillStyle = fg;
                ctx.shadowColor = '#ffd600';
                ctx.shadowBlur = energy > 60 ? 14 : 5;
                ctx.beginPath(); ctx.roundRect(bx, by, BAR_W * (energy / 100), BAR_H, 10); ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(bx, by, BAR_W, BAR_H, 10); ctx.stroke();

            // %
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.floor(energy)}%`, W / 2, by + BAR_H / 2);
        }

        /* ---- Main loop ------------------------------------- */
        function update() {
            if (finished) return;

            panel.update();

            const hit = checkHit();

            if (hit) {
                energy = Math.min(100, energy + 1.2 + diff * 0.15);
            } else {
                energy = Math.max(0, energy - 0.45);
            }

            ctx.clearRect(0, 0, W, H);
            drawSky();
            drawRay(hit);
            drawSun();
            drawPanel(hit);
            drawEnergyBar();

            if (energy >= 100 && !finished) {
                finished = true;
                cancelAnimationFrame(rafId);
                game.onWin();
                return;

            }

            rafId = requestAnimationFrame(update);
        }

        update();

        /* ---- Cleanup --------------------------------------- */
        return {
            cleanup() {
                finished = true;
                cancelAnimationFrame(rafId);
                canvas.removeEventListener('mousemove', onMove);
                canvas.removeEventListener('touchmove', onMove);
                canvas.removeEventListener('touchstart', onMove);
                canvas.remove();
            }
        };
    }
};
