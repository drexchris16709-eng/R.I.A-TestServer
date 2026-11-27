// How long each step shows (milliseconds)
const WAIT_MODAL_MS = 7000;  // "Wait up to ..." modal
const LOADING_MS = 2500;     // loading popup, then the page refreshes

const BACK_REDIRECT_URL = 'index.html';

const form = document.getElementById('resetForm');
const fields = ['userId', 'oldPass', 'newPass'].map(id => document.getElementById(id));
const formError = document.getElementById('formError');
const enterBtn = document.getElementById('enterBtn');
const waitModal = document.getElementById('waitModal');
const loadingModal = document.getElementById('loadingModal');
const DEFAULT_ERROR = formError.textContent;

// The wait message follows PASSWORD_RESET_DELAY_MS from accounts-db.js
const PENDING_RESET_KEY = 'ria_pending_reset';
const waitText = document.getElementById('waitText');
let mode = 'password';          // 'password' | 'pin'
function updateWaitText() {
  if (!waitText) return;
  const secs = Math.round(PASSWORD_RESET_DELAY_MS / 1000);
  const label = secs >= 60
    ? Math.round(secs / 60) + ' minute' + (Math.round(secs / 60) === 1 ? '' : 's')
    : secs + ' second' + (secs === 1 ? '' : 's');
  waitText.textContent = 'Wait up to ' + label + ' to save your new ' + (mode === 'pin' ? '12 PIN' : 'password');
}
updateWaitText();
let busy = false;

function showError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

// Eye indicator: show / hide password
document.querySelectorAll('.eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');

    btn.classList.remove('blink');
    void btn.offsetWidth;
    btn.classList.add('blink');
  });
  btn.addEventListener('animationend', () => btn.classList.remove('blink'));
});

// ---------- 12 PIN changer ----------
const pinToggle = document.getElementById('pinToggle');
const pageTitle = document.getElementById('pageTitle');
const labelEls = fields.map(f => document.querySelector('label[for="' + f.id + '"]'));
const MODE_TEXT = {
  password: {
    title: pageTitle.textContent,
    labels: labelEls.map(l => l.textContent),
    placeholders: fields.map(f => f.placeholder)
  },
  pin: {
    title: 'Forgot 12 PIN',
    labels: ['Developer ID or Handlers ID:', 'Old 12 PIN:', 'New 12 PIN:'],
    placeholders: ['Type your Developer or Handlers ID here...', 'Type your Old 12 PIN here...', 'Type your New 12 PIN here...']
  }
};

function setMode(next) {
  mode = next;
  const t = MODE_TEXT[mode];
  pageTitle.textContent = t.title;
  labelEls.forEach((l, i) => { l.textContent = t.labels[i]; });
  fields.forEach((f, i) => {
    f.placeholder = t.placeholders[i];
    f.value = '';
    f.classList.remove('invalid');
    if (mode === 'pin') { f.setAttribute('inputmode', 'numeric'); f.maxLength = 12; }
    else { f.removeAttribute('inputmode'); f.removeAttribute('maxlength'); }
  });
  fields[0].autocomplete = mode === 'pin' ? 'off' : 'username';
  // hide the passwords again
  document.querySelectorAll('.eye').forEach(btn => {
    document.getElementById(btn.dataset.target).type = 'password';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show password');
  });
  formError.textContent = DEFAULT_ERROR;
  formError.hidden = true;
  pinToggle.setAttribute('aria-pressed', String(mode === 'pin'));
  pinToggle.setAttribute('aria-label', mode === 'pin' ? 'Back to password changer' : 'Switch to 12 PIN changer');
  updateWaitText();
}

pinToggle.addEventListener('click', () => {
  if (busy) return;
  setMode(mode === 'pin' ? 'password' : 'pin');
});

// 12 PIN mode: digits only
fields.forEach(f => f.addEventListener('input', () => {
  if (mode !== 'pin') return;
  const clean = f.value.replace(/\D/g, '').slice(0, 12);
  if (clean !== f.value) f.value = clean;
}));

