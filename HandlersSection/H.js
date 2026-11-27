// Page to open when "Back to main" / Back is clicked.
const BACK_PAGE = '../UserInteraction/UserI.html';

// Order of the buttons in "Change User".
// "ALL" shows every user at once; it is the default view (it has no button in Change User).
const ALL = "ALL";
const TYPES = ["Student", "Teacher", "Handlers", "Developers", "Test Account", "Super Account"];
const typeLabel = t => (t === ALL ? "All Users" : t);

// What each account type shows on its card, top to bottom.
// [label, field saved in Firebase]. The User Name always goes on top and, for the types
// that have one, the LRN / Contact No goes right under it (head: true).
const LAYOUTS = {
  "Student": { head: true, rows: [
    ["Position", "type"], ["Role", "role"], ["Password", "password"], ["School", "school"],
    ["Gr & Sec", "gradeSection"], ["Date", "date"], ["User ID", "userId"], ["Passkey", "passkey"],
    ["Adviser", "adviser"]
  ]},
  "Teacher": { head: true, rows: [
    ["Position", "type"], ["Role", "role"], ["Password", "password"], ["School", "school"],
    ["Gr & Sec", "gradeSection"], ["Date", "date"], ["User ID", "userId"], ["Passkey", "passkey"],
    ["Depart", "department"]
  ]},
  "Test Account": { head: true, rows: [
    ["Handlers ID", "linkedHandlersId"], ["Password", "password"], ["Purpose", "purpose"],
    ["School", "school"], ["Position", "type"], ["Role", "role"], ["User ID", "userId"],
    ["SSID", "ssid"], ["Test Account ID", "testAccountId"]
  ]},
  "Super Account": { head: true, rows: [
    ["Handlers ID", "linkedHandlersId"], ["Password", "password"], ["Purpose", "purpose"],
    ["Developer ID", "linkedDeveloperId"], ["Position", "type"], ["Role", "role"],
    ["User ID", "userId"], ["SSID", "ssid"], ["Super Account ID", "superAccountId"]
  ]},
  "Handlers": { head: false, rows: [
    ["Developer ID", "linkedDeveloperId"], ["Purpose", "purpose"], ["Age", "age"],
    ["School", "school"], ["Position", "type"], ["Role", "role"], ["SSID", "ssid"],
    ["Super Account ID", "superAccountId"]
  ]},
  "Developers": { head: false, rows: [
    ["Position", "type"], ["Role", "role"], ["Developer Industry", "industry"],
    ["Country", "country"], ["Age", "age"], ["Purpose", "purpose"], ["SSID", "ssid"],
    ["Super Account ID", "superAccountId"]
  ]}
};

// "Your infos" in the menu. "@pin" is the 12-digit PIN (shown hidden except the last 4 digits).
const INFO_ROWS = {
  "Handlers": [
    ["Account", "type"], ["12 Pin", "@pin"], ["Age", "age"], ["Super Account ID", "superAccountId"],
    ["Purpose", "purpose"], ["School", "school"]
  ],
  "Developers": [
    ["Account", "type"], ["12 Pin", "@pin"], ["Age", "age"], ["Super Account ID", "superAccountId"],
    ["Purpose", "purpose"], ["Industry", "industry"], ["Country", "country"]
  ]
};

const AVATAR_SVG = `
<svg class="avatar" viewBox="0 0 40 48" fill="#fff" aria-hidden="true">
  <circle cx="20" cy="12" r="12"/>
  <path d="M0 48V35a5 5 0 0 1 5-5h30a5 5 0 0 1 5 5v13z"/>
</svg>`;

// Everything below comes from user input, so it is escaped before going into innerHTML.
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

function show(value) {
  return value === undefined || value === null || String(value) === "" ? "—" : String(value);
}

// Only small image data URLs made by this page are accepted as a profile photo.
function safePhoto(src) {
  return typeof src === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src) ? src : "";
}

// ---------- State ----------
let session = null;          // { userId, kind, pin, account } of the person who unlocked the page
let accounts = [];           // every account, live from Firebase
let stopListening = null;
let currentType = ALL;
let loaded = false;

