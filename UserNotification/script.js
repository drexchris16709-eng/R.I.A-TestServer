(function () {
  // ---------- Staggered entrance ----------
  document.querySelectorAll('#panel-notification .section-title, #panel-notification .item')
    .forEach((el, i) => el.style.setProperty('--i', i));

  // ---------- Bottom nav: hides while scrolling, returns when scrolling stops ----------
  // 1) The nav hides while the user scrolls and comes back when scrolling stops.
  // 2) At the very bottom of the page it stays hidden, and comes back as soon as
  //    the user scrolls up a little from the bottom.
  const navEl = document.querySelector('.bottom-nav');
  const SHOW_AFTER = 12;   // px up from the very bottom: nav may appear once scrolling stops
  const IDLE_MS = 180;     // scrolling counts as stopped after this long
  let idleTimer;

  const metrics = () => {
    const doc = document.documentElement;
    return {
      doc,
      canScroll: doc.scrollHeight - window.innerHeight > 24,
      fromBottom: doc.scrollHeight - (window.scrollY + window.innerHeight)
    };
  };

  function updateNav() {
    const { doc, canScroll } = metrics();
    if (!canScroll || doc.classList.contains('inbox-open')) {
      navEl.classList.remove('nav-hidden');
      return;
    }
    navEl.classList.add('nav-hidden');           // any scrolling (up or down) hides it

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {               // scrolling stopped
      // stopped at the deep bottom: stay hidden; anywhere else: show
      if (metrics().fromBottom >= SHOW_AFTER) navEl.classList.remove('nav-hidden');
    }, IDLE_MS);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);

  // ---------- Tabs ----------
  const tabs = document.querySelectorAll('.tab');
  const panels = {
    notification: document.getElementById('panel-notification'),
    updates: document.getElementById('panel-updates')
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab === 'inbox') { window.RIA_inbox.open(); return; }
      if (tab.dataset.tab === 'updates') { window.RIA_updates.open(); return; }
      tabs.forEach(t => t.classList.remove('active'));
      Object.values(panels).forEach(p => p.classList.remove('show'));
      tab.classList.add('active');
      panels[tab.dataset.tab].classList.add('show');
    });
  });

  // ---------- Online time ----------
  // Counts only while the page is visible and the device is online. For a signed-in account it is saved
  // in Firebase and continues after a refresh or reopening; it starts again from 0h, 0m, 0s only after logout.
  const inTimeEl = document.getElementById('inActiveTime');
  const timeEl = document.getElementById('activeTime');
  const dot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  let total = 0;

  // clear anything saved by earlier versions so nothing is carried over
  ['ria_active_seconds', 'ria_notification_active_seconds', 'ria_inbox_active_seconds'].forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
    try { sessionStorage.removeItem(k); } catch (e) {}
  });
  try { document.cookie = 'ria_active_seconds=; max-age=0; path=/'; } catch (e) {}
  try { window.name = String(window.name).replace(/ria_t=\d+;?/, ''); } catch (e) {}
  try { if (/ria_t=/.test(window.location.hash)) history.replaceState(history.state, '', window.location.pathname + window.location.search); } catch (e) {}

  function format(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h + 'h, ' + m + 'm, ' + s + 's';
  }

  function render() { const t = format(total); timeEl.textContent = t; if (inTimeEl) inTimeEl.textContent = t; }

  function setStatus() {
    const online = navigator.onLine;
    dot.classList.toggle('off', !online);
    statusText.textContent = online ? 'Online' : 'Offline';
  }

  render();
  setStatus();
  window.addEventListener('online', setStatus);
  window.addEventListener('offline', setStatus);

  // ---------- Logout: the counter stops and goes back to 0 ----------
  // If this page was opened by a signed-in account and that sign-in is gone now (logout), the counter must
  // stop, show 0h, 0m, 0s and nothing may be saved any more. This is checked every second, and again when the
  // page is shown from the back/forward cache, because a page restored with the Back button keeps its old timer.
  const signedInAtOpen = (typeof getSessionUserId === 'function') ? getSessionUserId() : '';
  let loggedOut = false;

  function checkLogout() {
    if (loggedOut || !signedInAtOpen) return loggedOut;
    const nowId = getSessionUserId();
    if (nowId === signedInAtOpen) return false;       // still the same account
    loggedOut = true;                                 // signed out (or another account signed in)
    total = 0;
    render();
    try { if (typeof stopPresence === 'function') stopPresence(); } catch (e) {}   // stop heartbeat + saving
    try { if (typeof resetOnlineTime === 'function') resetOnlineTime(signedInAtOpen).catch(() => {}); } catch (e) {}
    return true;
  }

  setInterval(() => {
    if (checkLogout()) return;                        // logged out: stop counting
    if (document.visibilityState === 'visible' && navigator.onLine) {
      total += 1;
      render();
    }
  }, 1000);
  window.addEventListener('pageshow', checkLogout);

  // ---------- Online disappears (connection lost) = the time starts again from 0 ----------
  // If the device stays offline for a minute or more, the Online time is reset when the connection returns.
  const OFFLINE_RESET_MS = 60000;
  let offlineSince = 0;
  window.addEventListener('offline', () => { offlineSince = Date.now(); });
  window.addEventListener('online', () => {
    const wasOffline = offlineSince && (Date.now() - offlineSince >= OFFLINE_RESET_MS);
    offlineSince = 0;
    if (!wasOffline || loggedOut) return;
    total = 0;
    render();
    try { if (signedInAtOpen && typeof resetOnlineTime === 'function') resetOnlineTime(signedInAtOpen).catch(() => {}); } catch (e) {}
  });
  document.addEventListener('visibilitychange', checkLogout);

  // ---------- Firebase "online" is false = the Online time goes back to 0 ----------
  // Watches the account in Firebase. Whenever its "online" field is false (set by this page, another page or
  // another tab), the counter shows 0h, 0m, 0s and the saved time is set to 0.
  function watchOnlineFlag(id) {
    if (typeof accountsRef === 'undefined') return;
    try {
      accountsRef.doc(id).onSnapshot(snap => {
        const d = snap.exists ? snap.data() : null;
        if (!d || d.online !== false) return;
        total = 0;
        render();
        if (Number(d.onlineSeconds) > 0 && typeof resetOnlineTime === 'function') resetOnlineTime(id).catch(() => {});
      }, e => console.warn('Online watch:', e));
    } catch (e) { console.warn('Online watch:', e); }
  }

  // ---------- Firebase: Online status + Online time saved on the signed-in account ----------
  // While this page is open the account is "online" in Firebase, and its online time (the number in the
  // header) is saved as onlineSeconds. On open, the saved time is loaded first so the counter carries on
  // instead of restarting. Nobody signed in = nothing saved.
  if (typeof firebase !== 'undefined' && typeof startPresence === 'function') {
    try {
      const me = getSessionUserId();
      if (me && (typeof flushPendingTimeResets !== 'function' || typeof getOnlineSeconds !== 'function')) {
        startPresence(me);                             // older accounts-db.js copy: online status only
      } else if (me) {
        flushPendingTimeResets()                       // a logout reset still waiting? do it first
          .then(() => (typeof resetTimeIfOffline === 'function') ? resetTimeIfOffline(me).catch(() => {}) : null)   // was it offline for a while? then start from 0
          .then(() => getOnlineSeconds(me))
          .then(saved => { total += saved; render(); startPresence(me, () => loggedOut ? 0 : total); watchOnlineFlag(me); })
          .catch(e => { console.warn('Online time:', e); startPresence(me); });   // presence only, never overwrite the saved time
      }
    } catch (e) { console.warn('Presence:', e); }
  }
})();