// Clear the error as the user types
fields.forEach(f => f.addEventListener('input', () => {
  f.classList.remove('invalid');
  if (fields.every(x => x.value.trim())) formError.hidden = true;
}));

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (busy) return;

  const empty = fields.filter(f => !f.value.trim());
  fields.forEach(f => {
    f.classList.remove('invalid');
    if (!f.value.trim()) {
      void f.offsetWidth;
      f.classList.add('invalid');
    }
  });
  if (empty.length) {
    showError(DEFAULT_ERROR);
    empty[0].focus();
    return;
  }

  // 12 PIN mode: every field is exactly 12 digits
  if (mode === 'pin') {
    const bad = fields.filter(f => !/^[0-9]{12}$/.test(f.value.trim()));
    if (bad.length) {
      bad.forEach(f => { void f.offsetWidth; f.classList.add('invalid'); });
      showError('Developer / Handlers ID, Old PIN and New PIN must each be 12 digits.');
      bad[0].focus();
      return;
    }
  }

  busy = true;
  enterBtn.disabled = true;
  formError.hidden = true;

  // Check with Firebase and save the pending request
  let result;
  try {
    result = mode === 'pin'
      ? await requestPinReset(fields[0].value, fields[1].value, fields[2].value)
      : await requestPasswordReset(fields[0].value, fields[1].value, fields[2].value);
  } catch (err) {
    console.error('Reset error:', err);
    showError('Error: ' + (err.code || err.message || 'unknown'));
    busy = false;
    enterBtn.disabled = false;
    return;
  }

  if (!result.ok) {
    const isPin = mode === 'pin';
    if (result.reason === 'same') {
      showError(isPin ? 'New PIN must be different from the old one.' : 'New password must be different from the old one.');
      fields[2].classList.add('invalid');
      fields[2].focus();
    } else if (result.reason === 'taken') {
      showError('That PIN can\'t be used. Choose another 12-digit PIN.');
      fields[2].classList.add('invalid');
      fields[2].focus();
    } else {
      showError(isPin ? 'Developer / Handlers ID or old PIN is incorrect.' : 'User ID or old password is incorrect.');
      fields[0].classList.add('invalid');
      fields[1].classList.add('invalid');
      fields[0].focus();
    }
    busy = false;
    enterBtn.disabled = false;
    return;
  }

  // remember the request so the new password is applied when the delay is over
  try { localStorage.setItem(PENDING_RESET_KEY, result.userId || fields[0].value.trim().toUpperCase()); } catch (e) {}

  // 1) wait modal for 7 seconds
  waitModal.style.setProperty('--wait', WAIT_MODAL_MS + 'ms');
  waitModal.classList.add('open');

  setTimeout(() => {
    // 2) loading popup, then refresh
    waitModal.classList.remove('open');
    loadingModal.classList.add('open');

    setTimeout(() => {
      form.reset();
      window.location.reload();
    }, LOADING_MS);
  }, WAIT_MODAL_MS);
});

document.getElementById('backBtn').addEventListener('click', () => {
  if (BACK_REDIRECT_URL) window.location.href = "../UserInteraction/UserI.html";
  else history.back();
});

// Applies the new password (and removes the old one) once the delay is over,
// as long as this page is open. Login pages can also call applyDuePasswordReset(userId).
async function checkPendingReset() {
  let id = null;
  try { id = localStorage.getItem(PENDING_RESET_KEY); } catch (e) {}
  if (!id) return;
  try {
    const res = await applyDuePasswordReset(id);
    if (res.applied || res.reason === 'none' || res.reason === 'done') {
      try { localStorage.removeItem(PENDING_RESET_KEY); } catch (e) {}
    }
  } catch (err) {
    console.error('Could not apply the password change yet:', err);
  }
}
checkPendingReset();
setInterval(checkPendingReset, 1000);