// ---------- Cards ----------
function renderCard(a) {
  const layout = LAYOUTS[a.type];
  if (!layout) return "";

  const photo = safePhoto(a.profilePhoto);
  const avatar = photo
    ? `<img class="avatar-img" src="${photo}" alt="">`
    : AVATAR_SVG;

  const bannerSrc = safePhoto(a.bannerPhoto);
  const banner = bannerSrc ? `<img class="card-banner-img" src="${bannerSrc}" alt="">` : "";

  const head = layout.head
    ? `<p class="card-lrn">${esc(a.idLabel || "LRN")}: ${esc(show(a.idValue))}</p>`
    : "";

  const rows = layout.rows
    .map(([label, key]) => `<li><span class="k">${esc(label)}:</span> ${esc(show(a[key]))}</li>`)
    .join("");

  return `
    <article class="card">
      <div class="card-banner">${banner}</div>
      <div class="card-head">
        <div class="card-avatar">${avatar}</div>
        <p class="card-name">${esc(a.username || a.name)}</p>
        ${head}
      </div>
      <ul class="card-fields" style="--rows:${Math.ceil(layout.rows.length / 2)}">${rows}</ul>
    </article>`;
}

const list = document.getElementById("cardList");

function renderCards() {
  if (!loaded) {
    list.innerHTML = `<p class="empty">Loading accounts...</p>`;
    return;
  }
  const items = currentType === ALL
    ? accounts.filter(a => LAYOUTS[a.type])
    : accounts.filter(a => a.type === currentType);
  list.innerHTML = items.length
    ? items.map(renderCard).join("")
    : `<p class="empty">${currentType === ALL ? "No accounts yet." : `No ${esc(currentType)} accounts yet.`}</p>`;
}

// Older accounts made before Passkeys existed get theirs once.
const fixedPasskeys = new Set();
function ensurePasskeys(all) {
  all.forEach(a => {
    if (a.passkey || !a.userId || fixedPasskeys.has(a.userId)) return;
    fixedPasskeys.add(a.userId);
    accountsRef.doc(a.userId).update({ passkey: generatePasskey() })
      .catch(() => fixedPasskeys.delete(a.userId));
  });
}

function startListening() {
  loaded = false;
  renderCards();
  stopListening = listenAccounts(all => {
    accounts = all;
    loaded = true;
    ensurePasskeys(all);
    renderCards();
    renderDrawer();
  }, err => {
    console.error(err);
    list.innerHTML = `<p class="empty">Could not load accounts. Check your connection and reload.</p>`;
  });
}

// ---------- Menu (drawer) ----------
const drawer = document.getElementById("drawer");
const menuBtn = document.getElementById("menuBtn");
const scrim = document.getElementById("scrim");
const popup = document.getElementById("typePopup");
const typeList = document.getElementById("typeList");
const changeUserBtn = document.getElementById("changeUserBtn");
const photoNote = document.getElementById("photoNote");
const pageParts = [document.querySelector(".topbar"), document.getElementById("cardList")];
drawer.tabIndex = -1;

// The logged-in account (live copy from Firebase when available).
function myAccount() {
  return accounts.find(a => a.userId === session.userId) || session.account;
}
// "Your ID": Handlers ID for Handlers accounts, Developer ID for Developers accounts.
function myId() {
  const me = myAccount();
  return String(me[me.type === "Handlers" ? "handlersId" : "developerId"] || "");
}