(function () {
  const $ = id => document.getElementById(id);
  const CHEV = '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>';


  /* ----- Example messages (profile picture: Logo.jpg) ----- */
  const DATA = [
    { id: 1, av: 'Logo.jpg', name: 'Super AI', subj: 'Welcome to R.I.A!', body: 'Thanks for joining R.I.A. Your account is ready, explore search, tasks and notifications from the bottom bar anytime.', time: '8:27 AM', read: false, pinned: true, sub: true },
    { id: 2, av: 'Logo.jpg', name: 'Developer', subj: 'New feature: Search is live', body: 'The new search page is now available. You can look up students and features faster, and more filters are coming soon.', time: '8:10 AM', read: false, imp: true, from: 'developer', upd: true, pinned: true },
    { id: 3, av: 'Logo.jpg', name: 'Teacher', subj: 'Assignment reminder', body: 'Please remember to submit your assignment before the deadline. Late submissions will not be accepted without a reason.', time: '7:45 AM', read: true, imp: true, from: 'teacher' },
    { id: 4, av: 'Logo.jpg', name: 'Developer', subj: 'Maintenance every weekend', body: 'R.I.A will be offline for a short maintenance window every weekend. Your data will stay safe and nothing will be lost.', time: 'Yesterday', read: true, imp: true, from: 'developer', upd: true },
    { id: 5, av: 'Logo.jpg', name: 'Super AI Updates', subj: 'Version 2.1 release notes', body: 'Version 2.1 brings faster loading, a new inbox, smoother animations and a bunch of small bug fixes.', time: 'Yesterday', read: true, upd: true, sub: true },
    { id: 6, av: 'Logo.jpg', name: 'Teacher', subj: 'Quiz results are posted', body: 'Your quiz results are now posted. Check the Tasks page to see your score and the comments from your teacher.', time: '6:30 AM', read: false, imp: true, from: 'teacher', pinned: true },
    { id: 7, av: 'Logo.jpg', name: 'Old Announcements', subj: 'Last semester schedule', body: 'This is the schedule from last semester, kept here for reference only.', time: 'Mon', read: true, arch: true },
    { id: 8, av: 'Logo.jpg', name: 'Unknown Sender', subj: 'You won a free prize!!!', body: 'Click this link now to claim your free prize. This looks suspicious, so it was moved to spam.', time: 'Sun', read: false, spam: true },
    { id: 9, av: 'Logo.jpg', name: 'Archived Notice', subj: 'Holiday break reminder', body: 'Classes will resume after the holiday break. Enjoy your time off!', time: 'Fri', read: true, arch: true }
  ];
  const live = m => !m.arch && !m.spam;
  const CATS = {
    all:   { title: 'All Messages', f: live },
    read:  { title: 'Read & Unread', f: live, subs: [['Read', m => m.read], ['Unread', m => !m.read]] },
    imp:   { title: 'Important', f: m => m.imp, subs: [['From the developer', m => m.from === 'developer'], ['From the teacher', m => m.from === 'teacher']] },
    pin:   { title: 'Pinned', f: m => m.pinned },
    sub:   { title: 'Subscriptions', f: m => m.sub },
    arch:  { title: 'Archived', f: m => m.arch },
    upd:   { title: 'Updates', f: m => m.upd },
    spam:  { title: 'Spam', f: m => m.spam }
  };
  const ORDER = [['all', 'All Messages'], ['read', 'Read & Unread'], ['imp', 'Important'], ['pin', 'Pinned'], ['sub', 'Subscriptions'], ['arch', 'Archived'], ['upd', 'Updates'], ['spam', 'Spam']];
  const SETTINGS = ['Search & Filtering', 'Clear Inbox Data', 'Storage & Data', 'Deep Files', 'Privacy & Security', 'Language & Region', 'Events', 'Advanced'];

  let cat = 'all', sub = 0;
  try { const r = JSON.parse(localStorage.getItem('ria_inbox_read') || '[]'); DATA.forEach(m => { if (r.includes(m.id)) m.read = true; }); } catch (e) {}
  const saveRead = () => { try { localStorage.setItem('ria_inbox_read', JSON.stringify(DATA.filter(m => m.read).map(m => m.id))); } catch (e) {} };
  const replay = el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; };

  /* ----- Menu ----- */
  $('menuItems').innerHTML = ORDER.map(([k, l], i) => `<button class="mitem${k === cat ? ' active' : ''}" data-cat="${k}" style="--i:${i}"><span>${l}</span>${CHEV}</button>`).join('');
  $('menuItems').addEventListener('click', e => {
    const b = e.target.closest('.mitem'); if (!b) return;
    cat = b.dataset.cat; sub = 0;
    document.querySelectorAll('.mitem[data-cat]').forEach(x => x.classList.toggle('active', x === b));
    render(true);
  });
  // size menu rows to whole pixels so every divider renders the same weight
  function fitMenu() {
    const m = $('menu'), items = [...m.querySelectorAll('#menuItems .mitem')];
    const avail = m.clientHeight - m.querySelector('.menu-head').offsetHeight - $('closeMenu').offsetHeight;
    if (avail <= 0 || !items.length) return;
    const h = Math.floor(avail / items.length), rest = avail - h * items.length;
    items.forEach((b, i) => { b.style.flex = 'none'; b.style.height = (h + (i === items.length - 1 ? rest : 0)) + 'px'; });
  }
  fitMenu(); window.addEventListener('resize', fitMenu);
  window.fitInboxMenu = fitMenu;
  $('closeMenu').addEventListener('click', () => $('menu').classList.add('closed'));
  const box = $('menu').parentElement;
  function exitReading() {
    if (!box.classList.contains('reading')) return false;
    box.classList.remove('reading');
    document.querySelectorAll('#list .row.reading-row').forEach(r => r.classList.remove('open', 'reading-row'));
    $('list').scrollTop = 0;
    return true;
  }
  $('openMenu').addEventListener('click', () => { exitReading(); $('menu').classList.remove('closed'); });

  /* ----- Render list ----- */
  function render(head) {
    const c = CATS[cat];
    $('ctitle').textContent = c.title;
    if (head) replay($('chead'));
    const st = $('subtabs');
    if (c.subs) {
      st.hidden = false;
      st.innerHTML = c.subs.map((s, i) => `<button class="sub${i === sub ? ' active' : ''}" data-i="${i}">${s[0]}</button>`).join('');
      if (head) replay(st);
    } else st.hidden = true;
    let items = DATA.filter(c.f);
    if (c.subs) items = items.filter(c.subs[sub][1]);
    $('list').innerHTML = items.length ? items.map((m, i) => `
      <article class="row${m.read ? '' : ' unread'}" data-id="${m.id}" style="--i:${i}">
        <span class="avatar"><img src="${m.av}" data-i="${m.name[0]}" alt=""></span>
        <div class="rtext">
          <div class="rtop"><h3>${m.name}</h3><time>${m.time}</time>${CHEV}</div>
          <div class="subj">${m.subj}</div>
          <div class="body">${m.body}</div>
          <div class="full"><div>${m.body}</div></div>
        </div>
      </article>`).join('') : '<p class="iempty">No messages here.</p>';
    const band = $('band');
    band.hidden = !c.subs;
    if (c.subs) { band.textContent = items.length + (items.length === 1 ? ' message' : ' messages'); replay(band); }
    $('list').scrollTop = 0;
  }
  $('subtabs').addEventListener('click', e => {
    const b = e.target.closest('.sub'); if (!b) return;
    sub = +b.dataset.i; render(false);
  });
  $('list').addEventListener('click', e => {
    const r = e.target.closest('.row'); if (!r) return;
    if (box.classList.contains('reading')) return;
    $('menu').classList.add('closed');
    box.classList.add('reading');
    r.classList.add('open', 'reading-row');
    $('list').scrollTop = 0;
    const m = DATA.find(x => x.id === +r.dataset.id);
    if (m && !m.read) { m.read = true; r.classList.remove('unread'); saveRead(); }
  });
  // If a profile picture file is missing, show the sender's initial instead
  $('list').addEventListener('error', e => {
    if (e.target.tagName === 'IMG') e.target.replaceWith(document.createTextNode(e.target.dataset.i));
  }, true);
  render(false);

  /* ----- Developer messages show the Developer's profile picture from Firebase (instead of the logo) ----- */
  // Only this Developer (by Developer ID) is connected to the Inbox; other Developers are ignored.
  const INBOX_DEVELOPER_ID = '988363929474';
  const DEV_PHOTO_KEY = 'ria_dev_photo_' + INBOX_DEVELOPER_ID;
  try { sessionStorage.removeItem('ria_dev_photo'); } catch (e) {}   // older cache (could hold another Developer's picture)
  function applyDevPhoto(photo) {
    DATA.forEach(m => { if (m.from === 'developer') m.av = photo; });
    $('list').querySelectorAll('.row').forEach(r => {
      const m = DATA.find(x => x.id === +r.dataset.id);
      const img = r.querySelector('.avatar img');
      if (m && m.from === 'developer' && img) img.src = photo;
    });
  }
  function useDevPhoto(photo) {
    if (!photo) return;
    const probe = new Image();                 // only switch if the picture really loads
    probe.onload = () => applyDevPhoto(photo);
    probe.src = photo;
  }
  try { useDevPhoto(sessionStorage.getItem(DEV_PHOTO_KEY)); } catch (e) {}   // instant on later visits
  if (typeof firebase !== 'undefined' && typeof getDeveloperProfile === 'function') {
    getDeveloperProfile(INBOX_DEVELOPER_ID).then(p => {
      if (!p) { try { sessionStorage.removeItem(DEV_PHOTO_KEY); } catch (e) {} return; }
      try { if (p.photo) sessionStorage.setItem(DEV_PHOTO_KEY, p.photo); else sessionStorage.removeItem(DEV_PHOTO_KEY); } catch (e) {}
      useDevPhoto(p.photo);
    }).catch(e => console.warn('Developer photo:', e));
  }

  /* ----- Settings sidebar (opens when the gear is tapped) ----- */
  $('slist').innerHTML = SETTINGS.map((s, i) => `<button class="sitem" style="--i:${i}"><span>${s}</span>${CHEV}</button>`).join('');
  const setOpen = o => { $('settings').classList.toggle('open', o); $('backdrop').classList.toggle('open', o); $('gearBtn').classList.toggle('on', o); };
  $('gearBtn').addEventListener('click', () => setOpen(true));
  $('backdrop').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('settings').classList.contains('open')) setOpen(false); else if (isOpen) { if (!exitReading()) closeInbox(); else $('menu').classList.remove('closed'); } } });

  /* ----- Modal open/close (slides from deep left to center) ----- */
  const modal = $('inboxModal');
  let isOpen = false;
  // Tab switching is ONE rule for all three tabs: the panel you open ALWAYS slides in from the left at the same
  // speed, and the panel you leave (or Notifications) ALWAYS switches instantly, so nothing overlaps or waits.
  // snap() turns the transitions off, applies the change, and turns them back on after the browser painted.
  function snap(m, fn) {
    m.classList.add('instant');
    fn();
    void m.offsetWidth;
    const t = m._snap = (m._snap || 0) + 1;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (m._snap === t) m.classList.remove('instant'); }));
  }
  window.RIA_snap = snap;
  // slide a panel in: cancel any pending snap, then add .open on a later frame so the transition really plays
  function slideIn(m, stillWanted) {
    m._snap = (m._snap || 0) + 1;
    m.classList.remove('instant');
    void m.offsetWidth;
    requestAnimationFrame(() => { if (stillWanted()) m.classList.add('open'); });
  }
  window.RIA_slideIn = slideIn;
  function openInbox() {
    isOpen = true;
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('inbox-open');
    const nv = document.querySelector('.bottom-nav'); if (nv) nv.classList.remove('nav-hidden');
    $('list').scrollTop = 0;
    fitMenu();
    slideIn(modal, () => isOpen);
  }
  function closeInbox() {
    isOpen = false; setOpen(false); exitReading(); $('menu').classList.remove('closed');
    snap(modal, () => modal.classList.remove('open'));
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('inbox-open');
  }
  window.RIA_inbox = { open: openInbox, close: closeInbox };
  // block touch/wheel scrolling anywhere except inside the message list
  const canScroll = t => { const l = t.closest && t.closest('.list'); return l && l.scrollHeight > l.clientHeight; };
  modal.addEventListener('touchmove', e => { if (!canScroll(e.target)) e.preventDefault(); }, { passive: false });
  modal.addEventListener('wheel', e => { if (!canScroll(e.target)) e.preventDefault(); }, { passive: false });
  modal.querySelectorAll('.itab[data-go]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.go === 'updates') { window.RIA_updates.open(); return; }   // closes the inbox and opens Updates in the same frame
    closeInbox();
  }));
  const bell = document.querySelector('.bottom-nav .nav-item.active');
  if (bell) bell.addEventListener('click', closeInbox);

  /* ----- Online status (the time itself is shared with the main counter) ----- */
  const status = () => { const on = navigator.onLine; $('inStatusDot').classList.toggle('off', !on); $('inStatusText').textContent = on ? 'Online' : 'Offline'; };
  status();
  window.addEventListener('online', status); window.addEventListener('offline', status);
})();

