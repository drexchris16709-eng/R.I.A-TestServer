window.addEventListener('load', () => {
    const go = () => {
        if (window.__netBusy) { setTimeout(go, 500); return; }
        window.location.href = '../UserInteraction/UserI.html';
    };
    setTimeout(go, 8000);
});

(function () {
    const style = document.createElement('style');
    style.innerHTML = `

        body.net-offline > :not(#netDim):not(#netBanner) img,
        body.net-offline > :not(#netDim):not(#netBanner) picture,
        body.net-offline > :not(#netDim):not(#netBanner) video,
        body.net-offline > :not(#netDim):not(#netBanner) audio,
        body.net-offline > :not(#netDim):not(#netBanner) canvas,
        body.net-offline > :not(#netDim):not(#netBanner) iframe,
        body.net-offline > :not(#netDim):not(#netBanner) svg {
            visibility: hidden !important;
        }
        body.net-offline,
        body.net-offline > :not(#netDim):not(#netBanner),
        body.net-offline > :not(#netDim):not(#netBanner) * {
            background-image: none !important;
        }
        body.net-offline > :not(#netDim):not(#netBanner),
        body.net-offline > :not(#netDim):not(#netBanner) *,
        body.net-offline > :not(#netDim):not(#netBanner) *::before,
        body.net-offline > :not(#netDim):not(#netBanner) *::after {
            animation-play-state: paused !important;
            transition: none !important;
        }
        #netDim {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            z-index: 2147483646;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity .4s ease, visibility 0s linear .4s;
        }
        #netDim.show {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transition: opacity .4s ease;
        }

        #netLoader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 18px;
            opacity: 0;
            transition: opacity .3s ease;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #netLoader.show { opacity: 1; }
        #netLoader .net-ring {
            width: 64px;
            height: 64px;
            border: 7px solid rgba(255, 255, 255, 0.25);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: netSpin .9s linear infinite;
        }
        #netLoader p {
            margin: 0;
            color: #ffffff;
            font-size: 16px;
            letter-spacing: .3px;
        }
        @keyframes netSpin { to { transform: rotate(360deg); } }

        #netBanner {
            --w: min(86.6vw, 640px);
            position: fixed;
            top: max(2vw, env(safe-area-inset-top));
            left: 50%;
            width: var(--w);
            aspect-ratio: 1375 / 325;
            z-index: 2147483647;
            container-type: inline-size;
            display: flex;
            align-items: center;
            padding-left: calc(var(--w) * 0.063);
            box-sizing: border-box;
            background: #000000;
            border-radius: calc(var(--w) * 0.058);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            transform: translate(-50%, calc(-100% - 30vh));
            transition: transform .7s cubic-bezier(.22, 1, .36, 1);
            pointer-events: none;
        }
        #netBanner.show { transform: translate(-50%, 0); }
        #netBanner::before {
            content: "";
            position: absolute;
            inset: -5% -4% -25% -4%;
            background: #000000;
            border-radius: inherit;
            filter: blur(32px);
            opacity: .85;
            z-index: -1;
        }
        #netBanner .net-icon {
            width: 16cqw;
            height: 16cqw;
            flex-shrink: 0;
            margin-right: 5.2cqw;
            display: none;
        }
        #netBanner.is-offline .icon-off { display: block; }
        #netBanner.is-online  .icon-on  { display: block; }
        #netBanner .net-title {
            margin: 0;
            color: #ffffff;
            font-size: 8.1cqw;
            font-weight: 300;
            line-height: 1;
        }
        #netBanner .net-sub {
            margin: .6cqw 0 0 0;
            color: #7d7d7d;
            font-size: 1.85cqw;
            line-height: 1.2;
            white-space: nowrap;
        }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.innerHTML = `
        <div id="netDim">
            <div id="netLoader">
                <div class="net-ring"></div>
                <p>Loading Connection...</p>
            </div>
        </div>
        <div id="netBanner" class="is-offline">
            <svg class="net-icon icon-off" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="50" cy="50" r="44" stroke="#ff0000" stroke-width="7"/>
                <g stroke="#ff0000" stroke-width="6" stroke-linecap="round">
                    <path d="M22 44 A40 40 0 0 1 78 44"/>
                    <path d="M33 55 A25 25 0 0 1 67 55"/>
                    <path d="M42 65 A11 11 0 0 1 58 65"/>
                </g>
                <circle cx="50" cy="75" r="5" fill="#ff0000"/>
                <line x1="29" y1="25" x2="73" y2="75" stroke="#000000" stroke-width="13" stroke-linecap="round"/>
                <line x1="29" y1="25" x2="73" y2="75" stroke="#ff0000" stroke-width="6" stroke-linecap="round"/>
            </svg>
            <svg class="net-icon icon-on" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="50" cy="50" r="44" stroke="#00d26a" stroke-width="7"/>
                <g stroke="#00d26a" stroke-width="6" stroke-linecap="round">
                    <path d="M22 44 A40 40 0 0 1 78 44"/>
                    <path d="M33 55 A25 25 0 0 1 67 55"/>
                    <path d="M42 65 A11 11 0 0 1 58 65"/>
                </g>
                <circle cx="50" cy="75" r="5" fill="#00d26a"/>
            </svg>
            <div>
                <h1 class="net-title">No Internet</h1>
                <p class="net-sub">Please connect to the internet and try again.</p>
            </div>
        </div>
    `;

    let dim, loader, banner, title, sub;
    function mount() {
        if (dim) return;
        while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
        dim = document.getElementById('netDim');
        loader = document.getElementById('netLoader');
        banner = document.getElementById('netBanner');
        title = banner.querySelector('.net-title');
        sub = banner.querySelector('.net-sub');
    }


    let pausedMedia = [];
    let pausedAnims = [];
    const isOurs = (el) => el && el.closest && el.closest('#netDim, #netBanner');

    function freezePage(on) {
        mount();
        if (on && window.__netFrozen) return;
        window.__netFrozen = on;
        document.body.classList.toggle('net-offline', on);
        if (on) {
            pausedMedia = [];
            document.querySelectorAll('video, audio').forEach(m => {
                try { if (!m.paused) { pausedMedia.push(m); m.pause(); } } catch (e) {}
            });
            pausedAnims = [];
            if (document.getAnimations) {
                document.getAnimations().forEach(a => {
                    const t = a.effect && a.effect.target;
                    if (a.playState === 'running' && !isOurs(t)) { pausedAnims.push(a); a.pause(); }
                });
            }
        } else {
            pausedMedia.forEach(m => { try { m.play(); } catch (e) {} });
            pausedAnims.forEach(a => { try { a.play(); } catch (e) {} });
            pausedMedia = [];
            pausedAnims = [];
        }
    }

    ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
     'touchstart', 'touchend', 'keydown', 'keypress', 'keyup', 'input',
     'change', 'submit', 'contextmenu'].forEach(type => {
        document.addEventListener(type, (e) => {
            if (!window.__netFrozen) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { capture: true, passive: false });
    });

    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

    function runSequence(kind) {
        mount();
        clearTimers();
        window.__netBusy = true;
        if (kind === 'offline') freezePage(true);

        banner.classList.remove('show');
        dim.classList.add('show');
        loader.classList.add('show');

        later(() => {
            loader.classList.remove('show');
            if (kind === 'offline') {
                banner.className = 'is-offline';
                title.textContent = 'No Internet';
                sub.textContent = 'Please connect to the internet and try again.';
            } else {
                banner.className = 'is-online';
                title.textContent = 'Internet Found';
                sub.textContent = 'You are back to online.';
            }
            void banner.offsetWidth;
            banner.classList.add('show');
        }, 2000);

        if (kind === 'online') {
            later(() => banner.classList.remove('show'), 4500);
            later(() => { dim.classList.remove('show'); freezePage(false); }, 5000);
            later(() => { window.__netBusy = false; }, 5500);
        }
    }

    let isOnline = true;
    let uiUsed = false;

    function applyStatus(nowOnline) {
        if (nowOnline === isOnline) return;
        isOnline = nowOnline;
        if (!nowOnline) {
            uiUsed = true;
            runSequence('offline');
        } else if (uiUsed) {
            runSequence('online');
        }
    }

    const isLocalHost = /^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:';

    function ping(url, ms) {
        return new Promise(resolve => {
            const ctrl = new AbortController();
            const t = setTimeout(() => { ctrl.abort(); resolve(false); }, ms);
            fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
                .then(() => { clearTimeout(t); resolve(true); })
                .catch(() => { clearTimeout(t); resolve(false); });
        });
    }

    async function hasInternet() {
        if (!navigator.onLine) return false;
        const stamp = Date.now();
        const tests = [ping('https://www.gstatic.com/generate_204?_=' + stamp, 4000)];
        if (!isLocalHost) tests.push(ping(location.pathname + '?ping=' + stamp, 4000));
        const results = await Promise.all(tests);
        return results.some(Boolean);
    }

    let failCount = 0;
    let checking = false;

    async function check() {
        if (checking) return;
        checking = true;
        try {
            const ok = await hasInternet();
            if (ok) {
                failCount = 0;
                applyStatus(true);
            } else {
                failCount++;
                if (failCount >= 2 || !navigator.onLine) applyStatus(false);
            }
        } finally {
            checking = false;
        }
    }

    window.addEventListener('offline', () => { failCount = 2; applyStatus(false); });
    window.addEventListener('online', check);
    if (navigator.connection && navigator.connection.addEventListener) {
        navigator.connection.addEventListener('change', check);
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
    });

    (function loop() {
        check().finally(() => setTimeout(loop, isOnline ? 2500 : 1500));
    })();

    const start = () => { mount(); if (!navigator.onLine) applyStatus(false); };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();