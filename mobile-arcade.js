/*
 * mobile-arcade.js — shared touch helpers for the arcade games.
 *
 * Provides:
 *   MobileArcade.fit(selector)        scale a fixed-size game container to fit the screen
 *   MobileArcade.dpad(keys, opts)     on-screen D-pad that emits synthetic keyboard events
 *   MobileArcade.actions(list, opts)  on-screen action buttons (synthetic keyboard events)
 *   MobileArcade.mouseBridge(canvas)  forward touch events to mouse events for aim/click games
 *
 * The control overlays dispatch real KeyboardEvents on window, so games that read
 * keys[e.code] / keys[e.key] work unchanged. Controls are hidden on mouse-only devices.
 */
(function () {
    if (window.MobileArcade) return;
    const MA = {};

    const css = `
    .ma-dpad,.ma-acts{position:fixed;z-index:9000;pointer-events:none;filter:drop-shadow(0 12px 24px rgba(0,0,0,.35));}
    .ma-btn{pointer-events:auto;-webkit-user-select:none;user-select:none;touch-action:none;
        display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:system-ui,sans-serif;
        background:linear-gradient(145deg,rgba(34,38,58,.76),rgba(12,14,25,.72));
        border:1px solid rgba(255,255,255,.34);box-shadow:inset 0 1px rgba(255,255,255,.13),0 0 0 1px rgba(0,0,0,.18);
        color:#fff;font-weight:800;border-radius:14px;backdrop-filter:blur(10px) saturate(1.3);
        transition:transform .1s ease,background .1s ease,border-color .1s ease,box-shadow .1s ease;}
    .ma-btn.ma-active{background:linear-gradient(145deg,rgba(215,255,79,.7),rgba(61,225,255,.62));
        color:#080910;border-color:rgba(255,255,255,.7);transform:scale(.9);
        box-shadow:inset 0 1px rgba(255,255,255,.5),0 0 22px rgba(61,225,255,.28);}
    .ma-dpad{display:grid;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(3,50px);gap:6px;bottom:max(18px,env(safe-area-inset-bottom));}
    .ma-dpad .ma-btn{width:50px;height:50px;font-size:18px;}
    .ma-up{grid-area:1/2}.ma-left{grid-area:2/1}.ma-right{grid-area:2/3}.ma-down{grid-area:3/2}
    .ma-acts{display:flex;flex-direction:column;gap:11px;bottom:max(24px,env(safe-area-inset-bottom));}
    .ma-acts.ma-above-pad{bottom:max(var(--ma-pad-bottom),env(safe-area-inset-bottom));}
    .ma-acts .ma-btn{width:64px;height:64px;padding:5px;border-radius:50%;font-size:12px;line-height:1.05;text-align:center;}
    .ma-tag{position:fixed;z-index:9000;padding:3px 7px;color:rgba(255,255,255,.72);border-radius:6px;
        background:rgba(7,8,15,.46);backdrop-filter:blur(6px);font:700 8px/1 system-ui,sans-serif;
        letter-spacing:.08em;text-transform:uppercase;pointer-events:none;}
    @media (hover:hover) and (pointer:fine) and (not (any-pointer:coarse)){.ma-dpad,.ma-acts,.ma-tag{display:none!important;}}
    @media (max-height:560px){
        .ma-dpad{grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px);gap:4px;bottom:8px}
        .ma-dpad .ma-btn{width:42px;height:42px;font-size:15px}.ma-acts{bottom:10px;gap:7px}.ma-acts .ma-btn{width:52px;height:52px;font-size:10px}
        .ma-acts.ma-above-pad{bottom:max(146px,env(safe-area-inset-bottom));}
    }
    `;

    const KEYMAP = {
        up: { code: 'ArrowUp', key: 'ArrowUp' }, down: { code: 'ArrowDown', key: 'ArrowDown' },
        left: { code: 'ArrowLeft', key: 'ArrowLeft' }, right: { code: 'ArrowRight', key: 'ArrowRight' },
        w: { code: 'KeyW', key: 'w' }, a: { code: 'KeyA', key: 'a' }, s: { code: 'KeyS', key: 's' }, d: { code: 'KeyD', key: 'd' },
        space: { code: 'Space', key: ' ' }, enter: { code: 'Enter', key: 'Enter' },
        c: { code: 'KeyC', key: 'c' }, x: { code: 'KeyX', key: 'x' }, r: { code: 'KeyR', key: 'r' },
        h: { code: 'KeyH', key: 'h' }, e: { code: 'KeyE', key: 'e' }, q: { code: 'KeyQ', key: 'q' }
    };

    function fire(k, type, repeat = false) {
        const m = KEYMAP[k] || { code: k, key: k };
        window.dispatchEvent(new KeyboardEvent(type, { code: m.code, key: m.key, repeat, bubbles: true, cancelable: true }));
    }

    const heldButtons = new Set();
    function releaseButtons() {
        for (const release of heldButtons) release();
    }
    window.addEventListener('blur', releaseButtons);
    window.addEventListener('pagehide', releaseButtons);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) releaseButtons();
    });

    function makeBtn(label, k, { ariaLabel, repeat = false } = {}) {
        const b = document.createElement('button');
        b.className = 'ma-btn';
        b.type = 'button';
        b.innerHTML = label;
        b.setAttribute('aria-label', ariaLabel || String(label).replace(/<[^>]*>/g, ' '));
        let pointerId = null;
        let repeatTimer;

        function release() {
            if (pointerId === null) return;
            const captured = pointerId;
            pointerId = null;
            clearTimeout(repeatTimer);
            heldButtons.delete(release);
            b.classList.remove('ma-active');
            if (b.hasPointerCapture(captured)) b.releasePointerCapture(captured);
            fire(k, 'keyup');
        }

        function repeatPress() {
            if (!b.getClientRects().length) {
                release();
                return;
            }
            fire(k, 'keydown', true);
            if (pointerId !== null) repeatTimer = setTimeout(repeatPress, 75);
        }

        b.addEventListener('pointerdown', e => {
            if (e.button !== 0 || pointerId !== null) return;
            e.preventDefault();
            b.setPointerCapture(e.pointerId);
            pointerId = e.pointerId;
            heldButtons.add(release);
            b.classList.add('ma-active');
            navigator.vibrate?.(8);
            fire(k, 'keydown');
            if (repeat && pointerId !== null) repeatTimer = setTimeout(repeatPress, 220);
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            b.addEventListener(type, e => {
                if (e.pointerId === pointerId) release();
            });
        }
        b.addEventListener('click', e => {
            if (e.detail !== 0) return;
            fire(k, 'keydown');
            fire(k, 'keyup');
        });
        b.addEventListener('contextmenu', e => e.preventDefault());
        return b;
    }
    MA.makeBtn = makeBtn;

    // keys = {up,down,left,right} (KEYMAP names); opts = {side, bottom, tag, repeat}
    MA.dpad = function (keys, opts) {
        opts = opts || {};
        const d = document.createElement('div');
        d.className = 'ma-dpad';
        if (opts.side === 'right') d.style.right = '18px'; else d.style.left = '18px';
        if (opts.bottom) d.style.bottom = opts.bottom;
        const add = (key, direction, label) => {
            if (!key) return;
            const button = makeBtn(label, key, { ariaLabel: direction, repeat: opts.repeat });
            button.classList.add('ma-' + direction.toLowerCase());
            d.appendChild(button);
        };
        add(keys.up, 'Up', '▲');
        add(keys.left, 'Left', '◀');
        add(keys.right, 'Right', '▶');
        add(keys.down, 'Down', '▼');
        document.body.appendChild(d);
        if (opts.tag) addTag(opts.tag, opts.side === 'right' ? 'right' : 'left');
        return d;
    };

    // list = [{label,key}]; opts = {side, bottom, abovePad}
    MA.actions = function (list, opts) {
        opts = opts || {};
        const c = document.createElement('div');
        c.className = 'ma-acts';
        if (opts.abovePad) c.classList.add('ma-above-pad');
        if (opts.side === 'left') c.style.left = '18px'; else c.style.right = '18px';
        if (opts.abovePad) c.style.setProperty('--ma-pad-bottom', opts.bottom || '190px');
        else if (opts.bottom) c.style.bottom = opts.bottom;
        list.forEach(a => c.appendChild(makeBtn(a.label, a.key)));
        document.body.appendChild(c);
        return c;
    };

    function addTag(text, side) {
        const t = document.createElement('div');
        t.className = 'ma-tag';
        t.textContent = text;
        t.style.bottom = '8px';
        if (side === 'right') t.style.right = '60px'; else t.style.left = '60px';
        document.body.appendChild(t);
    }
    MA.tag = addTag;

    MA.fit = function (sel) {
        const wrap = (sel && document.querySelector(sel)) ||
            document.getElementById('game-container') || document.getElementById('gameContainer');
        if (!wrap) return;
        function fit() {
            wrap.style.transform = 'none';
            wrap.style.marginBottom = '';
            const w = wrap.offsetWidth, h = wrap.offsetHeight;
            if (!w || !h) return;
            const s = Math.min(1, window.innerWidth / w, window.innerHeight / h);
            if (s < 1) {
                wrap.style.transformOrigin = 'top center';
                wrap.style.transform = 'scale(' + s + ')';
                wrap.style.marginBottom = '-' + (h * (1 - s)) + 'px';
            }
        }
        window.addEventListener('resize', fit);
        window.addEventListener('orientationchange', () => setTimeout(fit, 250));
        window.addEventListener('load', fit);
        fit();
    };

    // Forward touch -> mouse so canvas games that use mouse aim/click work on touch.
    MA.mouseBridge = function (canvas) {
        if (!canvas) return;
        canvas.style.touchAction = 'none';
        let activeTouch = null;
        let lastTouch;
        function send(type, event) {
            canvas.dispatchEvent(new MouseEvent(type, { clientX: event.clientX, clientY: event.clientY, bubbles: true, cancelable: true, button: 0 }));
        }
        function release(event) {
            if (activeTouch === null || (event && event.pointerId !== activeTouch)) return;
            const captured = activeTouch;
            activeTouch = null;
            if (canvas.hasPointerCapture(captured)) canvas.releasePointerCapture(captured);
            send('mouseup', event || lastTouch);
        }
        canvas.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse') return;
            event.preventDefault();
            if (activeTouch !== null) return;
            canvas.setPointerCapture(event.pointerId);
            activeTouch = event.pointerId;
            lastTouch = event;
            send('mousemove', event);
            send('mousedown', event);
        });
        canvas.addEventListener('pointermove', event => {
            if (event.pointerId !== activeTouch) return;
            lastTouch = event;
            send('mousemove', event);
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            canvas.addEventListener(type, release);
        }
        window.addEventListener('blur', () => release());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) release();
        });
    };

    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    window.MobileArcade = MA;
})();