function maskPin(pin) {
  return "•••• •••• " + pin.slice(-4);
}
function groupPin(pin) {
  return pin.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function renderDrawer() {
  if (!session) return;
  const me = myAccount();

  document.getElementById("meName").textContent = me.username || "User Name";
  document.getElementById("meSsid").textContent = "SSID: " + show(me.ssid);

  const img = document.getElementById("mePhoto");
  const def = document.getElementById("mePhotoDefault");
  const photo = safePhoto(me.profilePhoto);
  // <svg> has no .hidden property, so the attribute is set directly (the default avatar disappears once a photo exists)
  if (photo) { img.src = photo; img.hidden = false; def.setAttribute("hidden", ""); }
  else { img.removeAttribute("src"); img.hidden = true; def.removeAttribute("hidden"); }

  const banner = document.getElementById("meBanner");
  const bannerDef = document.getElementById("meBannerDefault");
  const bannerSrc = safePhoto(me.bannerPhoto);
  if (bannerSrc) { banner.src = bannerSrc; banner.hidden = false; bannerDef.hidden = true; }
  else { banner.removeAttribute("src"); banner.hidden = true; bannerDef.hidden = false; }

  const rows = INFO_ROWS[me.type] || INFO_ROWS["Handlers"];
  document.getElementById("meInfos").innerHTML = rows.map(([label, key]) => {
    const value = key === "@pin" ? maskPin(String(me.password || session.pin)) : show(me[key]);
    return `<li><span class="k">${esc(label)}:</span> ${esc(value)}</li>`;
  }).join("");

  document.getElementById("idKind").textContent = session.kind;
  document.getElementById("idValue").textContent = myId() ? groupPin(myId()) : "—";
}

function openMenu() {
  if (!session) return;
  renderDrawer();
  document.body.classList.add("menu-open");
  drawer.removeAttribute("inert");
  pageParts.forEach(el => (el.inert = true));   // keyboard / screen reader can't wander behind the menu
  menuBtn.setAttribute("aria-expanded", "true");
  drawer.focus({ preventScroll: true });
}

function closeMenu() {
  const wasOpen = document.body.classList.contains("menu-open");
  closePopup();
  document.body.classList.remove("menu-open");
  drawer.setAttribute("inert", "");
  pageParts.forEach(el => (el.inert = false));
  menuBtn.setAttribute("aria-expanded", "false");
  photoNote.textContent = "";
  if (wasOpen && session) menuBtn.focus({ preventScroll: true });
}

function openPopup() {
  typeList.innerHTML = TYPES.map(t =>
    `<button type="button" class="type-opt${t === currentType ? " selected" : ""}" data-type="${esc(t)}"
       aria-pressed="${t === currentType}">${esc(typeLabel(t))}</button>`
  ).join("");
  popup.hidden = false;
  document.body.classList.add("popup-open");
  changeUserBtn.classList.add("active");
  changeUserBtn.setAttribute("aria-expanded", "true");
  (typeList.querySelector(".selected") || typeList.querySelector(".type-opt")).focus({ preventScroll: true });
}

function closePopup() {
  popup.hidden = true;
  document.body.classList.remove("popup-open");
  changeUserBtn.classList.remove("active");
  changeUserBtn.setAttribute("aria-expanded", "false");
}

menuBtn.addEventListener("click", openMenu);
document.getElementById("popupBackdrop").addEventListener("click", closePopup);
scrim.addEventListener("click", () => { if (!popup.hidden) closePopup(); else closeMenu(); });
changeUserBtn.addEventListener("click", () => { if (popup.hidden) openPopup(); else closePopup(); });

typeList.addEventListener("click", e => {
  const btn = e.target.closest(".type-opt");
  if (!btn) return;
  // Tapping the type that is already selected turns it off and goes back to All Users.
  currentType = btn.dataset.type === currentType ? ALL : btn.dataset.type;
  renderCards();
  closePopup();
  closeMenu();
  window.scrollTo(0, 0);
});

document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !session) return;
  if (!popup.hidden) closePopup(); else closeMenu();
});

// Sign Out: show a small loading modal for a moment, then lock the page.
const signoutOverlay = document.getElementById("signoutOverlay");
const SIGNOUT_DELAY = 1100; // ms
let signingOut = false;
document.getElementById("signOutBtn").addEventListener("click", () => {
  if (signingOut) return;
  signingOut = true;
  signoutOverlay.hidden = false;
  setTimeout(() => {
    signoutOverlay.hidden = true;
    signingOut = false;
    lock();
  }, SIGNOUT_DELAY);
});
document.getElementById("backMain").addEventListener("click", () => { window.location.href = BACK_PAGE; });
document.getElementById("pinBack").addEventListener("click", () => { window.location.href = BACK_PAGE; });

const copyBtn = document.getElementById("copyBtn");
let copyTimer;
copyBtn.addEventListener("click", async () => {
  if (!session) return;
  const id = myId();
  if (!id) return;
  let label = "Copied";
  try { await navigator.clipboard.writeText(id); } catch (_) { label = "Copy failed"; }
  copyBtn.textContent = label;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
});

// ---------- Profile photo (+ button) ----------
const photoInput = document.getElementById("photoInput");
const photoOverlay = document.getElementById("photoOverlay");
let picking = false;   // the phone's photo picker hides the page for a moment; don't lock during that

document.getElementById("photoBtn").addEventListener("click", () => {
  picking = true;
  photoInput.value = "";
  photoInput.click();
});
photoInput.addEventListener("cancel", () => { picking = false; });
window.addEventListener("focus", () => setTimeout(() => { picking = false; }, 1500));

function note(text, isError) {
  photoNote.textContent = text;
  photoNote.classList.toggle("err", !!isError);
}

// Center-crop to a 256x256 JPEG so it stays small enough for Firestore.
function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      canvas.getContext("2d").drawImage(
        img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unreadable image")); };
    img.src = url;
  });
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files && photoInput.files[0];
  picking = false;
  if (!file || !session) return;
  if (!file.type.startsWith("image/")) return note("Choose an image file.", true);
  note("");
  photoOverlay.hidden = false;
  const started = Date.now();
  try {
    const dataUrl = await fileToAvatar(file);
    await setProfilePhoto(session.userId, dataUrl);
    await new Promise(r => setTimeout(r, Math.max(0, 700 - (Date.now() - started)))); // avoid a flash
    note("Photo saved. The Users List now shows it too.");
  } catch (err) {
    console.error(err);
    note("Could not save the photo. Try a different image.", true);
  } finally {
    photoOverlay.hidden = true;
  }
});