(function () {
  const $ = id => document.getElementById(id);
  const CHEV = '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>';

  /* Each update has its own profile picture (jpg / png). Put these files next to this page. */
  const UPDATES = [
    { img: 'SuperAI.jpg',    name: 'Super AI',    subj: 'System functions update',          body: 'Super AI powers the core functions of the system. This update improves speed, stability and how the main features work together.', time: '8:10 PM', unread: true },
    { img: 'ExoAI.jpg',      name: 'Exo AI',      subj: 'AI assistant for students and teachers', body: 'Exo AI is the AI assistant for both students and teachers. It helps with questions, lessons, tasks and everyday school needs.', time: '8:10 PM', unread: true },
    { img: 'PendulumOs.png', name: 'Pendulum OS', subj: 'Operating system update',          body: 'Pendulum OS is the operating system behind R.I.A. This update improves performance, smoothness and overall system management.', time: '8:10 PM', unread: false },
    { img: 'CryleAI.jpg',    name: 'Cryle AI',    subj: 'Animations and gaming-style features', body: 'Cryle AI handles the animations and other gaming-style functions, making the app feel more lively, fast and fun to use.', time: '8:10 PM', unread: false }
  ];

  /* Read state is saved permanently: once an update is opened, its red dot never comes back. */
  const READ_KEY = 'ria_updates_read';
  const uid = u => u.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  function loadRead() {
    const ids = new Set();
    try { JSON.parse(localStorage.getItem(READ_KEY) || '[]').forEach(x => ids.add(x)); } catch (e) {}
    try { const m = document.cookie.match(/(?:^|;\s*)ria_updates_read=([^;]*)/); if (m && m[1]) decodeURIComponent(m[1]).split(',').forEach(x => x && ids.add(x)); } catch (e) {}
    return ids;
  }
  function saveRead(ids) {
    const arr = [...ids];
    try { localStorage.setItem(READ_KEY, JSON.stringify(arr)); } catch (e) {}
    try { document.cookie = 'ria_updates_read=' + encodeURIComponent(arr.join(',')) + '; max-age=31536000; path=/; SameSite=Lax'; } catch (e) {}
  }
  const readIds = loadRead();
  UPDATES.forEach(u => { u.id = uid(u); if (readIds.has(u.id)) u.unread = false; });

  const list = $('uList');
  list.innerHTML = UPDATES.map((u, i) => `
    <article class="row${u.unread ? ' unread' : ''}" data-uid="${u.id}" style="--i:${i + 4}">
      <span class="avatar"><img src="${u.img}" data-i="${u.name.replace('R.I.A ', '')[0]}" alt=""></span>
      <div class="rtext">
        <div class="rtop"><h3>${u.name}</h3><time>${u.time}</time>${CHEV}</div>
        <div class="subj">${u.subj}</div>
        <div class="body">${u.body}</div>
        <div class="full"><div>${u.body}</div></div>
      </div>
    </article>`).join('');

  // tap a row (or its arrow) to open it in full view inside the box
  const card = document.querySelector('.ucard');
  function exitReading() {
    if (!card.classList.contains('reading')) return false;
    card.classList.remove('reading');
    list.querySelectorAll('.row.reading-row').forEach(r => r.classList.remove('open', 'reading-row'));
    list.scrollTop = 0;
    return true;
  }
  list.addEventListener('click', e => {
    const r = e.target.closest('.row'); if (!r) return;
    if (card.classList.contains('reading')) return;
    card.classList.add('reading');
    r.classList.add('open', 'reading-row');
    r.classList.remove('unread');
    if (r.dataset.uid && !readIds.has(r.dataset.uid)) { readIds.add(r.dataset.uid); saveRead(readIds); }
    list.scrollTop = 0;
  });
  $('uBack').addEventListener('click', exitReading);
  // missing picture -> show the first letter instead
  list.addEventListener('error', e => {
    if (e.target.tagName === 'IMG') e.target.replaceWith(document.createTextNode(e.target.dataset.i));
  }, true);

  /* ----- User ID beside R.I.A: the User ID of the account that logged in ----- */
  // The login saves the account in this tab as sessionStorage "passkeyUser" ({ userId, ... }) and the
  // logout removes it (same place the home page reads it). Nobody logged in = nothing is shown.
  try { localStorage.removeItem('ria_user_id'); } catch (e) {}   // placeholder made by an earlier version
  function loginUserId() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('passkeyUser')); } catch (e) {}
    return saved && saved.userId ? String(saved.userId).toUpperCase() : '';
  }
  const uidEl = $('userId');
  function showUserId(id) {
    if (!uidEl) return;
    uidEl.hidden = !id;
    uidEl.textContent = id;
    uidEl.title = id ? 'User ID: ' + id : '';
  }
  showUserId(loginUserId());
  // confirm it with Firebase like the home page does: an account that isn't in Firebase isn't shown
  try {
    const idNow = loginUserId();
    if (idNow && typeof firebase !== 'undefined' && typeof accountsRef !== 'undefined') {
      accountsRef.doc(idNow).get().then(snap => { if (!snap.exists) showUserId(''); }).catch(() => {});
    }
  } catch (e) {}

  /* ----- open / close ----- */
  const modal = $('updModal');
  let isOpen = false;
  function openUpd() {
    if (window.RIA_inbox) window.RIA_inbox.close();
    isOpen = true;
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('inbox-open');
    const nv = document.querySelector('.bottom-nav'); if (nv) nv.classList.remove('nav-hidden');
    list.scrollTop = 0;
    window.RIA_slideIn(modal, () => isOpen);
  }
  function closeUpd() {
    if (!isOpen) return;
    isOpen = false;
    hideNotice();
    exitReading();
    window.RIA_snap(modal, () => modal.classList.remove('open'));
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('inbox-open');
  }
  window.RIA_updates = { open: openUpd, close: closeUpd };

  // opening the inbox closes this panel first
  if (window.RIA_inbox) {
    const origOpen = window.RIA_inbox.open;
    window.RIA_inbox.open = function () { closeUpd(); origOpen(); };
  }

  modal.querySelectorAll('.itab[data-ugo]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.ugo === 'inbox') { window.RIA_inbox.open(); return; }
    closeUpd();
  }));
  const bell = document.querySelector('.bottom-nav .nav-item.active');
  if (bell) bell.addEventListener('click', () => closeUpd());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen && !exitReading()) closeUpd(); });

  // block scrolling anywhere except inside the update list
  const canScroll = t => { const l = t.closest && t.closest('.ulist'); return l && l.scrollHeight > l.clientHeight; };
  modal.addEventListener('touchmove', e => { if (!canScroll(e.target)) e.preventDefault(); }, { passive: false });
  modal.addEventListener('wheel', e => { if (!canScroll(e.target)) e.preventDefault(); }, { passive: false });

  /* ----- "No version available right now" notice ----- */
  // Set to true when a new version is released; Auto Update then opens the update page.
  const NEW_VERSION_AVAILABLE = false;
  const NOTICE_MS = 7000;

  const notice = document.createElement('div');
  notice.className = 'vnotice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.setAttribute('aria-hidden', 'true');
  notice.innerHTML = '<div class="vnotice-card"><p>No version available right now</p></div>';
  document.body.appendChild(notice);

  let noticeTimer = null;
  function hideNotice() {
    clearTimeout(noticeTimer);
    notice.classList.remove('show');
    notice.setAttribute('aria-hidden', 'true');
  }
  function showNotice() {
    clearTimeout(noticeTimer);
    notice.setAttribute('aria-hidden', 'false');
    void notice.offsetWidth;
    notice.classList.add('show');
    noticeTimer = setTimeout(hideNotice, NOTICE_MS);   // closes by itself after 7 seconds
  }
  notice.addEventListener('click', hideNotice);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && notice.classList.contains('show')) { hideNotice(); e.stopImmediatePropagation(); }
  }, true);

  /* ----- Check for updates: spinner, then open the page, or the notice if it isn't there ----- */
  const btn = $('checkBtn');
  const btnLabel = btn.querySelector('span:last-child');
  const btnText = btnLabel.textContent;
  const auto = document.querySelector('.uauto');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let busy = false;

  function resetChecking() {
    busy = false;
    btn.classList.remove('checking');
    btnLabel.textContent = btnText;
    auto.classList.remove('syncing');
  }

  async function pageExists(url) {
    // Browsers can't look at local files (file://), so there we just open it.
    if (window.location.protocol === 'file:') return true;
    try {
      let r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (r.status === 405 || r.status === 501) r = await fetch(url, { cache: 'no-store' });
      return r.ok;
    } catch (e) { return false; }
  }

  btn.addEventListener('click', async e => {
    e.preventDefault();
    if (busy || !navigator.onLine) return;
    busy = true; hideNotice();
    btn.classList.add('checking');
    btnLabel.textContent = 'Checking...';
    const href = btn.getAttribute('href');
    const [ok] = await Promise.all([pageExists(href), wait(800)]);
    if (ok) { window.location.href = href; return; }
    resetChecking();
    showNotice();
  });

  /* ----- Auto Update: tap it to look for a new version ----- */
  auto.setAttribute('role', 'button');
  auto.setAttribute('tabindex', '0');
  async function autoUpdate() {
    if (busy || !navigator.onLine) return;
    busy = true; hideNotice();
    auto.classList.add('syncing');
    await wait(1200);
    if (NEW_VERSION_AVAILABLE) { window.location.href = btn.getAttribute('href'); return; }
    resetChecking();
    showNotice();
  }
  auto.addEventListener('click', autoUpdate);
  auto.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); autoUpdate(); } });

  // coming back with the browser's Back button: don't stay stuck on "Checking..."
  window.addEventListener('pageshow', e => { if (e.persisted) resetChecking(); });

  /* ----- keep the clock + online status in step with the main page ----- */
  const mainTime = $('activeTime');
  setInterval(() => { $('upActiveTime').textContent = mainTime.textContent; }, 1000);
  const status = () => { const on = navigator.onLine; $('upStatusDot').classList.toggle('off', !on); $('upStatusText').textContent = on ? 'Online' : 'Offline'; };
  status();
  window.addEventListener('online', status); window.addEventListener('offline', status);
})();

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