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
    .ma-dpad,.ma-acts{position:fixed;z-index:9000;pointer-events:none;}
    .ma-btn{pointer-events:auto;-webkit-user-select:none;user-select:none;touch-action:none;
        display:flex;align-items:center;justify-content:center;cursor:pointer;
        background:rgba(20,20,32,.5);border:2px solid rgba(255,255,255,.35);
        color:#fff;font-weight:bold;border-radius:12px;backdrop-filter:blur(2px);}
    .ma-btn.ma-active{background:rgba(255,255,255,.4);transform:scale(.92);}
    .ma-dpad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(3,48px);gap:5px;bottom:18px;}
    .ma-dpad .ma-btn{width:48px;height:48px;font-size:20px;}
    .ma-up{grid-area:1/2}.ma-left{grid-area:2/1}.ma-right{grid-area:2/3}.ma-down{grid-area:3/2}
    .ma-acts{display:flex;flex-direction:column;gap:10px;bottom:24px;}
    .ma-acts .ma-btn{width:62px;height:62px;border-radius:50%;font-size:14px;}
    .ma-tag{position:fixed;z-index:9000;font-size:10px;color:#fff;opacity:.6;pointer-events:none;}
    @media (min-width:1001px){.ma-dpad,.ma-acts,.ma-tag{display:none!important;}}
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
        b.innerHTML = label;
        let held = false;
        const dn = e => { if (e.cancelable) e.preventDefault(); if (held) return; held = true; b.classList.add('ma-active'); fire(k, 'keydown'); };
        const up = e => { if (e && e.cancelable) e.preventDefault(); if (!held) return; held = false; b.classList.remove('ma-active'); fire(k, 'keyup'); };
        b.addEventListener('touchstart', dn, { passive: false });
        b.addEventListener('touchend', up, { passive: false });
        b.addEventListener('touchcancel', up, { passive: false });
        b.addEventListener('mousedown', dn);
        b.addEventListener('mouseup', up);
        b.addEventListener('mouseleave', up);
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