// ---------- Banner (+ button on the banner) ----------
const bannerInput = document.getElementById("bannerInput");
const photoOverlayText = document.getElementById("photoOverlayText");

document.getElementById("bannerBtn").addEventListener("click", () => {
  picking = true;
  bannerInput.value = "";
  bannerInput.click();
});
bannerInput.addEventListener("cancel", () => { picking = false; });

// Center-crop to a 720x300 (2.4:1) JPEG, the same shape as the banner, so it stays small enough for Firestore.
function fileToBanner(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const W = 720, H = 300, ratio = W / H;
      let sw = img.naturalWidth, sh = sw / ratio;
      if (sh > img.naturalHeight) { sh = img.naturalHeight; sw = sh * ratio; }
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      canvas.getContext("2d").drawImage(
        img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unreadable image")); };
    img.src = url;
  });
}

bannerInput.addEventListener("change", async () => {
  const file = bannerInput.files && bannerInput.files[0];
  picking = false;
  if (!file || !session) return;
  if (!file.type.startsWith("image/")) return note("Choose an image file.", true);
  note("");
  photoOverlayText.textContent = "Changing banner...";
  photoOverlay.hidden = false;
  const started = Date.now();
  try {
    const dataUrl = await fileToBanner(file);
    await setBannerPhoto(session.userId, dataUrl);
    await new Promise(r => setTimeout(r, Math.max(0, 700 - (Date.now() - started))));   // avoid a flash
    note("Banner saved.");
  } catch (err) {
    console.error(err);
    note("Could not save the banner. Try a different image.", true);
  } finally {
    photoOverlay.hidden = true;
    photoOverlayText.textContent = "Changing profile...";
  }
});

// ---------- PIN gate (PIN = the 12-digit Password of a Handlers / Developers account in Firebase) ----------
const PIN_LENGTH = 12;
const MAX_TRIES = 5;
const LOCKOUT_MS = 30000;

const modal = document.getElementById("pinModal");
const pinForm = document.getElementById("pinForm");
const pinWrap = document.getElementById("pinInputs");
const pinError = document.getElementById("pinError");
const pinSubmit = document.getElementById("pinSubmit");

const boxes = Array.from({ length: PIN_LENGTH }, (_, i) => {
  const input = document.createElement("input");
  input.type = "password";
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.maxLength = 1;
  input.autocomplete = "off";
  input.setAttribute("aria-label", `PIN digit ${i + 1}`);
  pinWrap.appendChild(input);
  return input;
});

function currentPin() { return boxes.map(b => b.value).join(""); }

function refresh() {
  boxes.forEach(b => b.classList.toggle("filled", b.value !== ""));
  pinSubmit.disabled = currentPin().length !== PIN_LENGTH;
}

function unlock() {
  currentType = ALL;   // always start on All Users after unlocking
  document.body.classList.remove("locked");
  modal.hidden = true;
  startListening();
}

// Lock again: stop listening, wipe the cards and menu from the DOM, clear the boxes, show the modal.
function lock() {
  if (stopListening) { stopListening(); stopListening = null; }
  session = null;
  accounts = [];
  currentType = ALL;
  loaded = false;
  list.innerHTML = "";
  document.getElementById("meInfos").innerHTML = "";
  document.getElementById("idValue").textContent = "";
  document.getElementById("mePhoto").removeAttribute("src");
  document.getElementById("meBanner").removeAttribute("src");
  closeMenu();
  boxes.forEach(b => (b.value = ""));
  pinError.textContent = "";
  document.body.classList.add("locked");
  modal.hidden = false;
  refresh();
  boxes[0].focus();
}

function fail(message) {
  pinError.textContent = message;
  pinWrap.classList.remove("shake");
  void pinWrap.offsetWidth; // restart animation
  pinWrap.classList.add("shake");
  boxes.forEach(b => (b.value = ""));
  refresh();
  boxes[0].focus();
}

function fillFrom(start, digits) {
  for (let k = 0; k < digits.length && start + k < PIN_LENGTH; k++) boxes[start + k].value = digits[k];
  boxes[Math.min(start + digits.length, PIN_LENGTH - 1)].focus();
  refresh();
}

