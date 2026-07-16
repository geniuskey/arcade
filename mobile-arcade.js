/*
 * mobile-arcade.js — shared mobile (portrait) helpers for the arcade games.
 *
 * Provides:
 *   MobileArcade.fit(selector)        scale a fixed-size game container to fit the screen
 *   MobileArcade.dpad(keys, opts)     on-screen D-pad that emits synthetic keyboard events
 *   MobileArcade.actions(list, opts)  on-screen action buttons (synthetic keyboard events)
 *   MobileArcade.mouseBridge(canvas)  forward touch events to mouse events for aim/click games
 *
 * The control overlays dispatch real KeyboardEvents on window, so games that read
 * keys[e.code] / keys[e.key] work unchanged. Controls are hidden on wide screens.
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
    .ma-acts .ma-btn{width:64px;height:64px;padding:5px;border-radius:50%;font-size:12px;line-height:1.05;text-align:center;}
    .ma-tag{position:fixed;z-index:9000;padding:3px 7px;color:rgba(255,255,255,.72);border-radius:6px;
        background:rgba(7,8,15,.46);backdrop-filter:blur(6px);font:700 8px/1 system-ui,sans-serif;
        letter-spacing:.08em;text-transform:uppercase;pointer-events:none;}
    @media (hover:hover) and (pointer:fine) and (min-width:850px){.ma-dpad,.ma-acts,.ma-tag{display:none!important;}}
    @media (max-height:560px){
        .ma-dpad{grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px);gap:4px;bottom:8px}
        .ma-dpad .ma-btn{width:42px;height:42px;font-size:15px}.ma-acts{bottom:10px;gap:7px}.ma-acts .ma-btn{width:52px;height:52px;font-size:10px}
    }
    `;

    const KEYMAP = {
        up: { code: 'ArrowUp', key: 'ArrowUp' }, down: { code: 'ArrowDown', key: 'ArrowDown' },
        left: { code: 'ArrowLeft', key: 'ArrowLeft' }, right: { code: 'ArrowRight', key: 'ArrowRight' },
        w: { code: 'KeyW', key: 'w' }, a: { code: 'KeyA', key: 'a' }, s: { code: 'KeyS', key: 's' }, d: { code: 'KeyD', key: 'd' },
        space: { code: 'Space', key: ' ' }, enter: { code: 'Enter', key: 'Enter' },
        x: { code: 'KeyX', key: 'x' }, r: { code: 'KeyR', key: 'r' }, h: { code: 'KeyH', key: 'h' }, e: { code: 'KeyE', key: 'e' }
    };

    function fire(k, type) {
        const m = KEYMAP[k] || { code: k, key: k };
        window.dispatchEvent(new KeyboardEvent(type, { code: m.code, key: m.key, bubbles: true }));
    }

    function makeBtn(label, k) {
        const b = document.createElement('button');
        b.className = 'ma-btn';
        b.type = 'button';
        b.innerHTML = label;
        b.setAttribute('aria-label', String(label).replace(/<[^>]*>/g, ''));
        let held = false;
        const dn = e => {
            if (e.cancelable) e.preventDefault();
            if (held) return;
            held = true;
            if (b.setPointerCapture && e.pointerId !== undefined) b.setPointerCapture(e.pointerId);
            b.classList.add('ma-active');
            if (navigator.vibrate) navigator.vibrate(8);
            fire(k, 'keydown');
        };
        const up = e => { if (e && e.cancelable) e.preventDefault(); if (!held) return; held = false; b.classList.remove('ma-active'); fire(k, 'keyup'); };
        b.addEventListener('pointerdown', dn);
        b.addEventListener('pointerup', up);
        b.addEventListener('pointercancel', up);
        b.addEventListener('lostpointercapture', up);
        b.addEventListener('contextmenu', e => e.preventDefault());
        return b;
    }
    MA.makeBtn = makeBtn;

    // keys = {up,down,left,right} (KEYMAP names); opts = {side:'left'|'right', bottom, tag}
    MA.dpad = function (keys, opts) {
        opts = opts || {};
        const d = document.createElement('div');
        d.className = 'ma-dpad';
        if (opts.side === 'right') d.style.right = '18px'; else d.style.left = '18px';
        if (opts.bottom) d.style.bottom = opts.bottom;
        const add = (k, cls, lab) => { if (!k) return; const b = makeBtn(lab, k); b.classList.add(cls); d.appendChild(b); };
        add(keys.up, 'ma-up', '▲');
        add(keys.left, 'ma-left', '◀');
        add(keys.right, 'ma-right', '▶');
        add(keys.down, 'ma-down', '▼');
        document.body.appendChild(d);
        if (opts.tag) addTag(opts.tag, opts.side === 'right' ? 'right' : 'left');
        return d;
    };

    // list = [{label,key}]; opts = {side:'left'|'right', bottom}
    MA.actions = function (list, opts) {
        opts = opts || {};
        const c = document.createElement('div');
        c.className = 'ma-acts';
        if (opts.side === 'left') c.style.left = '18px'; else c.style.right = '18px';
        if (opts.bottom) c.style.bottom = opts.bottom;
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
        function send(type, t) {
            canvas.dispatchEvent(new MouseEvent(type, { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true, button: 0 }));
        }
        canvas.addEventListener('touchstart', e => { if (e.cancelable) e.preventDefault(); const t = e.touches[0]; send('mousemove', t); send('mousedown', t); }, { passive: false });
        canvas.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); send('mousemove', e.touches[0]); }, { passive: false });
        canvas.addEventListener('touchend', e => { send('mouseup', e.changedTouches[0]); }, { passive: false });
    };

    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    window.MobileArcade = MA;
})();
