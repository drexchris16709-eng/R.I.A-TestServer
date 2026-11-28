// ---------- Logout confirmation ----------
// Change this to the page you want users to land on after logging out.
const LOGOUT_REDIRECT_URL = '../UserInteraction/UserI.html';

function openLogoutModal() {
  document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
  document.getElementById('logoutModal').style.display = 'none';
}

const LOGOUT_LOADING_MS = 1500; // how long the loading screen shows before redirecting
let logoutInProgress = false;

function confirmLogout() {
  if (logoutInProgress) return;
  logoutInProgress = true;
  closeLogoutModal();
  document.getElementById('logoutLoading').style.display = 'flex';

  // mark the account offline, reset its Online Time to 0, then forget the login
  const userId = (typeof getSessionUserId === 'function') ? getSessionUserId() : '';   // read BEFORE it is removed
  const markedOffline = (async () => {
    try { if (typeof stopPresence === 'function') await stopPresence(); } catch (e) {}   // stop the heartbeat first so it can't write the old time back
    try { if (userId && typeof resetOnlineTime === 'function') await resetOnlineTime(userId); } catch (e) {}   // Online Time -> 0h, 0m, 0s
  })();
  try { clearLoginSession(); } catch (e) {}   // forget the saved login (browser) so it won't auto-login again

  setTimeout(async () => {
    await Promise.race([markedOffline, new Promise(r => setTimeout(r, 2000))]);
    window.location.href = LOGOUT_REDIRECT_URL;
  }, LOGOUT_LOADING_MS);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLogoutModal();
});

