/* ============================================================
   STOCK MARKET – Microgame for MicroRush
   Pulsa ESPACIO para que la flecha de acciones suba.
   Mantén la línea de precio POR ENCIMA de la línea de peligro
   (rayas). La línea de peligro sube gradualmente cada ronda.
   ============================================================ */

window.Microgames = window.Microgames || {};

window.Microgames.stockmarket = {
    id: 'stockmarket',
    instruction: '\u00a1PULSA ESPACIO! Mantén las acciones arriba',

    setup: function (container, score, game) {

        /* ---- Canvas ---------------------------------------- */
        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '15px';
        canvas.style.cursor = 'pointer';

        var origPos = container.style.position;
        var origOvf = container.style.overflow;
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.appendChild(canvas);
        var ctx = canvas.getContext('2d');

        var W = 520, H = 400;
        (function resize() {
            var r = container.getBoundingClientRect();
            W = (r.width > 0 ? r.width : container.offsetWidth || 520);
            H = (r.height > 0 ? r.height : container.offsetHeight || 400);
            canvas.width = W;
            canvas.height = H;
        })();

        /* ---- Dificultad ------------------------------------ */
        var diff = Math.floor(score / 5);
        var GRAVITY = 0.36 + diff * 0.04;    // caída más controlada (antes 0.55)
        var BOOST = -5.5 - diff * 0.3;     // impulso al pulsar ESPACIO
        var DANGER_START = 0.88;                   // posición inicial línea peligro (88% de H → más abajo)
        var DANGER_RISE = 0.00008 + diff * 0.00005; // más lento al principio
        var SCROLL_SPEED = 2.5 + diff * 0.4;

        /* ---- Estado ---------------------------------------- */
        var price = H * 0.4;      // Y del precio (arriba = pequeño)
        var vel = 0;
        var dangerY = H * DANGER_START; // línea de peligro (sube = Y decrece)
        var finished = false;
        var rafId = null;
        var spaceHeld = false;
        var pressCount = 0;         // pulsaciones totales (mérito)

        /* ---- Historial del gráfico (puntos para dibujar la línea) */
        var history = [];
        var HISTORY_LEN = Math.floor(W * 0.85);
        for (var i = 0; i < HISTORY_LEN; i++) {
            history.push(H * 0.4);
        }

        /* ---- Victoria: tiempo basado en maxTime del juego -- */
        var surviveMs = (game && game.maxTime) ? game.maxTime : 4000;
        var elapsed = 0;
        var prevTime = 0;

        /* ---- Particles ------------------------------------- */
        var particles = [];
        function spawnParticle(x, y, color, dir) {
            for (var i = 0; i < 6; i++) {
                particles.push({
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 3 * dir,
                    life: 1.0,
                    color: color,
                    r: 2 + Math.random() * 3
                });
            }
        }

        /* ---- Teclado y clic -------------------------------- */
        var keys = {};
        function handleKeydown(e) {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                if (!keys['space']) {
                    keys['space'] = true;
                    vel = BOOST;
                    pressCount++;
                    spawnParticle(W * 0.15, price, '#00e5ff', 1);
                }
            }
        }
        function handleKeyup(e) {
            if (e.code === 'Space' || e.key === ' ') keys['space'] = false;
        }
        canvas.addEventListener('click', function () {
            vel = BOOST;
            pressCount++;
            spawnParticle(W * 0.15, price, '#00e5ff', 1);
        });
        window.addEventListener('keydown', handleKeydown);
        window.addEventListener('keyup', handleKeyup);

        /* ---- Fondo financiero ------------------------------ */
        var bgStars = [];
        for (var s = 0; s < 40; s++) {
            bgStars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 });
        }

        function drawBackground() {
            // Fondo oscuro degradado
            var bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#050d1a');
            bg.addColorStop(1, '#0a1628');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            // Cuadrícula sutil
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
            ctx.lineWidth = 1;
            var gridStep = 40;
            for (var gx = 0; gx < W; gx += gridStep) {
                ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
            }
            for (var gy = 0; gy < H; gy += gridStep) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
            }

            // Estrellas
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            bgStars.forEach(function (st) {
                ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
            });
        }

        /* ---- Línea del historial (gráfico de acciones) ----- */
        var scrollOffset = 0;

        function drawChart() {
            if (history.length < 2) return;

            // Zona verde sobre la línea de peligro, roja si está cerca
            var isAbove = price < dangerY;
            var lineColor = isAbove ? '#00e676' : '#ff1744';
            var glowColor = isAbove ? '#00e676' : '#ff1744';

            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            var step = W / HISTORY_LEN;
            for (var i = 0; i < history.length; i++) {
                var hx = i * step;
                var hy = history[i];
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.stroke();

            // Relleno bajo la línea
            ctx.lineTo(history.length * step, H);
            ctx.lineTo(0, H);
            ctx.closePath();
            var fill = ctx.createLinearGradient(0, 0, 0, H);
            fill.addColorStop(0, isAbove ? 'rgba(0,230,118,0.18)' : 'rgba(255,23,68,0.18)');
            fill.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.restore();
        }

        /* ---- Flecha de precio (indicador actual) ----------- */
        function drawPriceArrow() {
            var px = W * 0.15;
            var pY = price;
            var isAbove = pY < dangerY;
            var col = isAbove ? '#00e676' : '#ff5252';

            ctx.save();
            ctx.shadowColor = col;
            ctx.shadowBlur = 20;

            // Círculo indicador
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(px, pY, 10, 0, Math.PI * 2);
            ctx.fill();

            // Flecha apuntando a la derecha
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(px + 14, pY);
            ctx.lineTo(px + 26, pY - 7);
            ctx.lineTo(px + 26, pY + 7);
            ctx.closePath();
            ctx.fill();

            // Brillo
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(px - 3, pY - 4, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        /* ---- Línea de peligro (rayas) ---------------------- */
        var dashOffset = 0;

        function drawDangerLine() {
            dashOffset = (dashOffset + 0.5) % 30;
            var isBelow = price >= dangerY; // precio BAJO la línea = peligro

            ctx.save();
            ctx.setLineDash([14, 8]);
            ctx.lineDashOffset = -dashOffset;
            ctx.strokeStyle = isBelow ? '#ff1744' : '#ff9800';
            ctx.lineWidth = isBelow ? 3 : 2;
            ctx.shadowColor = isBelow ? '#ff1744' : '#ff9800';
            ctx.shadowBlur = isBelow ? 18 : 8;
            ctx.beginPath();
            ctx.moveTo(0, dangerY);
            ctx.lineTo(W, dangerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Etiqueta
            ctx.fillStyle = isBelow ? '#ff1744' : '#ff9800';
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText('\u25bc M\u00cdN', W - 8, dangerY - 4);
            ctx.restore();
        }

        /* ---- HUD: precio, tiempo, pulsaciones -------------- */
        function drawHUD() {
            var pPct = Math.max(0, Math.round(100 - (price / H) * 100));
            var dPct = Math.max(0, Math.round(100 - (dangerY / H) * 100));
            var timeLeft = Math.ceil((surviveMs - elapsed) / 1000);
            var isAbove = price < dangerY;

            ctx.save();
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';

            // Precio actual
            ctx.fillStyle = isAbove ? '#00e676' : '#ff5252';
            ctx.fillText('\u25b2 ' + pPct + ' pts', 12, 20);

            // Mínimo
            ctx.fillStyle = '#ff9800';
            ctx.fillText('\u25bc M\u00edn: ' + dPct + ' pts', 12, 42);

            // Tiempo
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.textAlign = 'right';
            ctx.fillText('\u23f1 ' + timeLeft + 's', W - 12, 20);

            // Instrucción dinámica
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.fillStyle = isAbove ? 'rgba(0,230,118,0.7)' : 'rgba(255,50,50,0.9)';
            ctx.textAlign = 'center';
            var msg = isAbove ? '\u00a1Bien! Sigue pulsando ESPACIO \ud83d\ude80' : '\u00a1PELIGRO! \u00a1PULSA ESPACIO! \u26a0\ufe0f';
            ctx.fillText(msg, W / 2, H - 18);
            ctx.restore();
        }

        /* ---- Partículas ------------------------------------ */
        function drawParticles() {
            for (var i = particles.length - 1; i >= 0; i--) {
                var p = particles[i];
                p.x += p.vx; p.y += p.vy; p.vy += 0.1;
                p.life -= 0.04;
                if (p.life <= 0) { particles.splice(i, 1); continue; }
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        /* ---- Bucle ----------------------------------------- */
        function update(now) {
            if (finished) return;

            if (prevTime === 0) prevTime = now;
            var dt = Math.min(now - prevTime, 60);
            prevTime = now;
            elapsed += dt;

            // Física precio
            vel += GRAVITY;
            price = Math.max(10, Math.min(H - 10, price + vel));

            // Histórico
            history.push(price);
            if (history.length > HISTORY_LEN) history.shift();

            // Línea de peligro sube (Y disminuye)
            dangerY = Math.max(H * 0.15, dangerY - DANGER_RISE * dt);

            // Comprobar derrota: precio bajó de la línea de peligro
            if (price >= dangerY) {
                // Flash de advertencia, pero perdemos
                finished = true;
                clearTimeout(survivalTimeout);
                game.onFail();
                return;
            }

            // Comprobar victoria: sobrevivir surviveMs
            if (elapsed >= surviveMs) {
                finished = true;
                game.onWin();
                return;
            }

            /* ---- Dibujar ---- */
            ctx.clearRect(0, 0, W, H);
            drawBackground();
            drawChart();
            drawDangerLine();
            drawParticles();
            drawPriceArrow();
            drawHUD();

            rafId = requestAnimationFrame(update);
        }

        var survivalTimeout = setTimeout(function () {
            if (!finished) { finished = true; game.onWin(); }
        }, surviveMs + 500); // seguro extra

        rafId = requestAnimationFrame(update);

        /* ---- Cleanup --------------------------------------- */
        return {
            onInput: function () { },
            cleanup: function () {
                finished = true;
                cancelAnimationFrame(rafId);
                clearTimeout(survivalTimeout);
                window.removeEventListener('keydown', handleKeydown);
                window.removeEventListener('keyup', handleKeyup);
                container.style.position = origPos;
                container.style.overflow = origOvf;
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
        };
    }
};