boxes.forEach((box, i) => {
  box.addEventListener("input", () => {
    pinError.textContent = "";
    pinWrap.classList.remove("shake");
    const digits = box.value.replace(/\D/g, "");
    box.value = "";
    // One digit per box; multi-character input (e.g. pasted via autofill) is ignored.
    if (digits.length === 1) fillFrom(i, digits); else refresh();
  });
  box.addEventListener("keydown", e => {
    if (e.key === "Backspace" && !box.value && i > 0) {
      boxes[i - 1].value = "";
      boxes[i - 1].focus();
      refresh();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) boxes[i - 1].focus();
    else if (e.key === "ArrowRight" && i < PIN_LENGTH - 1) boxes[i + 1].focus();
  });
  // Pasting is disabled: the PIN has to be typed.
  ["paste", "drop", "copy", "cut"].forEach(ev =>
    box.addEventListener(ev, e => e.preventDefault())
  );
  box.addEventListener("focus", () => box.select());
});

let unlocking = false;
let tries = 0;
let lockedUntil = 0;

function setLoading(on) {
  unlocking = on;
  pinSubmit.classList.toggle("loading", on);
  pinSubmit.disabled = on || currentPin().length !== PIN_LENGTH;
  pinSubmit.textContent = on ? "" : "Unlock";
  if (on) pinSubmit.insertAdjacentHTML("afterbegin", '<span class="spinner" aria-hidden="true"></span><span>Checking...</span>');
  boxes.forEach(b => (b.disabled = on));
}

pinForm.addEventListener("submit", async e => {
  e.preventDefault();
  if (unlocking) return;

  const wait = Math.ceil((lockedUntil - Date.now()) / 1000);
  if (wait > 0) return fail(`Too many tries. Wait ${wait}s and try again.`);

  const pin = currentPin();
  pinError.textContent = "";
  setLoading(true);

  let account = null;
  let failMsg = "";
  try { account = await loginWithPin(pin); }
  catch (err) {
    console.error(err);
    failMsg = err.code === "PIN_NOT_UNIQUE"
      ? "This PIN is used by more than one account. Ask a developer to change it."
      : "Could not check the PIN. Check your connection and try again.";
  }
  setLoading(false);

  if (failMsg) return fail(failMsg);
  if (!account) {
    if (++tries >= MAX_TRIES) { tries = 0; lockedUntil = Date.now() + LOCKOUT_MS; }
    return fail("PIN not found. Use the 12-digit PIN (Password) of your Handlers or Developers account.");
  }

  tries = 0;
  session = {
    userId: account.userId,
    pin,
    kind: account.type === "Handlers" ? "Handlers ID" : "Developer ID",
    account
  };
  unlock();
});

// Older Handlers / Developers accounts get their 12-digit ID once, so they can log in too.
backfillSystemIds().catch(err => console.error(err));

// The PIN is asked on every load...
refresh();
boxes[0].focus();

// ...and on every re-open: coming back from another tab/app, or via back/forward cache.
window.addEventListener("pageshow", e => { if (e.persisted) lock(); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && modal.hidden && !picking) lock();
});

// ---------- Screenshot / copy deterrents ----------
// Browsers cannot truly block screenshots. These measures hide the page whenever it
// loses focus, blank it on common screenshot/print shortcuts, and block copy/print.
const body = document.body;
let shieldTimer;

function shield(ms = 1500) {
  body.classList.add("shielded");
  clearTimeout(shieldTimer);
  if (ms) shieldTimer = setTimeout(unshield, ms);
}
function unshield() {
  if (document.hasFocus()) body.classList.remove("shielded");
}

window.addEventListener("blur", () => shield(0));   // snipping tools / other windows take focus
window.addEventListener("focus", unshield);

document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  const isShot =
    k === "printscreen" || k === "snapshot" ||
    (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(k)) ||      // macOS
    (e.metaKey && e.shiftKey && k === "s") ||                        // Windows Win+Shift+S
    (e.ctrlKey && e.shiftKey && k === "s");
  if (isShot || (mod && ["p", "s", "c", "x", "u"].includes(k))) {
    shield();
    if (k !== "printscreen" && k !== "snapshot" && !isShot) e.preventDefault();
  }
});

document.addEventListener("keyup", e => {
  if (e.key === "PrintScreen") {
    shield(2500);
    try { navigator.clipboard.writeText(""); } catch (_) {} // wipe whatever landed on the clipboard
  }
});

["contextmenu", "copy", "cut", "paste", "dragstart", "selectstart"].forEach(ev =>
  document.addEventListener(ev, e => {
    if (!(e.target instanceof HTMLInputElement) || ev !== "selectstart") e.preventDefault();
  })
);
window.addEventListener("beforeprint", () => shield(0));
window.addEventListener("afterprint", unshield);