function openModal(title, text) {
      document.getElementById('modalTitle').innerText = title;
      const bodyEl = document.getElementById('modalBody');
      const lines = text.split('\n').filter(Boolean);
      if (lines.length > 1) {
        bodyEl.innerHTML = '<div class="modal-body-row">' + lines.map(l => `<div class="modal-body-cell">${l}</div>`).join('') + '</div>';
      } else {
        bodyEl.textContent = text;
      }
      document.getElementById('infoModal').style.display = 'flex';
    }

    function closeModal(event) {
      document.getElementById('infoModal').style.display = 'none';
    }

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    function setupAutoSlideshow(slideshowId, indicatorsId) {
      const slideshow = document.getElementById(slideshowId);
      const track = slideshow.querySelector('.slideshow-track');
      const dots = document.getElementById(indicatorsId).querySelectorAll('.indicator-dot');
      const totalSlides = dots.length;
      let currentIndex = 0;

      function applySlide(index) {
        currentIndex = index;
        track.style.transform = `translate3d(-${currentIndex * 82}%, 0, 0)`;

        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });
        track.querySelectorAll('.slide-card').forEach((c, j) => c.classList.toggle('is-active', j === currentIndex));
      }

      let wrapTimer = null;

      function goToSlide(index) {
        const wrapping = index >= totalSlides || index < 0;
        const target = (index + totalSlides) % totalSlides;

        if (!wrapping) {
          applySlide(target);
          return;
        }

        clearTimeout(wrapTimer);
        track.style.transition = 'opacity 0.18s ease';
        track.style.opacity = '0';
        wrapTimer = setTimeout(() => {
          track.style.transition = 'none';
          applySlide(target);
          void track.offsetWidth;
          track.style.transition = 'opacity 0.25s ease';
          track.style.opacity = '1';
          wrapTimer = setTimeout(() => { track.style.transition = ''; }, 260);
        }, 190);
      }

      track.querySelectorAll('img').forEach(img => {
        img.decoding = 'async';
        img.draggable = false;
        if (img.decode) img.decode().catch(() => {});
      });

      function startTimer() {
        return setInterval(() => {
          goToSlide(currentIndex + 1);
        }, 4000);
      }

      let timer = startTimer();
      applySlide(0);

      function restartTimer() {
        clearInterval(timer);
        timer = startTimer();
      }

      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          goToSlide(i);
          restartTimer();
        });
      });

      // swipe / drag directly on the indicator dots
      const indEl = document.getElementById(indicatorsId);
      let iDown = false, iStartX = 0, iSwiped = false;
      const clampGo = (i) => goToSlide(Math.max(0, Math.min(totalSlides - 1, i)));
      indEl.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        iDown = true; iSwiped = false; iStartX = e.clientX;
        clearInterval(timer);
      });
      window.addEventListener('pointermove', (e) => {
        if (!iDown) return;
        const d = e.clientX - iStartX;
        if (Math.abs(d) > 26) { clampGo(currentIndex + (d < 0 ? 1 : -1)); iStartX = e.clientX; iSwiped = true; }
      });
      const endInd = () => { if (!iDown) return; iDown = false; restartTimer(); };
      window.addEventListener('pointerup', endInd);
      window.addEventListener('pointercancel', endInd);
      indEl.addEventListener('click', (e) => { if (iSwiped) { e.preventDefault(); e.stopPropagation(); iSwiped = false; } }, true);

      let touchStartX = 0;
      let touchStartY = 0;
      let touchDeltaX = 0;
      let isSwiping = false;
      const SWIPE_THRESHOLD = 40;
      
      function isMobileViewport() {
        return window.matchMedia('(max-width: 991px)').matches;
      }

      slideshow.addEventListener('touchstart', (e) => {
        if (!isMobileViewport()) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchDeltaX = 0;
        isSwiping = true;
        track.style.transition = 'none';
        clearInterval(timer);
      }, { passive: true });

      slideshow.addEventListener('touchmove', (e) => {
        if (!isSwiping || !isMobileViewport()) return;
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        touchDeltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        if (Math.abs(touchDeltaX) > Math.abs(deltaY)) {
          const trackWidth = track.getBoundingClientRect().width;
          const dragPercent = (touchDeltaX / trackWidth) * 100;
          track.style.transform = `translate3d(calc(-${currentIndex * 82}% + ${dragPercent}%), 0, 0)`;
        }
      }, { passive: true });

      slideshow.addEventListener('touchend', () => {
        if (!isSwiping || !isMobileViewport()) return;
        isSwiping = false;
        track.style.transition = '';
        if (touchDeltaX < -SWIPE_THRESHOLD) {
          goToSlide(currentIndex + 1);
        } else if (touchDeltaX > SWIPE_THRESHOLD) {
          goToSlide(currentIndex - 1);
        } else {
          goToSlide(currentIndex);
        }

        touchDeltaX = 0;
        restartTimer();
      });

      slideshow.addEventListener('touchcancel', () => {
        if (!isSwiping) return;
        isSwiping = false;
        track.style.transition = '';
        goToSlide(currentIndex);
        restartTimer();
      });
    }

    function setupNavAutoHide() {
      const nav = document.querySelector('.bottom-nav');
      let scrollStopTimer = null;
      const SCROLL_STOP_DELAY = 500;
      const BOTTOM_THRESHOLD = 40;

      function isAtBottom() {
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportH = window.innerHeight;
        const fullH = document.documentElement.scrollHeight;
        return scrollY + viewportH >= fullH - BOTTOM_THRESHOLD;
      }

      function onScroll() {
        nav.classList.add('nav-hidden');
        clearTimeout(scrollStopTimer);
        scrollStopTimer = setTimeout(() => {
          if (!isAtBottom()) {
            nav.classList.remove('nav-hidden');
          }
        }, SCROLL_STOP_DELAY);
      }

      window.addEventListener('scroll', onScroll, { passive: true });
    }

    document.addEventListener('DOMContentLoaded', () => {
      setupAutoSlideshow('newsSlideshow', 'newsIndicators');
      setupAutoSlideshow('riaSlideshow', 'riaIndicators');
      setupNavAutoHide();
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
            background: rgba(0, 0, 0, 0.66);
            -webkit-backdrop-filter: blur(10px) saturate(140%);
            backdrop-filter: blur(10px) saturate(140%);
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
            color: #70736d;
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

const icon = (inner, strokeW=1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

(function(){
  const scroller = document.getElementById('tasksScroll');
  let isDown = false, startX = 0, startScroll = 0, moved = false;
  const start = (x)=>{ isDown = true; moved = false; startX = x; startScroll = scroller.scrollLeft; };
  const move = (x)=>{
    if(!isDown) return;
    const dx = x - startX;
    if(Math.abs(dx) > 4) moved = true;
    const max = scroller.scrollWidth - scroller.clientWidth;
    scroller.scrollLeft = Math.max(0, Math.min(max, startScroll - dx));
  };
  const end = ()=>{ isDown = false; };
  scroller.addEventListener('mousedown', e=>{ start(e.clientX); scroller.style.cursor='grabbing'; });
  window.addEventListener('mousemove', e=> move(e.clientX));
  window.addEventListener('mouseup', ()=>{ end(); scroller.style.cursor='grab'; });
  scroller.addEventListener('click', e=>{ if(moved){ e.preventDefault(); e.stopPropagation(); } }, true);

  // slide animation: the card at the left edge is full size, the others shrink and fade the further they are
  const cards = Array.from(scroller.querySelectorAll('.task-card'));
  let ticking = false;
  function animateCards(){
    ticking = false;
    const base = scroller.getBoundingClientRect().left + 20;      // 20px = left padding of the list
    cards.forEach(card => {
      const w = card.offsetWidth || 1;
      const d = Math.min(1, Math.abs(card.getBoundingClientRect().left - base) / w);
      card.style.scale = (1 - 0.08 * d).toFixed(3);
      card.style.opacity = (1 - 0.45 * d).toFixed(3);
    });
  }
  function queueAnimate(){ if(!ticking){ ticking = true; requestAnimationFrame(animateCards); } }
  scroller.addEventListener('scroll', queueAnimate, { passive: true });
  window.addEventListener('resize', queueAnimate);
  const sb = document.getElementById('sidebarPhone');
  if (sb) sb.addEventListener('transitionend', queueAnimate);   // re-measure once the menu has slid open
  animateCards();
})();

const CHEV = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M5 8h14l-7 9z"/></svg>`;

const ICONS = {
  star: '<path d="M12 2.5l3.2 6.8 7.3.9-5.4 5.1 1.5 7.3L12 18.9 5.4 22.6 6.9 15.3 1.5 10.2l7.3-.9z"/>',
  theme: '<rect x="4" y="5" width="16" height="14" rx="2.4"/><path d="M12 5v14" fill="currentColor"/><path d="M8 9h1M8 12h1M8 15h1" stroke-width="1.3"/>',
  trophy: '<path d="M8.5 21h7M12 17.2V21M8 4h8v4.2a4 4 0 0 1-8 0z"/><path d="M8 5.2H5.3a1 1 0 0 0-1 1.1c.2 2.6 1.9 4.4 3.9 4.6M16 5.2h2.7a1 1 0 0 1 1 1.1c-.2 2.6-1.9 4.4-3.9 4.6"/>',
  shield: '<path d="M12 2.3l7.5 2.8v5.4c0 5-3.3 8.7-7.5 11.2-4.2-2.5-7.5-6.2-7.5-11.2V5.1z" fill="currentColor" stroke="none"/>',
  bell: '<path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5z"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  gear: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  help: '<circle cx="12" cy="12" r="9.3"/><path d="M9.1 9.3a3 3 0 0 1 5.8 1c0 2-3 2-3 3.9"/><circle cx="12" cy="17" r=".2" fill="currentColor"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 3v5h5M8 13h8M8 17h5"/>',  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5"/>',  chart: '<path d="M3.5 3.5v17h17"/><path d="M7 15l4-4 3 3 5-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  puzzle: '<path d="M9 3h6v2a2 2 0 0 0 2 2h2v6h-2a2 2 0 0 0 0 4h2v6h-6v-2a2 2 0 0 0-4 0v2H5v-6h2a2 2 0 0 0 0-4H5V7h4a2 2 0 0 0 0-4V3z"/>',  globe: '<circle cx="12" cy="12" r="9.3"/><path d="M2.7 12h18.6M12 2.7a15 15 0 0 1 0 18.6 15 15 0 0 1 0-18.6z"/>',
  camera: '<path d="M4 8h3.2l1.8-2.6h6l1.8 2.6H20v11.5H4z"/><circle cx="12" cy="13.7" r="3.4"/>',
  headphones: '<path d="M4 14v-2.4a8 8 0 0 1 16 0V14"/><rect x="3.3" y="14" width="4" height="6" rx="1"/><rect x="16.7" y="14" width="4" height="6" rx="1"/>',
  target: '<circle cx="12" cy="12" r="9.3"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
  mail: '<rect x="3" y="5.2" width="18" height="13.6" rx="2"/><path d="M3 7l9 6 9-6"/>',
  gift: '<rect x="3.2" y="8.5" width="17.6" height="12.5" rx="1"/><path d="M12 8.5V21M3.2 12.5h17.6"/><path d="M12 8.5c-2.2 0-4.4-1.1-4.4-3.1a2.1 2.1 0 0 1 4.2-.4 2.1 2.1 0 0 1 4.2.4c0 2-2.2 3.1-4.4 3.1z"/>',
  video: '<rect x="2" y="6.5" width="14.5" height="11" rx="2"/><path d="M22 8.5l-5.5 3.5 5.5 3.5z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  info:'<line x1="12" y1="10.5" x2="12" y2="18" stroke-width="3.2"/><circle cx="12" cy="5.8" r="1.5" fill="currentColor" stroke="none"/>',
  palette:'<path d="M13 3.2c-5.4 0-9.8 4.1-9.8 9.2 0 4 3 6.6 6 6.6 1.1 0 1.6-.6 1.6-1.4 0-.6-.4-1-.4-1.7 0-.9.8-1.6 1.9-1.6h2.1c3.3 0 6-2.4 6-5.8 0-3-3.2-5.3-7.4-5.3z" fill="currentColor" stroke="none"/><circle cx="8.5" cy="10.5" r=".9" fill="#000"/><circle cx="12" cy="8" r=".9" fill="#000"/><circle cx="16" cy="9.5" r=".9" fill="#000"/>',
  sparkle:'<path d="M6 4.5c.6 1.8 1.7 2.9 3.5 3.5-1.8.6-2.9 1.7-3.5 3.5-.6-1.8-1.7-2.9-3.5-3.5C4.3 7.4 5.4 6.3 6 4.5z" fill="currentColor" stroke="none"/><path d="M17 9c.9 2.6 2.5 4.2 5 5-2.5.8-4.1 2.4-5 5-.9-2.6-2.5-4.2-5-5 2.5-.8 4.1-2.4 5-5z" fill="currentColor" stroke="none"/>',
  square: '<path d="M9 6h12M9 12h12M9 18h12"/><rect x="3" y="4" width="4" height="4" rx="1"/><rect x="3" y="10" width="4" height="4" rx="1"/><rect x="3" y="16" width="4" height="4" rx="1"/>',
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/>',
  flask:'<path d="M9.5 3h5M10.2 3v6.2L5.8 18a2 2 0 0 0 1.8 2.9h8.8a2 2 0 0 0 1.8-2.9l-4.4-8.8V3"/><path d="M8 15h8"/>',
  tools: '<path d="M7 10h3v-3l-3.5-3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1-3 3l-6-6a6 6 0 0 1-8-8l3.5 3.5z"/>',
  rocket: '<path d="M15 4a6 6 0 0 1 5 5l-6 6a8 8 0 0 1-5 2l-3-3a8 8 0 0 1 2-5l7-5z"/><path d="M9 15l-4 4M12 18l-2 2M4 12l2-2"/><circle cx="15" cy="9" r="1"/>',rocket: '<path d="M15 4a6 6 0 0 1 5 5l-6 6a8 8 0 0 1-5 2l-3-3a8 8 0 0 1 2-5l7-5z"/><path d="M9 15l-4 4M12 18l-2 2M4 12l2-2"/><circle cx="15" cy="9" r="1"/>',
};

const accData = [
  {name:'General Information', icons:['user','doc','calendar','bell','globe','shield'], labels:['Class Rules','School Calendar','Class Schedule','Funds Budget','Grades']},
  {name:"Albums & Videos", icons:['camera','video','folder','music','star','globe'], labels:['General Content','Section Gallerys','Classroom Highlights','Featured Section','Important Events']},
  {name:'Attendance Manager', icons:['calendar','chart','user','bell','doc','target'], labels:['Daily Attendance Record','Weekly Summary','Monthly Report','Absences & Late Lists','Submission Section','Attendance Guidelines','Overall Attendance Status']},
  {name:'Learning Modules', icons:['book','doc','chart','headphones','video','target'], labels:['All Subjects','Weekly Modules','Download Materials','Instructions','Submission Portal','Reviewers & References','Archive Modules']},
  {name:'Special Actions', icons:['star','gift','lock','puzzle','mail','shield'], labels:['Research Project (R.I.A)','Admin Exclusive','Restricted Section (Officers)','AI Study Assistant (Classified)','Research Hub']},
];
const accBox = document.getElementById('accordions');
accData.forEach((sec)=>{
  const acc = document.createElement('div');
  acc.className = 'acc';
  acc.innerHTML = `
    <div class="acc-head">
      <h3>${sec.name}</h3>
      <div class="chev">${CHEV}</div>
    </div>
    <div class="acc-body">
      <div class="acc-list">
        ${sec.labels.map(lbl=>`<button type="button" class="acc-row">${lbl}</button>`).join('')}
      </div>
    </div>`;
  acc.querySelector('.acc-head').addEventListener('click', ()=>{
    const body = acc.querySelector('.acc-body');
    const isOpen = acc.classList.toggle('open');
    body.style.maxHeight = isOpen ? body.scrollHeight + 'px' : '0px';
  });
  accBox.appendChild(acc);
});

const featureData = [
  { image: './C1.jpg', tag: 'Brigada Eskwela' },
  { image: './C2.jpg', tag: 'Cariñosa' },
  { image: './C3.jpg', tag: 'Early Birds' },
  { image: './C4.jpg', tag: 'PTA Meeting' },
  { image: './C5.jpg', tag: 'Group Selfie' },
];

const featureTrack = document.getElementById('featureTrack');
featureData.forEach((f,i)=>{
  const slide = document.createElement('div');
  slide.className = 'feature-slide' + (i===0 ? ' active' : '');
  
  slide.style.backgroundImage = `url(${f.image})`;
  slide.style.backgroundSize = 'cover';
  slide.style.backgroundPosition = 'center';
  
  slide.innerHTML = `<span class="tag">${f.tag}</span>`;
  featureTrack.appendChild(slide);
});
let fIdx = 0;
function goFeature(i){
  fIdx = (i+featureData.length)%featureData.length;
  [...featureTrack.children].forEach((s,j)=> s.classList.toggle('active', j===fIdx));
}
setInterval(()=>goFeature(fIdx+1), 3200);

const qaData = [
  {ic:'star', label:'R.I.A Pro'},
  {ic:'gear', label: 'Control Center' },
  {ic:'trophy', label:'Rankings'},
  {ic:'shield', label:'Special User Section'},
  {ic:'sparkle', label:'Super AI', extra:true},
  {ic:'square', label:'Developers Lists', extra:true},
  {ic:'fire', label:'Pendulum Os', extra:true},
  {ic:'flask', label:'Test Features', extra:true},
  {ic:'tools', label:'Developer Options', extra:true},
  {ic:'rocket', label:'Future Mode', extra:true},
];

const qaList = document.getElementById('qaList');

qaData.forEach(q => {
  const row = document.createElement('div');
  row.className = 'qa-item' + (q.extra ? ' qa-extra' : '');
  row.innerHTML = `<div class="ic">${icon(ICONS[q.ic])}</div><span>${q.label}</span>`;
  qaList.appendChild(row);
});

const qaToggleBtn = document.getElementById('qaToggleBtn');
let qaExpanded = false;
let isLoading = false;

qaToggleBtn.addEventListener('click', () => {
  if (isLoading) return;

  if (!qaExpanded) {
    isLoading = true;
    qaToggleBtn.style.pointerEvents = 'none';

    const loader = document.createElement('div');
    loader.className = 'qa-dropdown-loader';
    loader.style.display = 'none';   // no spinner: the items just fade in

    const firstExtraItem = qaList.querySelector('.qa-extra');
    if (firstExtraItem) {
      qaList.insertBefore(loader, firstExtraItem);
    } else {
      qaList.appendChild(loader);
    }

setTimeout(() => {
  loader.remove();
  qaExpanded = true;
  qaList.classList.add('expanded');
  setTimeout(() => { if (qaExpanded) qaList.classList.add('qa-settled'); }, 300);   // after the 0.2s fade

  qaToggleBtn.innerHTML = 'Show Less <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="6 15 12 9 18 15"/></svg>';
  qaToggleBtn.style.pointerEvents = 'auto';
  isLoading = false;
}, 0);

  } else {
    qaExpanded = false;
    qaList.classList.remove('expanded', 'qa-settled');
    qaToggleBtn.innerHTML = 'See More <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
  }
});

const extData = [
  {ic:'gear', label:'Settings'},
  {ic:'folder', label:'Folders'},
  {ic:'help', label:'Instructions'},
  {ic:'doc', label:'Documents'},
  {ic:'bell', label:'Notifications'},
  {ic:'chat', label:'Chatters'},
  {ic:'chart', label:'Analytics'},
  {ic:'user', label:'Profile'},
  {ic:'book', label:'Article'},
  {ic:'lock', label:'Security'},
  {ic:'puzzle', label:'Extras'},
  {ic:'globe', label:'Global Chat'},
];
const extScroll = document.getElementById('extScroll');
extData.forEach(e=>{
  const item = document.createElement('div');
  item.className = 'ext-item';
  item.innerHTML = `<div class="ext-btn">${icon(ICONS[e.ic])}</div><span class="ext-name">${e.label}</span>`;
  extScroll.appendChild(item);
});

const planData = [
  {tag:'24H PASS', price:'₱29.99', per:'/ day', name:'Pro Mode : Professional (R.I.A) ', desc:'Enjoy 24-hour Pro Access with exclusive customization, special features, unique badges, cool effects, passkey login, and flexible Casual or Professional mode switching.', info:'Billed once at ₱29.99 for 24 hours of Pro Access. Access ends automatically after 24 hours with no auto-renewal.'},
  {tag:'POPULAR', price:'₱199.99', per:'/ month', name:'Admin Mode : Professional R+ (R.I.A)', desc:'Get a full month of R+ Access with all daily perks, priority support, advanced analytics, and early access to new Learning Modules.', info:'Billed at ₱199.99 every 30 days. Includes everything in the Basic Plan plus priority support and advanced analytics.'},
  {tag:'SAVE 35%', price:'₱1,299.99 ', per:'/ year', name:'Super VIP : Professional Pro+ (R.I.A)', desc:'Unlock a full year of Pro+ Access at the best value, including everything in Standard plus exclusive yearly badges and premium event invites.', info:'Billed at ₱1,299.99 every 365 days, the best value per day. Includes everything in the Standard Plan plus exclusive yearly badges and premium event invites.'},
];
const planTrack = document.getElementById('planTrack');
const planDots = document.getElementById('planDots');
planData.forEach((p,i)=>{
  const slide = document.createElement('div');
  slide.className = 'plan-slide';
  slide.innerHTML = `
    <div class="plan-card">
      <div class="plan-top">
        <div class="plan-badge">${p.tag}</div>
        <div class="plan-price">
          <div class="p-num"><b>${p.price}</b><div>${p.per}</div></div>
          <button type="button" class="info" aria-label="${p.name} Information"><span class="info-ic">${icon(ICONS.info,1.8)}</span></button>
        </div>
      </div>
      <div class="plan-name">${p.name}</div>
      <div class="plan-desc">${p.desc}</div>
      <div class="plan-cta">BUY NOW</div>
    </div>`;
  slide.querySelector('.info').addEventListener('click', (e)=>{
    e.stopPropagation();
    openModal(p.name, p.info);
  });
  planTrack.appendChild(slide);
  const dot = document.createElement('i');
  if(i===0) dot.className='on';
  planDots.appendChild(dot);
});
let pIdx = 0;
function goPlan(i){
  pIdx = (i+planData.length)%planData.length;
  planTrack.style.transform = `translateX(-${pIdx*100}%)`;
  [...planDots.children].forEach((d,j)=>d.className = j===pIdx?'on':'');
}
let planTimer = setInterval(()=>goPlan(pIdx+1), 3800);
(function(track){
  let startX=0, dx=0, dragging=false;
  track.addEventListener('touchstart', e=>{dragging=true; startX=e.touches[0].clientX; clearInterval(planTimer);});
  track.addEventListener('touchmove', e=>{ if(!dragging) return; dx = e.touches[0].clientX-startX; });
  track.addEventListener('touchend', ()=>{
    if(dx<-40) goPlan(pIdx+1); else if(dx>40) goPlan(pIdx-1);
    dx=0; dragging=false;
    planTimer = setInterval(()=>goPlan(pIdx+1), 3800);
  });
})(planTrack);

const sidebarPhone = document.getElementById('sidebarPhone');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
function openSidebar(){ sidebarPhone.classList.add('open'); overlay.classList.add('show'); document.documentElement.classList.add('sidebar-open'); document.body.classList.add('sidebar-open'); }
function closeSidebar(){ sidebarPhone.classList.remove('open'); overlay.classList.remove('show'); document.documentElement.classList.remove('sidebar-open'); document.body.classList.remove('sidebar-open'); }
menuBtn.addEventListener('click', ()=>{
  sidebarPhone.classList.contains('open') ? closeSidebar() : openSidebar();
});
overlay.addEventListener('click', closeSidebar);
overlay.addEventListener('touchmove', e=>e.preventDefault(), {passive:false});

/* =========================================================
   FEATURED POPUP  (What's New?  <->  Featured)
   - The round button (top right) switches between the two views.
   - Featured: swipe / drag left or right (or arrow keys) for the next / previous slide.
     Double tap a slide to see it full screen.
   - Edit the three settings below to change the content.
   ========================================================= */
(function () {
  const FT_START_VIEW = 'news';                  // 'news' = What's New? first, 'featured' = Featured first
  const FT_VERSION = '1.129.177.8 Beta Test';    // bottom-left text of What's New?
  // img: a .png / .jpg shown between the Project Name and the Project Description (leave '' for no picture)
  const FT_WHATS_NEW = [
    { name: 'Exo AI', img: 'ExoAI.png', desc:
      'EXO AI is a dedicated academic assistant designed to facilitate comprehensive student learning and scholarly productivity. Built to address the multifaceted demands of modern education, the platform provides structured support for research, writing, problem-solving, and examination preparation. Prioritizing genuine comprehension over simple answer generation, EXO AI adapts to individual learning objectives—deconstructing intricate subject matter into clear, methodical explanations. Whether organizing long-term academic projects or synthesizing dense course materials, EXO AI equips students with the analytical tools necessary to manage their workload effectively and elevate their educational outcomes.' },
    { name: 'Super AI George', img: 'SuperAI.png', desc: 
      'Super AI George** is the specialized system framework engineered to deliver seamless performance and continuous evolution across your experience. By dynamically managing real-time optimization, rendering, and interface adaptability, it ensures every interaction remains fluid, responsive, and stable under changing workloads. Built for zero-disruption growth, the framework deploys future improvements automatically in the background. This allows the system to continuously refine its capabilities and behavior without ever requiring hard reboots.' },
    { name: 'Cryle Nexo AI', img: 'CryleAI.jpg', desc: 
      'Cryle AI is the dedicated engine driving dynamic animations and gaming-style features throughout the app. By bringing fluid motion, responsive visual feedback, and interactive mechanics to every screen, it transforms routine navigation into a lively, fast, and engaging experience. Built to keep interactions snappy and intuitive, Cryle AI infuses the interface with energy without sacrificing speed. Every tap, transition, and feature feels playful, polished, and fun to use.' },
    { name: 'Pendulum OS', img: 'PendulumOs.png', desc: 
      'Pendulum OS is the core operating system powering R.I.A., serving as the central foundation for every feature and interaction. This latest update delivers substantial upgrades to overall performance, visual smoothness, and system-wide resource management. By optimizing core background processes and memory allocation, the operating system ensures faster load times and steadier responsiveness across all modules. Everything runs more reliably and efficiently, keeping R.I.A. agile and ready for seamless daily use.' },
    { name: 'Project Name', img: 'N5.png', desc: 'Project Description' },
    { name: 'Project Name', img: 'N6.png', desc: 'Project Description' },
    { name: 'Project Name', img: 'N7.png', desc: 'Project Description' },
    { name: 'Project Name', img: 'N8.png', desc: 'Project Description' }
  ];
  const FT_AUTO_SLIDE_MS = 4000;                 // Featured slides change by themselves

  const popupOverlay = document.getElementById('popupOverlay');
  const ftSwitch = document.getElementById('ftSwitch');
  const ftNews = document.getElementById('ftNews');
  const ftFeatured = document.getElementById('ftFeatured');
  const ftNewsList = document.getElementById('ftNewsList');
  const ftHint = document.getElementById('ftHint');
  const slider = document.getElementById('sliderContainer');
  const slides = Array.from(slider.querySelectorAll('.ft-slide'));
  let current = 0;
  let view = FT_START_VIEW;

  /* ---------- What's New? list ---------- */
  document.getElementById('ftVersion').textContent = FT_VERSION;
  const zoomBoxes = [];
  // pictures start zoomed in and zoom out smoothly when they scroll into view
  const zoomObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); zoomObserver.unobserve(en.target); }
    });
  }, { root: ftNewsList, threshold: 0.35 }) : null;
  function resetZoom() {
    zoomBoxes.forEach(function (b) {
      b.classList.remove('in');
      if (zoomObserver) { zoomObserver.unobserve(b); zoomObserver.observe(b); } else b.classList.add('in');
    });
  }
  FT_WHATS_NEW.forEach(function (item) {
    const li = document.createElement('li');
    const name = document.createElement('div');
    const desc = document.createElement('div');
    name.className = 'ft-news-name';
    desc.className = 'ft-news-desc';
    name.textContent = item.name;
    desc.textContent = item.desc;
    li.appendChild(name);
    if (item.img) {
      const box = document.createElement('div');
      const img = document.createElement('img');
      box.className = 'ft-news-img';
      img.src = item.img;
      img.alt = item.name;
      img.loading = 'lazy';
      img.draggable = false;
      img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
      // show the whole picture: the box takes the picture's own shape (nothing is cropped)
      img.addEventListener('load', function () {
        if (img.naturalWidth && img.naturalHeight) box.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
      });
      box.appendChild(img);
      zoomBoxes.push(box);
      li.appendChild(box);
    }
    li.appendChild(desc);
    ftNewsList.appendChild(li);
  });

  /* ---------- views ---------- */
  function setView(next) {
    view = next;
    popupOverlay.dataset.view = view;
    ftNews.hidden = view !== 'news';
    ftFeatured.hidden = view !== 'featured';
    ftSwitch.setAttribute('aria-label', view === 'news' ? 'Show Featured' : "Back to What's New");
    if (view === 'featured') startAutoSlide(); else { stopAutoSlide(); resetZoom(); }
    document.getElementById('ftModal').setAttribute('aria-labelledby', view === 'news' ? 'ftTitleNews' : 'ftTitleFeatured');
  }
  ftSwitch.addEventListener('click', function () { setView(view === 'news' ? 'featured' : 'news'); });

  /* ---------- Featured slides ---------- */
  let autoTimer = null;
  function showSlide(index) {
    if (!slides.length) return;
    slides[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');          // fades in (same as the original)
  }
  const nextSlide = function () { showSlide(current + 1); };
  const prevSlide = function () { showSlide(current - 1); };
  function stopAutoSlide() { clearInterval(autoTimer); autoTimer = null; }
  function startAutoSlide() {
    stopAutoSlide();
    if (slides.length > 1) autoTimer = setInterval(nextSlide, FT_AUTO_SLIDE_MS);
  }
  if (slides.length < 2) ftHint.hidden = true;

  // swipe / drag (touch, pen and mouse), double tap = full screen
  const SWIPE_PX = 40;
  const DOUBLE_TAP_MS = 300;
  let downX = null, downY = 0, lastTap = 0;

  slider.addEventListener('pointerdown', function (e) {
    downX = e.clientX; downY = e.clientY;
    try { slider.setPointerCapture(e.pointerId); } catch (err) {}
  });
  slider.addEventListener('pointerup', function (e) {
    if (downX === null) return;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    downX = null;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? nextSlide() : prevSlide();
      startAutoSlide();
      lastTap = 0;
      return;
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {         // a tap
      const now = Date.now();
      if (now - lastTap < DOUBLE_TAP_MS) { lastTap = 0; openImageViewer(slides[current].src, slides[current].alt); }
      else lastTap = now;
    }
  });
  slider.addEventListener('pointercancel', function () { downX = null; });
  slider.addEventListener('dragstart', function (e) { e.preventDefault(); });

  document.addEventListener('keydown', function (e) {
    if (popupOverlay.style.display !== 'flex') return;
    if (e.key === 'Escape') {
      if (imageViewer.style.display === 'flex') closeImageViewer(); else closeFeaturedPopup();
    } else if (view === 'featured' && e.key === 'ArrowRight') { nextSlide(); startAutoSlide(); }
    else if (view === 'featured' && e.key === 'ArrowLeft') { prevSlide(); startAutoSlide(); }
  });

  /* ---------- full screen image ---------- */
  const imageViewer = document.getElementById('imageViewer');
  const imageViewerImg = document.getElementById('imageViewerImg');

  function openImageViewer(src, alt) {
    imageViewerImg.src = src;
    imageViewerImg.alt = alt || '';
    imageViewer.style.display = 'flex';
    stopAutoSlide();
  }
  function closeImageViewer() {
    imageViewer.style.display = 'none';
    imageViewerImg.removeAttribute('src');
    if (popupOverlay.style.display === 'flex' && view === 'featured') startAutoSlide();
  }
  window.closeImageViewer = closeImageViewer;

  /* ---------- lock page scroll while the popup is open (the What's New list can still scroll) ---------- */
  popupOverlay.addEventListener('touchmove', function (e) {
    const list = ftNewsList;
    const scrollable = list.scrollHeight > list.clientHeight && list.contains(e.target);
    if (!scrollable) e.preventDefault();
  }, { passive: false });
  popupOverlay.addEventListener('wheel', function (e) {
    if (!ftNewsList.contains(e.target)) e.preventDefault();
  }, { passive: false });

  /* ---------- open / close ---------- */
  function openFeaturedPopup() {
    popupOverlay.style.display = 'flex';
    document.documentElement.classList.add('popup-open');
    document.body.classList.add('popup-open');
    slides.forEach(function (s) { s.classList.remove('active'); });
    current = 0;
    if (slides[0]) slides[0].classList.add('active');
    ftNewsList.scrollTop = 0;
    setView(FT_START_VIEW);
  }
  function closeFeaturedPopup() {
    popupOverlay.style.display = 'none';
    document.documentElement.classList.remove('popup-open');
    document.body.classList.remove('popup-open');
    stopAutoSlide();
    closeImageViewer();
  }
  window.openFeaturedPopup = openFeaturedPopup;
  window.closeFeaturedPopup = closeFeaturedPopup;

  // Show the popup every time the page opens while logged in with a Firebase account.
  // No Firebase login = no popup.
  async function shouldShowFeaturedPopup() {
    let saved = null;
    saved = getSavedSession();
    if (!saved || !saved.userId) return false;               // not logged in with a Firebase account

    if (typeof accountsRef !== 'undefined') {                // confirm the account really exists in Firebase
      try {
        const snap = await accountsRef.doc(String(saved.userId).toUpperCase()).get();
        if (!snap.exists) return false;
      } catch (e) {
        console.error('Could not confirm the login with Firebase:', e);
        return false;
      }
    }
    return true;
  }

  window.addEventListener('load', async function () {
    if (await shouldShowFeaturedPopup()) openFeaturedPopup();
  });
})();

