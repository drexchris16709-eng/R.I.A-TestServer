const MIN_LOADING_MS = 4000;   // loading modal stays at least this long before redirecting
        const ID_CHARS = 2;            // the login credential = the LAST 2 characters (letters or numbers) of the User ID
        const LOCK_MINUTES = 2;           // how long the login stays locked after the chances are used up
        const CLOSE_SECONDS = 4;          // "Closing app in ..." countdown
        const LOCK_KEY = 'dev-login-lock-until';   // saved in this browser so a refresh / Back does not skip the lock
        let chancesRemaining = 2;
        let checkingLogin = false;

        // Looks the typed digits up in Firebase: the same accounts the Handlers Section lists.
        // getHandlerRequests() comes from accounts-db.js (Firestore).
        // An account's User ID is saved to Firebase when the account is created. Login is allowed when the
        // last 2 characters typed equal the last 2 characters of any saved User ID (read fresh on every login).
        const USER_ID_FIELDS = ['userId', 'userID', 'user_id', 'uid', 'idValue'];

        function idCharsOf(account) {
            for (const key of USER_ID_FIELDS) {
                const raw = account[key];
                if (raw === undefined || raw === null) continue;
                const chars = String(raw).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                if (chars) return chars;
            }
            return '';
        }

        // Returns the FULL User ID of the matching account (e.g. "AB12CD"), or null when nothing matches.
        async function findUserId(entered) {
            const accounts = await getHandlerRequests();
            console.log('[D.js] accounts read from Firebase:', accounts.length);
            const wanted = entered.toUpperCase();   // letters are not case-sensitive
            const hit = accounts.find(a => {
                const id = idCharsOf(a);
                return id.length >= ID_CHARS && id.slice(-ID_CHARS) === wanted;
            });
            return hit ? idCharsOf(hit) : null;
        }
        
        const userIdInput = document.getElementById('userIdInput');
        const loginBtn = document.getElementById('loginBtn');
        const errorMessage = document.getElementById('errorMessage');
        const loadingModal = document.getElementById('loadingModal');
        const lockedModal = document.getElementById('lockedModal');
        const countdownTimer = document.getElementById('countdownTimer');
        const backBtn = document.getElementById('backBtn');

        loginBtn.addEventListener('click', async () => {
            if (checkingLogin) return;
            const enteredValue = userIdInput.value.trim();

            let valid = false;
            let matchedUserId = null;
            if (new RegExp('^[A-Za-z0-9]{' + ID_CHARS + '}$').test(enteredValue)) {
                checkingLogin = true;
                loadingModal.classList.remove('hidden');
                const started = Date.now();
                try {
                    matchedUserId = await findUserId(enteredValue);
                    valid = !!matchedUserId;
                } catch (err) {
                    console.error(err);
                    loadingModal.classList.add('hidden');
                    const msg = String((err && err.message) || '');
                    errorMessage.textContent = /not configured|SDK not found/i.test(msg)
                        ? 'Firebase is not set up yet. Add your config to accounts-db.js.'
                        : /permission|insufficient/i.test(msg)
                            ? 'Firebase blocked the request. Check your Firestore rules.'
                            : 'Could not reach the server. Check your connection and try again.';
                    errorMessage.classList.remove('hidden');
                    checkingLogin = false;
                    return;
                }
                if (valid) {
                    // keep the loading modal up for the full delay
                    await new Promise(r => setTimeout(r, Math.max(0, MIN_LOADING_MS - (Date.now() - started))));
                } else {
                    loadingModal.classList.add('hidden');
                    checkingLogin = false;
                }
            }

            if (valid) {
                errorMessage.classList.add('hidden');
                userIdInput.classList.remove('border-[#ff000f]');
                userIdInput.classList.add('border-[#73706d]');

                // hand the logged-in User ID (from Firebase) to the customer service page
                try { sessionStorage.setItem('dev-user-id', matchedUserId); } catch (_) {}
                window.location.href = "../DeveloperCustomerService/DVCS.html";

            } else {
                if (chancesRemaining > 0) {
                    errorMessage.textContent = `you have ${chancesRemaining} more chances or you account will be lock temporarily`;
                    errorMessage.classList.remove('hidden');
                    userIdInput.classList.add('border-[#ff000f]');
                    userIdInput.classList.remove('border-[#73706d]');
                    
                    chancesRemaining--;
                    userIdInput.value = '';
                    userIdInput.focus();
                } else {
                    errorMessage.classList.add('hidden');
                    lockedModal.classList.remove('hidden');
                    userIdInput.disabled = true;
                    document.getElementById('toggleIdBtn').disabled = true;
                    loginBtn.disabled = true;

                    try { localStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MINUTES * 60 * 1000)); } catch (_) {}
                    let timeLeft = CLOSE_SECONDS;
                    countdownTimer.textContent = timeLeft;

                    const interval = setInterval(() => {
                        timeLeft--;
                        countdownTimer.textContent = timeLeft;
                        if (timeLeft <= 0) {
                            clearInterval(interval);
                            try {
                                window.close();
                            } catch (e) {
                                console.log("Window close restricted by browser security.");
                            }
                            setTimeout(() => {
                                document.body.innerHTML = `
                                    <div class="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4">
                                        <div class="bg-black border border-[#ff000f]/50 p-8 rounded-2xl max-w-md w-full space-y-4">
                                            <h1 class="text-xl font-bold text-white">Session Terminated</h1>
                                            <p class="text-[#a8a5a2] text-sm">Security lockout enforced. You may now close this tab.</p>
                                            <button id="terminatedBackBtn" type="button" class="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm active:scale-95 transition-transform">
                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
                                                Back
                                            </button>
                                        </div>
                                    </div>
                                `;
                                document.getElementById('terminatedBackBtn').addEventListener('click', () => {
                                    document.body.style.transition = 'opacity 0.35s ease';
                                    document.body.style.opacity = '0';          // quick fade out, then go
                                    setTimeout(() => { window.location.href = BACK_REDIRECT_URL; }, 350);
                                });
                            }, 500);
                        }
                    }, 1000);
                }
            }
        });

        // User ID: letters and numbers only. The value is only rewritten when something actually has to be removed,
        // and never while an on-screen keyboard is still composing (rewriting it then blocks typing).
        userIdInput.addEventListener('input', (e) => {
            if (e.isComposing) return;
            const clean = userIdInput.value.replace(/[^A-Za-z0-9]/g, '').slice(0, ID_CHARS);
            if (clean !== userIdInput.value) userIdInput.value = clean;
        });
        userIdInput.addEventListener('compositionend', () => {
            const clean = userIdInput.value.replace(/[^A-Za-z0-9]/g, '').slice(0, ID_CHARS);
            if (clean !== userIdInput.value) userIdInput.value = clean;
        });

        // Eye button: show / hide the typed digits
        const toggleIdBtn = document.getElementById('toggleIdBtn');
        const eyeOpen = document.getElementById('eyeOpen');
        const eyeOff = document.getElementById('eyeOff');
        // keep the keyboard open and the caret in place when the eye is tapped
        toggleIdBtn.addEventListener('mousedown', (e) => e.preventDefault());
        toggleIdBtn.addEventListener('click', () => {
            const show = userIdInput.type === 'password';
            userIdInput.type = show ? 'text' : 'password';
            eyeOpen.classList.toggle('hidden', show);
            eyeOff.classList.toggle('hidden', !show);
            toggleIdBtn.setAttribute('aria-pressed', String(show));
            toggleIdBtn.setAttribute('aria-label', show ? 'Hide User ID' : 'Show User ID');
            userIdInput.focus();
        });

        userIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });

        userIdInput.addEventListener('input', () => {
            if (!errorMessage.classList.contains('hidden') && chancesRemaining > 0) {
                errorMessage.classList.add('hidden');
                userIdInput.classList.remove('border-[#ff000f]');
                userIdInput.classList.add('border-[#73706d]');
            }
        });

        // Coming back with the browser Back button (or the Back button here) restores this page exactly as
        // it was left: the "Authenticating..." overlay still on top and the login still marked as busy,
        // which blocks the input. Reset the screen every time the page is shown again.
        // While the lock is active the input and buttons stay disabled, with a live countdown under the box.
        let lockTicker = null;
        function lockRemaining() {
            let until = 0;
            try { until = Number(localStorage.getItem(LOCK_KEY)) || 0; } catch (_) {}
            return until - Date.now();
        }
        function formatLeft(ms) {
            const t = Math.ceil(ms / 1000);
            return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
        }
        function unlockLogin() {
            clearInterval(lockTicker);
            lockTicker = null;
            try { localStorage.removeItem(LOCK_KEY); } catch (_) {}
            chancesRemaining = 2;
            userIdInput.disabled = false;
            loginBtn.disabled = false;
            toggleIdBtn.disabled = false;
            errorMessage.classList.add('hidden');
            userIdInput.classList.remove('border-[#ff000f]');
            userIdInput.classList.add('border-[#73706d]');
        }
        function applyLockIfActive() {
            if (lockRemaining() <= 0) {
                try { localStorage.removeItem(LOCK_KEY); } catch (_) {}
                return false;
            }
            chancesRemaining = 0;
            userIdInput.value = '';
            userIdInput.disabled = true;
            loginBtn.disabled = true;
            toggleIdBtn.disabled = true;
            errorMessage.classList.remove('hidden');
            const tick = () => {
                const left = lockRemaining();
                if (left <= 0) { unlockLogin(); userIdInput.focus(); return; }
                errorMessage.textContent = `Account locked. You can type again in ${formatLeft(left)}.`;
            };
            clearInterval(lockTicker);
            tick();
            if (lockRemaining() > 0) lockTicker = setInterval(tick, 1000);
            return true;
        }

        function resetLoginScreen() {
            loadingModal.classList.add('hidden');
            checkingLogin = false;
            document.body.style.transition = '';
            document.body.style.opacity = '';

            // an account that was locked stays locked
            if (!lockedModal.classList.contains('hidden')) return;

            userIdInput.disabled = false;
            loginBtn.disabled = false;
            toggleIdBtn.disabled = false;
            userIdInput.value = '';
            userIdInput.type = 'password';
            eyeOpen.classList.remove('hidden');
            eyeOff.classList.add('hidden');
            toggleIdBtn.setAttribute('aria-pressed', 'false');
            toggleIdBtn.setAttribute('aria-label', 'Show User ID');
            errorMessage.classList.add('hidden');
            userIdInput.classList.remove('border-[#ff000f]');
            userIdInput.classList.add('border-[#73706d]');

            applyLockIfActive();     // a lock that is still running keeps the input disabled
        }

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                resetLoginScreen();
                userIdInput.focus();
            }
        });
        resetLoginScreen();

        const BACK_REDIRECT_URL = '../UserInteraction/UserI.html';
        backBtn.addEventListener('click', () => {
            document.body.style.transition = 'opacity 0.35s ease';
            document.body.style.opacity = '0';          // quick fade out, then go
            setTimeout(() => { window.location.href = BACK_REDIRECT_URL; }, 350);
        });

