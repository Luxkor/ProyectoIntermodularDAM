/* ============================================================
   PIGEON PEACE – Microgame for MicroRush  v4
   Esquiva balas con WASD.  Canvas puro, sin emojis ni roundRect.
   Restaura los estilos del contenedor en cleanup para no romper
   otros minijuegos.
   ============================================================ */

window.Microgames = window.Microgames || {};

window.Microgames.pigeon = {
    id: 'pigeon',
    isSurvival: true,
    instruction: '\u00a1ESQUIVA LAS BALAS! [WASD]',

    setup: function (container, score, game) {

        /* ---- Guardar estilos originales del contenedor ------ */
        var origPosition = container.style.position;
        var origOverflow = container.style.overflow;

        /* ---- Canvas ----------------------------------------- */
        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '15px';

        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.appendChild(canvas);

        var ctx = canvas.getContext('2d');

        /* ---- Leer tamaño real del contenedor ---------------- */
        var W = 520, H = 500;
        function readSize() {
            var r = container.getBoundingClientRect();
            var w = r.width || container.offsetWidth || 520;
            var h = r.height || container.offsetHeight || 500;
            if (w > 10 && h > 10) { W = w; H = h; }
            canvas.width = W;
            canvas.height = H;
        }
        readSize();
        // Segundo intento por si el layout aún no ha pintado
        setTimeout(readSize, 50);

        /* ---- Config por dificultad -------------------------- */
        var diff = Math.floor(score / 5);
        var PLAYER_SPEED = 5 + Math.min(4, diff * 0.6);
        var SPAWN_MS = Math.max(120, 450 - diff * 50);  // spawn más frecuente
        var BULLET_SPEED = 6 + diff * 1.2;                  // velocidad base alta y escala rápido
        // Sobrevivir el tiempo exacto del juego principal
        var gameMaxTime = (game && game.maxTime) ? game.maxTime : 4000;
        var SURVIVE_MS = gameMaxTime;

        /* ---- Estado del juego ------------------------------- */
        var player = { x: W / 2, y: H * 0.72, r: 22, wing: 0, flip: false };
        var bullets = [];
        var lastSpawn = 0;
        var finished = false;
        var rafId = null;
        var elapsed = 0;
        var prevTime = 0;

        /* ---- Nubes estáticas (se mueven lentamente) --------- */
        var clouds = [];
        for (var ci = 0; ci < 5; ci++) {
            clouds.push({
                x: Math.random() * W,
                y: 30 + Math.random() * H * 0.3,
                r: 22 + Math.random() * 28,
                sp: 0.25 + Math.random() * 0.3
            });
        }

        /* ---- Teclado ---------------------------------------- */
        var keys = {};
        function handleKeydown(e) { keys[e.key.toLowerCase()] = true; }
        function handleKeyup(e) { keys[e.key.toLowerCase()] = false; }
        window.addEventListener('keydown', handleKeydown);
        window.addEventListener('keyup', handleKeyup);

        /* ---- Victoria: sobrevivir SURVIVE_MS milisegundos ---- */
        var survivalTimeout = setTimeout(function () {
            if (!finished) { finished = true; game.onWin(); }
        }, SURVIVE_MS);

        /* ---- Dibujar paloma (solo bezier, arc, lines) ------- */
        function drawPigeon(px, py, wingA, flip) {
            ctx.save();
            ctx.translate(px, py);
            if (flip) ctx.scale(-1, 1);

            var w = Math.sin(wingA * 8) * 12;  // amplitud del bateo

            // Ala trasera
            ctx.fillStyle = '#c8d4e8';
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.bezierCurveTo(-28, -5 + w, -32, 10 + w, -14, 10);
            ctx.closePath();
            ctx.fill();

            // Cuerpo oval (dos arcos)
            ctx.fillStyle = '#f0f4fa';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();

            // Pecho rosado
            ctx.fillStyle = '#f8dde2';
            ctx.beginPath();
            ctx.arc(8, 6, 10, 0, Math.PI * 2);
            ctx.fill();

            // Ala delantera
            ctx.fillStyle = '#e2eaf8';
            ctx.beginPath();
            ctx.moveTo(-4, -4);
            ctx.bezierCurveTo(-26, -16 - w, -30, -4 - w, -10, 6);
            ctx.closePath();
            ctx.fill();

            // Contorno cuerpo
            ctx.strokeStyle = '#b0bcd0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.stroke();

            // Cola
            ctx.fillStyle = '#ccd8ec';
            ctx.beginPath();
            ctx.moveTo(-17, -4);
            ctx.lineTo(-34, -9);
            ctx.lineTo(-32, 0);
            ctx.lineTo(-34, 9);
            ctx.lineTo(-17, 4);
            ctx.closePath();
            ctx.fill();

            // Cabeza
            ctx.fillStyle = '#f0f4fa';
            ctx.beginPath();
            ctx.arc(18, -10, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b0bcd0';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Ojo negro
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(22, -13, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Brillo ojo
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(23, -14.5, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Pico naranja
            ctx.fillStyle = '#f0a020';
            ctx.beginPath();
            ctx.moveTo(28, -12);
            ctx.lineTo(40, -10);
            ctx.lineTo(28, -7);
            ctx.closePath();
            ctx.fill();

            // ---- Rama de olivo en el pico --------------------
            ctx.save();
            ctx.translate(34, -10);
            // Tallo principal
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 1.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(4, -6, 10, -10, 16, -14);
            ctx.stroke();
            // Hoja 1
            ctx.fillStyle = '#388e3c';
            ctx.beginPath();
            ctx.save();
            ctx.translate(8, -8);
            ctx.rotate(-0.6);
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.restore();
            ctx.fill();
            // Hoja 2
            ctx.beginPath();
            ctx.save();
            ctx.translate(13, -12);
            ctx.rotate(-0.9);
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.restore();
            ctx.fill();
            // Hoja 3 (punta)
            ctx.fillStyle = '#43a047';
            ctx.beginPath();
            ctx.save();
            ctx.translate(16, -14);
            ctx.rotate(-1.2);
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.restore();
            ctx.fill();
            // Pequeñas bayas
            ctx.fillStyle = '#66bb6a';
            ctx.beginPath();
            ctx.arc(5, -5, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.arc(11, -10, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Patas
            ctx.strokeStyle = '#d08010';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(3, 17); ctx.lineTo(3, 27);
            ctx.moveTo(3, 27); ctx.lineTo(-4, 34);
            ctx.moveTo(3, 27); ctx.lineTo(10, 34);
            ctx.moveTo(12, 17); ctx.lineTo(12, 27);
            ctx.moveTo(12, 27); ctx.lineTo(5, 34);
            ctx.moveTo(12, 27); ctx.lineTo(19, 34);
            ctx.stroke();

            ctx.restore();
        }

        /* ---- Dibujar bala ----------------------------------- */
        function drawBullet(b) {
            ctx.save();
            // Estela
            ctx.strokeStyle = 'rgba(255,100,0,0.35)';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - 28);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            // Cuerpo
            ctx.fillStyle = '#c0cad4';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * 0.56, 0, Math.PI * 2);
            ctx.fill();
            // Punta
            ctx.fillStyle = '#b07800';
            ctx.beginPath();
            ctx.arc(b.x, b.y - b.r * 0.38, b.r * 0.44, 0, Math.PI * 2);
            ctx.fill();
            // Brillo
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(b.x - b.r * 0.2, b.y - b.r * 0.05, b.r * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        /* ---- Dibujar nubes ---------------------------------- */
        function drawClouds() {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            for (var i = 0; i < clouds.length; i++) {
                var c = clouds[i];
                c.x += c.sp;
                if (c.x > W + c.r * 3) c.x = -c.r * 3;
                ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(c.x + c.r, c.y - c.r * 0.4, c.r * 0.72, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(c.x - c.r, c.y - c.r * 0.2, c.r * 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(c.x + c.r * 1.8, c.y + c.r * 0.1, c.r * 0.5, 0, Math.PI * 2); ctx.fill();
            }
        }

        /* ---- Barra de progreso (sin roundRect) -------------- */
        function drawProgressBar() {
            var pct = Math.min(1, elapsed / SURVIVE_MS);
            var bW = W * 0.55;
            var bX = (W - bW) / 2;
            var bY = H - 24;
            var bH = 10;
            var bR = 5;

            // Track (manual rounded rect con arc)
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(bX + bR, bY);
            ctx.lineTo(bX + bW - bR, bY);
            ctx.arc(bX + bW - bR, bY + bR, bR, -Math.PI / 2, 0);
            ctx.lineTo(bX + bW, bY + bH - bR);
            ctx.arc(bX + bW - bR, bY + bH - bR, bR, 0, Math.PI / 2);
            ctx.lineTo(bX + bR, bY + bH);
            ctx.arc(bX + bR, bY + bH - bR, bR, Math.PI / 2, Math.PI);
            ctx.lineTo(bX, bY + bR);
            ctx.arc(bX + bR, bY + bR, bR, Math.PI, -Math.PI / 2);
            ctx.closePath();
            ctx.fill();

            // Fill
            if (pct > 0.01) {
                var fw = bW * pct;
                var frR = Math.min(bR, fw / 2);
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.moveTo(bX + frR, bY);
                ctx.lineTo(bX + fw - frR, bY);
                ctx.arc(bX + fw - frR, bY + frR, frR, -Math.PI / 2, 0);
                ctx.lineTo(bX + fw, bY + bH - frR);
                ctx.arc(bX + fw - frR, bY + bH - frR, frR, 0, Math.PI / 2);
                ctx.lineTo(bX + frR, bY + bH);
                ctx.arc(bX + frR, bY + bH - frR, frR, Math.PI / 2, Math.PI);
                ctx.lineTo(bX, bY + frR);
                ctx.arc(bX + frR, bY + frR, frR, Math.PI, -Math.PI / 2);
                ctx.closePath();
                ctx.fill();
            }

            // Texto
            var sec = Math.ceil((SURVIVE_MS - elapsed) / 1000);
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\u00a1AGUANTA! ' + sec + 's', W / 2, bY - 13);
        }

        /* ---- Bucle principal -------------------------------- */
        function update(now) {
            if (finished) return;

            if (prevTime === 0) prevTime = now;
            var dt = Math.min(now - prevTime, 60);
            prevTime = now;
            elapsed += dt;

            // Movimiento
            if (keys['w'] || keys['arrowup']) player.y -= PLAYER_SPEED;
            if (keys['s'] || keys['arrowdown']) player.y += PLAYER_SPEED;
            if (keys['a'] || keys['arrowleft']) { player.x -= PLAYER_SPEED; player.flip = true; }
            if (keys['d'] || keys['arrowright']) { player.x += PLAYER_SPEED; player.flip = false; }

            // Re-leer tamaño por si cambió (p.ej. pantalla completa)
            var rW = canvas.parentElement ? (canvas.parentElement.getBoundingClientRect().width || W) : W;
            var rH = canvas.parentElement ? (canvas.parentElement.getBoundingClientRect().height || H) : H;
            if (Math.abs(rW - W) > 5 || Math.abs(rH - H) > 5) {
                W = rW; H = rH;
                canvas.width = W;
                canvas.height = H;
                player.x = Math.min(player.x, W - player.r - 10);
                player.y = Math.min(player.y, H - player.r - 36);
            }

            player.x = Math.max(player.r + 10, Math.min(W - player.r - 10, player.x));
            player.y = Math.max(player.r + 10, Math.min(H - player.r - 36, player.y));
            player.wing += 0.07;

            // Spawn balas
            var nowMs = Date.now();
            if (nowMs - lastSpawn > SPAWN_MS) {
                bullets.push({
                    x: 20 + Math.random() * (W - 40),
                    y: -25,
                    r: 9 + Math.random() * 4,
                    sp: BULLET_SPEED + Math.random() * 1.5
                });
                lastSpawn = nowMs;
            }

            /* ---- Pintar ---- */
            ctx.clearRect(0, 0, W, H);

            // Cielo degradado
            var sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, '#1a6fe8');
            sky.addColorStop(0.6, '#5ab6f8');
            sky.addColorStop(1, '#b8e4ff');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H);

            drawClouds();

            // Balas
            for (var i = bullets.length - 1; i >= 0; i--) {
                var b = bullets[i];
                b.y += b.sp;
                drawBullet(b);

                var dx = b.x - player.x;
                var dy = b.y - player.y;
                if (Math.sqrt(dx * dx + dy * dy) < player.r + b.r * 0.48) {
                    finished = true;
                    clearTimeout(survivalTimeout);
                    game.onFail();
                    return;
                }

                if (b.y > H + 60) bullets.splice(i, 1);
            }

            // Paloma
            drawPigeon(player.x, player.y, player.wing, player.flip);

            drawProgressBar();

            rafId = requestAnimationFrame(update);
        }

        rafId = requestAnimationFrame(update);

        /* ---- Cleanup: restaurar estilos del contenedor ------ */
        return {
            onInput: function () { },
            cleanup: function () {
                finished = true;
                cancelAnimationFrame(rafId);
                clearTimeout(survivalTimeout);
                window.removeEventListener('keydown', handleKeydown);
                window.removeEventListener('keyup', handleKeyup);
                // Restaurar estilos originales del contenedor
                container.style.position = origPosition;
                container.style.overflow = origOverflow;
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
        };
    }
};