/* =========================================================
   ANIMATIONS (same style as the Search page)
   ========================================================= */
(function () {
  const run = function () {
    const inViewIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add(en.target.classList.contains('pop-item') ? 'in-view' : 'in');
        inViewIO.unobserve(en.target);
      });
    }, { threshold: 0.12 }) : null;

    function watch(el, cls) {
      if (inViewIO) inViewIO.observe(el); else el.classList.add(cls);
    }

    // whole sections fade/slide up as they scroll into view
    const sections = document.querySelectorAll(
      'body > .greeting, body > .dashboard-header, body > .section-label, body > .worksheets-scroll, ' +
      'body > .tasks-manager-label, body > .dues-card, body > .attendance-header, body > .attendance-footer, ' +
      'body > .school-events-section, body > .slideshow-section, body > .ria-banner-card, body > .app-footer'
    );
    sections.forEach(function (el) {
      el.classList.add('reveal');
      el.style.setProperty('--i', 0);
      watch(el, 'in');
    });

    // cards / pills / rows pop in one after another
    const groups = [
      '.worksheets-scroll .btn-pill',
      '.dues-list .due-item',
      '.attendance-scroll .attendance-card'
    ];
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        el.classList.add('pop-item');
        el.style.setProperty('--i', Math.min(i, 5));
        watch(el, 'in-view');
      });
    });

    // icons pop when tapped
    document.querySelectorAll('.icon-link').forEach(function (a) {
      a.addEventListener('click', function () {
        a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop');
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();


/* sidebar sections glide in one after another when it opens */
(function () {
  const side = document.getElementById('sidebarPhone');
  if (!side) return;
  Array.from(side.children).forEach(function (el, i) { el.style.setProperty('--i', i); });
})();

/* =========================================================
   GREETING: show the User Name (the "username" saved on the account) of the logged-in account
   + mark the account as online in Firebase
   ========================================================= */
(async function showUserName() {
  const el = document.getElementById('greetingUser');
  if (!el || typeof accountsRef === 'undefined') return;

  let saved = null;
  saved = getSavedSession();
  if (!saved || !saved.userId) return;          // not a Firebase account -> keep "User"

  try {
    const snap = await accountsRef.doc(String(saved.userId).toUpperCase()).get();
    if (!snap.exists) { el.textContent = 'User'; return; }

    const name = String(snap.data().username || '').trim();   // the User Name saved on the account
    el.textContent = name || 'User';

    startPresence(snap.id);                      // account is now online
  } catch (e) {
    console.error('Could not load the User Name from Firebase:', e);
  }
})();

/* Skeleton loading: placeholders stay until the page + images have loaded
   (shown for at least 700 ms, and never longer than 8 s). */
(function () {
  var start = Date.now(), done = false;
  function finish() {
    if (done) return; done = true;
    var wait = Math.max(0, 700 - (Date.now() - start));
    setTimeout(function () {
      var b = document.body;
      b.classList.add('sk-reveal');          /* content fades in over the blank shapes */
      b.classList.remove('sk-loading');
      setTimeout(function () { b.classList.remove('sk-reveal'); }, 700);
    }, wait);
  }
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish);
  setTimeout(finish, 8000);
})();

/* =========================================================
   USER PROFILE: menu header + profile modal + Change Name / Change Passkeys
   Everything is saved on the account in Firebase (accounts/<User ID>):
   username, passkey, profilePhoto, bannerPhoto. The page updates live.
   ========================================================= */
(function () {
  const $ = id => document.getElementById(id);
  const trigger = $('profileTrigger');
  if (!trigger) return;

  const profileModal = $('profileModal'), nameModal = $('nameModal'), passModal = $('passModal'), saving = $('pfSaving');
  let uid = null;            // User ID of the logged-in account
  let account = {};          // latest copy of the account from Firebase

  try {
    const saved = getSavedSession();
    if (saved && saved.userId) uid = String(saved.userId).toUpperCase();
  } catch (e) {}

  // Only small image data URLs made by this page are shown as photos.
  const safePhoto = src => (typeof src === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) ? src : '';
  const show = v => (v === undefined || v === null || String(v) === '') ? '—' : String(v);
  const setPhoto = (img, fallback, src) => {
    const ok = safePhoto(src);
    if (ok) img.src = ok; else img.removeAttribute('src');
    img.hidden = !ok;
    fallback.toggleAttribute('hidden', !!ok);   // SVG elements have no .hidden property, so use the attribute
  };

  // ---------- paint the account everywhere ----------
  function paint() {
    const name = String(account.username || '').trim() || 'User Name';
    $('hdrName').textContent = name;
    $('pfName').textContent = name;
    $('hdrType').textContent = account.type || 'Account Type';
    $('pfType').textContent = account.type || 'Account Type';
    const g = $('greetingUser'); if (g && account.username) g.textContent = account.username;

    setPhoto($('hdrPhoto'), $('hdrPhotoDefault'), account.profilePhoto);
    setPhoto($('pfPhoto'), $('pfPhotoDefault'), account.profilePhoto);
    const b = $('pfBanner'), bs = safePhoto(account.bannerPhoto);
    if (bs) b.src = bs; else b.removeAttribute('src');
    b.hidden = !bs;
    $('pfDelBanner').disabled = !bs;                              // nothing to delete -> greyed out
    $('pfDelPhoto').disabled = !safePhoto(account.profilePhoto);

    $('pfUserId').textContent = show(account.userId || uid);
    $('pfDate').textContent = show(account.date);
    $('pfPasskey').textContent = show(account.passkey);
    $('pfRole').textContent = show(account.role);
  }

  // live link to Firebase
  if (uid && typeof accountsRef !== 'undefined') {
    accountsRef.doc(uid).onSnapshot(
      snap => { if (snap.exists) { account = snap.data(); paint(); } },
      err => console.error('Could not load the profile from Firebase:', err)
    );
  }

  // ---------- open / close ----------
  // open / close with an animation (classes pf-in / pf-out, see style.css)
  const CLOSE_MS = 240;
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isOpen = el => el.style.display === 'flex' && !el.classList.contains('pf-out');
  function open(el) {
    clearTimeout(el._pfTimer);
    el.classList.remove('pf-out');
    el.style.display = 'flex';
    el.classList.remove('pf-in'); void el.offsetWidth; el.classList.add('pf-in');
  }
  function close(el) {
    if (el.style.display !== 'flex' || el.classList.contains('pf-out')) return;
    if (reduceMotion()) { el.style.display = 'none'; el.classList.remove('pf-in'); return; }
    el.classList.remove('pf-in');
    el.classList.add('pf-out');
    clearTimeout(el._pfTimer);
    el._pfTimer = setTimeout(() => { el.style.display = 'none'; el.classList.remove('pf-out'); }, CLOSE_MS);
  }

  function note(msg, isErr) { const n = $('pfNote'); n.textContent = msg || ''; n.classList.toggle('err', !!isErr); }

  // Shows the loading modal ("Changing User name...") for at least 700 ms while a save runs.
  async function withSaving(label, work) {
    $('pfSavingText').textContent = label;
    open(saving);
    const started = Date.now();
    try {
      await work();
      await new Promise(r => setTimeout(r, Math.max(0, 700 - (Date.now() - started))));
    } finally { close(saving); }
  }

  function openProfile() { note(''); paint(); open(profileModal); $('pfClose').focus({ preventScroll: true }); }
  function closeProfile() { setMenu(false); close(profileModal); trigger.focus({ preventScroll: true }); }

  trigger.addEventListener('click', openProfile);
  trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfile(); } });
  $('pfClose').addEventListener('click', closeProfile);   // the arrow closes the profile

  // tapping the dark area outside a modal closes it
  profileModal.addEventListener('click', e => { if (e.target === profileModal) { if (menuOpen()) setMenu(false); else closeProfile(); } });
  nameModal.addEventListener('click', e => { if (e.target === nameModal) close(nameModal); });
  passModal.addEventListener('click', e => { if (e.target === passModal) close(passModal); });

  function needLogin() {
    if (uid && typeof accountsRef !== 'undefined') return false;
    note('Log in with your account first.', true);
    return true;
  }

  // ---------- Change Name ----------
  $('openNameBtn').addEventListener('click', () => {
    if (needLogin()) return;
    $('nameInput').value = String(account.username || '').trim();
    $('nameError').textContent = '';
    open(nameModal); $('nameInput').focus(); $('nameInput').select();
  });
  $('nameClose').addEventListener('click', () => close(nameModal));

  $('nameForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('nameInput').value.replace(/\s+/g, ' ').trim();
    const err = $('nameError');
    if (!name) { err.textContent = 'Enter a name.'; return; }
    if (name.length > 24) { err.textContent = 'Use 24 characters or fewer.'; return; }
    if (name === String(account.username || '').trim()) { close(nameModal); return; }
    const btn = $('nameEnter'); btn.disabled = true; err.textContent = '';
    close(nameModal);                                   // hide the form, show "Changing User name..."
    try {
      await withSaving('Changing User name...', () => updateAccountUsername(uid, name));
      note('Name changed.');
    } catch (ex) {
      console.error(ex);
      err.textContent = 'Could not save. Check your connection and try again.';
      open(nameModal);                                  // bring the form back with the error
    } finally { btn.disabled = false; }
  });

  // ---------- Change Passkeys ----------
  $('openPassBtn').addEventListener('click', () => {
    if (needLogin()) return;
    $('passInput').value = '';
    $('passError').textContent = '';
    open(passModal); $('passInput').focus();
  });
  $('passClose').addEventListener('click', () => close(passModal));
  $('passInput').addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  });

  $('passForm').addEventListener('submit', async e => {
    e.preventDefault();
    const key = $('passInput').value.toUpperCase();
    const err = $('passError');
    if (key.length !== 8 || !/[A-Z]/.test(key) || !/[0-9]/.test(key)) {
      err.textContent = 'Use 8 characters with at least one letter and one number.'; return;
    }
    if (key === account.passkey) { err.textContent = 'That is already your passkey.'; return; }
    const btn = $('passEnter'); btn.disabled = true; err.textContent = '';
    close(passModal);                                   // hide the form, show "Changing passkeys..."
    try {
      await withSaving('Changing passkeys...', () => updateAccountPasskey(uid, key));
      note('Passkey changed.');
    } catch (ex) {
      console.error(ex);
      err.textContent = 'Could not save. Check your connection and try again.';
      open(passModal);                                  // bring the form back with the error
    } finally { btn.disabled = false; }
  });

  // ---------- Profile photo / banner (+ buttons) ----------
  // ---------- Cropper (banner + profile photo): the user moves / zooms the picture to choose what shows ----------
  const cropModal = $('cropModal'), cropFrame = $('cropFrame'), cropImg = $('cropImg'), cropZoom = $('cropZoom');
  const cropBox = $('cropBox');
  // one cropper, two modes: the banner is wide, the profile photo is a round (square-saved) picture
  const CROP_MODES = {
    banner: { w: 720, h: 300, q: 0.85, title: 'Crop your banner',        saving: 'Changing banner...',  done: 'Banner saved.', save: (id, url) => updateAccountBanner(id, url) },
    photo:  { w: 256, h: 256, q: 0.82, title: 'Crop your profile photo', saving: 'Changing profile...', done: 'Photo saved.',  save: (id, url) => updateAccountPhoto(id, url) }
  };
  let cropMode = 'banner';
  const crop = { url: '', iw: 0, ih: 0, cx: 0, cy: 0, zoom: 1, fw: 0, fh: 0 };   // cx, cy = image point shown at the frame centre

  const cropScale = () => Math.max(crop.fw / crop.iw, crop.fh / crop.ih) * crop.zoom;   // image px -> frame px

  function cropClamp() {
    const s = cropScale(), halfW = crop.fw / s / 2, halfH = crop.fh / s / 2;
    crop.cx = Math.min(crop.iw - halfW, Math.max(halfW, crop.cx));
    crop.cy = Math.min(crop.ih - halfH, Math.max(halfH, crop.cy));
  }
  function cropRender() {
    cropClamp();
    const s = cropScale();
    cropImg.style.width = (crop.iw * s) + 'px';
    cropImg.style.height = (crop.ih * s) + 'px';
    cropImg.style.transform = 'translate(' + (crop.fw / 2 - crop.cx * s) + 'px,' + (crop.fh / 2 - crop.cy * s) + 'px)';
    cropZoom.value = crop.zoom;
  }
  function cropSetZoom(z) { crop.zoom = Math.min(4, Math.max(1, z)); cropRender(); }

  function cropEnd() {
    close(cropModal);
    cropBox.classList.remove('is-photo');
    cropImg.removeAttribute('src');
    if (crop.url) { URL.revokeObjectURL(crop.url); crop.url = ''; }
  }

  function cropStart(file, mode) {
    cropMode = CROP_MODES[mode] ? mode : 'banner';
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (crop.url) URL.revokeObjectURL(crop.url);
      crop.url = url; crop.iw = img.naturalWidth; crop.ih = img.naturalHeight;
      crop.cx = crop.iw / 2; crop.cy = crop.ih / 2; crop.zoom = 1;
      cropImg.src = url;
      $('cropTitle').textContent = CROP_MODES[cropMode].title;
      cropBox.classList.toggle('is-photo', cropMode === 'photo');
      open(cropModal);
      crop.fw = cropFrame.offsetWidth; crop.fh = cropFrame.offsetHeight;   // layout size (not affected by the pop-in animation)
      cropRender();
      $('cropSave').focus({ preventScroll: true });
    };
    img.onerror = () => { URL.revokeObjectURL(url); note('Could not read that image. Try a different one.', true); };
    img.src = url;
  }

  // drag to move; two fingers to pinch-zoom; wheel / slider to zoom
  const ptrs = new Map();
  let pinchDist = 0;
  cropFrame.addEventListener('pointerdown', e => {
    cropFrame.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchDist = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  cropFrame.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId);
    if (!p || !crop.iw) return;
    const nx = e.clientX, ny = e.clientY;
    if (ptrs.size === 1) {
      const s = cropScale();
      crop.cx -= (nx - p.x) / s; crop.cy -= (ny - p.y) / s;
      p.x = nx; p.y = ny;
      cropRender();
    } else if (ptrs.size === 2) {
      p.x = nx; p.y = ny;
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist) cropSetZoom(crop.zoom * d / pinchDist);
      pinchDist = d;
    }
  });
  const cropPtrUp = e => { ptrs.delete(e.pointerId); pinchDist = 0; };
  cropFrame.addEventListener('pointerup', cropPtrUp);
  cropFrame.addEventListener('pointercancel', cropPtrUp);
  cropFrame.addEventListener('wheel', e => { e.preventDefault(); cropSetZoom(crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
  cropZoom.addEventListener('input', () => cropSetZoom(parseFloat(cropZoom.value)));
  window.addEventListener('resize', () => {
    if (!isOpen(cropModal)) return;
    crop.fw = cropFrame.offsetWidth; crop.fh = cropFrame.offsetHeight; cropRender();
  });

  $('cropCancel').addEventListener('click', cropEnd);
  cropModal.addEventListener('click', e => { if (e.target === cropModal) cropEnd(); });

  $('cropSave').addEventListener('click', async () => {
    if (!crop.url || !uid) return;
    const m = CROP_MODES[cropMode];
    const s = cropScale(), sw = crop.fw / s, sh = crop.fh / s;
    const c = document.createElement('canvas'); c.width = m.w; c.height = m.h;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, m.w, m.h);
    g.imageSmoothingQuality = 'high';
    g.drawImage(cropImg, crop.cx - sw / 2, crop.cy - sh / 2, sw, sh, 0, 0, m.w, m.h);
    const dataUrl = c.toDataURL('image/jpeg', m.q);
    cropEnd();
    $('pfSavingText').textContent = m.saving; open(saving);
    const started = Date.now();
    try {
      await m.save(uid, dataUrl);
      await new Promise(r => setTimeout(r, Math.max(0, 700 - (Date.now() - started))));
      note(m.done);
    } catch (ex) {
      console.error(ex);
      note('Could not save the image. Try a different one.', true);
    } finally { close(saving); }
  });

  // + on the banner / profile photo: choose a picture, then crop it
  function wireCropPicker(btnId, inputId, mode) {
    $(btnId).addEventListener('click', () => {
      if (needLogin()) return;
      $(inputId).value = ''; $(inputId).click();
    });
    $(inputId).addEventListener('change', () => {
      const file = $(inputId).files && $(inputId).files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return note('Choose an image file.', true);
      note('');
      cropStart(file, mode);
    });
  }
  wireCropPicker('pfBannerBtn', 'pfBannerInput', 'banner');
  wireCropPicker('pfPhotoBtn',  'pfPhotoInput',  'photo');

  // ---------- Three-dot menu: Delete Banner / Delete Profile ----------
  const pfBox = profileModal.querySelector('.pf-modal'), menuBtn = $('pfMenuBtn'), menu = $('pfMenu');
  function menuOpen() { return !menu.hidden; }
  function setMenu(on) {
    menu.hidden = !on;
    pfBox.classList.toggle('pf-menu-open', on);       // dims the rest of the profile (see style.css)
    menuBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  menuBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(!menuOpen()); });
  // tapping anywhere else inside the profile just closes the menu
  pfBox.addEventListener('click', e => { if (menuOpen() && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false); });

  async function deleteImage(field, savingText, doneMsg) {
    setMenu(false);
    if (needLogin()) return;
    note('');
    try {
      await withSaving(savingText, async () => {
        // removes the fields from the account in Firebase (see accounts-db.js); the page then falls back to the default picture
        await (field === 'bannerPhoto' ? deleteAccountBanner(uid) : deleteAccountPhoto(uid));
      });
      note(doneMsg);
    } catch (ex) {
      console.error(ex);
      note('Could not delete the image. Try again.', true);
    }
  }
  $('pfDelBanner').addEventListener('click', () => deleteImage('bannerPhoto', 'Deleting banner...', 'Banner deleted.'));
  $('pfDelPhoto').addEventListener('click', () => deleteImage('profilePhoto', 'Deleting profile...', 'Photo deleted.'));

  // Escape closes the top-most profile modal first
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (isOpen(cropModal)) cropEnd();
    else if (menuOpen()) setMenu(false);
    else if (isOpen(passModal)) close(passModal);
    else if (isOpen(nameModal)) close(nameModal);
    else if (isOpen(profileModal)) closeProfile();
  });

  paint();
})();