document.addEventListener('DOMContentLoaded', () => {
  const seeMoreBtn = document.querySelector('.seeMoreBtn');
  const seeMoreModal = document.getElementById('see-more-modal');
  const closeSeeMoreBtn = document.getElementById('close-see-more-btn');
  const bannerVideo = seeMoreModal ? seeMoreModal.querySelector('.modal-banner-video') : null;

  const playBanner = () => { if (bannerVideo) { const p = bannerVideo.play(); if (p && p.catch) p.catch(() => {}); } };
  const pauseBanner = () => { if (bannerVideo) bannerVideo.pause(); };

  if (seeMoreBtn && seeMoreModal) {
    seeMoreBtn.addEventListener('click', () => {
      seeMoreModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      playBanner();
    });
  }

  if (closeSeeMoreBtn && seeMoreModal) {
    const closeWindow = () => {
      seeMoreModal.classList.remove('open');
      document.body.style.overflow = '';
      pauseBanner();
    };

    closeSeeMoreBtn.addEventListener('click', closeWindow);
    seeMoreModal.addEventListener('click', (e) => {
      if (e.target === seeMoreModal) {
        closeWindow();
      }
    });
  }
});

(function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .small-social-icons {
            transform: none;
            margin-top: -12px;
            margin-bottom: 2px;
        }

        button.loading {
            color: transparent !important;
            pointer-events: none !important;
            position: relative !important;
        }

        button.loading::after {
            content: "" !important;
            position: absolute !important;
            width: 20px !important;
            height: 20px !important;
            top: 50% !important;
            left: 50% !important;
            margin-left: -10px !important;
            margin-top: -10px !important;
            border: 3px solid rgba(0, 0, 0, 0) !important;
            border-radius: 50% !important;
            border-top-color: #000000 !important;
            animation: button-loading-spinner 0.6s linear infinite !important;
        }

        @keyframes button-loading-spinner {
            to {
                transform: rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
})();

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
            color: #73706d;
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
                <circle cx="50" cy="50" r="44" stroke="#ff000f" stroke-width="7"/>
                <g stroke="#ff000f" stroke-width="6" stroke-linecap="round">
                    <path d="M22 44 A40 40 0 0 1 78 44"/>
                    <path d="M33 55 A25 25 0 0 1 67 55"/>
                    <path d="M42 65 A11 11 0 0 1 58 65"/>
                </g>
                <circle cx="50" cy="75" r="5" fill="#ff000f"/>
                <line x1="29" y1="25" x2="73" y2="75" stroke="#000000" stroke-width="13" stroke-linecap="round"/>
                <line x1="29" y1="25" x2="73" y2="75" stroke="#ff000f" stroke-width="6" stroke-linecap="round"/>
            </svg>
            <svg class="net-icon icon-on" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="50" cy="50" r="44" stroke="#00ff19" stroke-width="7"/>
                <g stroke="#00ff19" stroke-width="6" stroke-linecap="round">
                    <path d="M22 44 A40 40 0 0 1 78 44"/>
                    <path d="M33 55 A25 25 0 0 1 67 55"/>
                    <path d="M42 65 A11 11 0 0 1 58 65"/>
                </g>
                <circle cx="50" cy="75" r="5" fill="#00ff19"/>
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