/* =========================================================
   SWITCH ACC: "SWITCH ACC" button -> modal with a Password (Passkey) box + Login.
   Looks in Firebase (accounts collection) for the User whose passkey matches,
   then logs this browser in as that User.
   ========================================================= */
(function () {
  const $ = id => document.getElementById(id);
  const btn = $('switchAccBtn'), modal = $('switchModal'), form = $('switchForm');
  const input = $('switchInput'), err = $('switchError'), go = $('switchLogin');
  if (!btn || !modal || !form) return;

  const CLOSE_MS = 240;
  const isOpen = () => modal.style.display === 'flex' && !modal.classList.contains('pf-out');
  function open() {
    clearTimeout(modal._pfTimer);
    modal.classList.remove('pf-out');
    modal.style.display = 'flex';
    modal.classList.remove('pf-in'); void modal.offsetWidth; modal.classList.add('pf-in');
  }
  function close() {
    if (!isOpen()) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { modal.style.display = 'none'; modal.classList.remove('pf-in'); return; }
    modal.classList.remove('pf-in'); modal.classList.add('pf-out');
    clearTimeout(modal._pfTimer);
    modal._pfTimer = setTimeout(() => { modal.style.display = 'none'; modal.classList.remove('pf-out'); }, CLOSE_MS);
  }

  function openSwitch() {
    input.value = ''; err.textContent = ''; go.disabled = false;
    open(); input.focus();
  }

  btn.addEventListener('click', openSwitch);
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSwitch(); } });
  $('switchClose').addEventListener('click', close);                       // X button
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // Passkey = 8 characters, A-Z and 0-9
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    err.textContent = '';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const key = input.value.toUpperCase();
    if (!key) { err.textContent = 'Enter the password.'; return; }
    if (typeof accountsRef === 'undefined') { err.textContent = 'Could not connect. Try again.'; return; }

    go.disabled = true; err.textContent = '';
    try {
      // find the User that has this passkey
      const snap = await accountsRef.where('passkey', '==', key).limit(1).get();
      if (snap.empty) {
        err.textContent = 'No user found with that password.';
        go.disabled = false; return;
      }
      const newId = snap.docs[0].id;
      const currentId = (typeof getSessionUserId === 'function') ? getSessionUserId() : '';
      if (currentId && newId === currentId) {
        err.textContent = 'You are already logged in to this account.';
        go.disabled = false; return;
      }

      // show "Switching account..." then log in as the new User
      close();
      const saving = $('pfSaving');
      if ($('pfSavingText')) $('pfSavingText').textContent = 'Switching account...';
      if (saving) saving.style.display = 'flex';
      const started = Date.now();

      try { if (typeof stopPresence === 'function') await stopPresence(); } catch (x) {}          // old account -> offline
      try { if (currentId && typeof resetOnlineTime === 'function') await resetOnlineTime(currentId); } catch (x) {}
      saveLoginSession(newId);                                                                    // new account is now the login

      await new Promise(r => setTimeout(r, Math.max(0, 700 - (Date.now() - started))));
      window.location.reload();                                                                   // page loads as the new User
    } catch (ex) {
      console.error('Switch account failed:', ex);
      const saving = $('pfSaving'); if (saving) saving.style.display = 'none';
      open();
      err.textContent = 'Could not check the password. Check your connection and try again.';
      go.disabled = false;
    }
  });
})();


/* Logged out in another tab -> this tab goes back to the login page too. */
window.addEventListener('storage', function (e) {
  if (e.key === 'passkeyUser' && !e.newValue) window.location.href = LOGOUT_REDIRECT_URL;
});
