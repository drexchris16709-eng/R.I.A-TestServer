/* =========================================================
   accounts-db.js — shared by UserI.html and H.html (Handlers Section)
   Firebase Firestore. Keep an identical copy in BOTH folders.
   ========================================================= */

// Paste your Firebase web app config here (Project settings → General → Your apps → Web app → SDK setup).
const firebaseConfig = {
  apiKey: "AIzaSyDV0nUNfJrLFbflGWE7K2A_3MeMeUlUS1Y",
  authDomain: "ria-1-55840.firebaseapp.com",
  projectId: "ria-1-55840",
  storageBucket: "ria-1-55840.firebasestorage.app",
  messagingSenderId: "511303333974",
  appId: "1:511303333974:web:09b0fb3f0167db8c3de3f7",
  measurementId: "G-TZDYPSJMRS"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const accountsRef = db.collection("accounts");

const ACCOUNT_ROLE = "Beta User";
const ACCOUNT_STATUS = "Done Created";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const LETTERS_DIGITS = LETTERS + DIGITS;

// Account types created from the "Specials" menu (they get extra system-generated IDs).
const SPECIAL_TYPES = ["Test Account", "Super Account", "Handlers", "Developers"];

// Role given to each account type.
const ROLE_BY_TYPE = {
  "Student": ACCOUNT_ROLE,
  "Teacher": ACCOUNT_ROLE,
  "Test Account": "Early User",
  "Super Account": "Super VIP",
  "Handlers": "Developer",
  "Developers": "Developer"
};

// Extra form fields saved with each account type (besides type / idLabel / idValue / password / school).
// PINs are saved as the account password, so "pin" is not stored twice.
const EXTRA_FIELDS = {
  "Student": ["username", "gradeSection", "adviser"],
  "Teacher": ["username", "gradeSection", "department"],
  "Test Account": ["username", "purpose", "idNumber"],
  "Super Account": ["username", "purpose", "idNumber"],
  "Handlers": ["username", "purpose", "age"],
  "Developers": ["purpose", "age", "username", "industry", "country"]
};

// Cryptographically random string from the given characters (no modulo bias).
function randomString(chars, len) {
  const limit = 256 - (256 % chars.length);
  let out = "";
  while (out.length < len) {
    const bytes = new Uint8Array(len * 2);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && out.length < len; i++) {
      if (bytes[i] < limit) out += chars[bytes[i] % chars.length];
    }
  }
  return out;
}

// Random letters + numbers that always contains at least one letter and one number.
function randomMixed(len) {
  let v;
  do { v = randomString(LETTERS_DIGITS, len); } while (!/[A-Z]/.test(v) || !/[0-9]/.test(v));
  return v;
}

// User ID: 8 random letters & numbers.
function generateUserId(len = 8) {
  return randomMixed(len);
}

// System-generated IDs (provided by the system, stored in Firebase).
//   User ID          8 letters & numbers   (every account, see createAccountRequest)
//   Test Account ID  12 letters
//   Super Account ID 12 letters
//   SSID             12 numbers
//   Bundle ID        4 letters & numbers
//   Developer ID     12 numbers  (Developers accounts)
//   Handlers ID      12 numbers  (Handlers accounts)
function generateSpecialIds(type) {
  const ids = {};
  if (type === "Test Account") ids.testAccountId = randomString(LETTERS, 12);
  if (type === "Super Account" || type === "Handlers" || type === "Developers") {
    ids.superAccountId = randomString(LETTERS, 12);
  }
  if (type === "Super Account") ids.bundleId = randomMixed(4);
  if (type === "Handlers") ids.handlersId = randomString(DIGITS, 12);
  if (type === "Developers") ids.developerId = randomString(DIGITS, 12);
  if (SPECIAL_TYPES.indexOf(type) !== -1) ids.ssid = randomString(DIGITS, 12);
  return ids;
}

// Random 8-character Passkey (A-Z + 0-9), always has at least one letter and one number.
function generatePasskey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key;
  do {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    key = Array.from(bytes, b => chars[b % chars.length]).join("");
  } while (!/[A-Z]/.test(key) || !/[0-9]/.test(key));
  return key;
}

function formatAccountDate(d = new Date()) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// IDs the system must have generated before an account may be saved.
const REQUIRED_GENERATED_IDS = {
  "Student": [],
  "Teacher": [],
  "Test Account": ["testAccountId", "ssid"],
  "Super Account": ["superAccountId", "bundleId", "ssid"],
  "Handlers": ["superAccountId", "ssid", "handlersId"],
  "Developers": ["superAccountId", "ssid", "developerId"]
};

// Some forms ask the user to type an ID that the system issued to a Handlers / Developers account
// (visible only in Firebase). It must exist there, otherwise the account is not created.
const LINKED_IDS = {
  "Test Account": { handlersId: "linkedHandlersId" },
  "Super Account": { handlersId: "linkedHandlersId", developerId: "linkedDeveloperId" },
  "Handlers": { developerId: "linkedDeveloperId" }
};
const LINKED_LOOKUP = {
  handlersId: { field: "handlersId", type: "Handlers", label: "Handlers ID" },
  developerId: { field: "developerId", type: "Developers", label: "Developer ID" }
};

function accountError(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

// Handlers ID / Developer ID are used to look accounts up, so they must be unique.
async function ensureUniqueId(extra, field, regenerate) {
  for (let i = 0; i < 5; i++) {
    const snap = await accountsRef.where(field, "==", extra[field]).limit(1).get();
    if (snap.empty) return;
    extra[field] = regenerate();
  }
  throw accountError("ID_GENERATION_FAILED", "Could not create " + field + ". Account not created.");
}

// Saves one account. The document ID is the User ID, so two accounts can never share one.
async function createAccountRequest(data) {
  // Extra fields from the form (only the ones this account type uses)
  const extra = {};
  (EXTRA_FIELDS[data.type] || []).forEach(k => {
    if (data[k] !== undefined && data[k] !== null && String(data[k]) !== "") extra[k] = String(data[k]);
  });

  // 1) Typed Handlers ID / Developer ID must exist in Firebase (issued by the system).
  const linked = LINKED_IDS[data.type] || {};
  for (const typedKey of Object.keys(linked)) {
    const info = LINKED_LOOKUP[typedKey];
    const typed = String(data[typedKey] || "").trim();
    let found = false;
    if (/^[0-9]{12}$/.test(typed)) {
      const snap = await accountsRef.where(info.field, "==", typed).limit(1).get();
      found = snap.docs.some(d => d.data().type === info.type);
    }
    if (!found) {
      throw accountError("ID_NOT_APPROVED", info.label + " not found. Account not created.");
    }
    extra[linked[typedKey]] = typed;
  }

  // 2) IDs provided by the system. All of them must exist or nothing is saved.
  Object.assign(extra, generateSpecialIds(data.type));
  if (extra.handlersId) await ensureUniqueId(extra, "handlersId", () => randomString(DIGITS, 12));
  if (extra.developerId) await ensureUniqueId(extra, "developerId", () => randomString(DIGITS, 12));

  const missing = (REQUIRED_GENERATED_IDS[data.type] || []).filter(k => !extra[k]);
  if (missing.length) {
    throw accountError("ID_GENERATION_FAILED", "Could not create " + missing.join(", ") + ". Account not created.");
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const userId = generateUserId(8);          // User ID: 8 letters & numbers
    const ref = accountsRef.doc(userId);

    const created = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists) return false;          // ID already used → try another one
      tx.set(ref, Object.assign({}, extra, {
        type: data.type,
        idLabel: data.idLabel,
        idValue: data.idValue,
        password: data.password,
        school: data.school || "",
        userId: userId,
        passkey: generatePasskey(),
        role: ROLE_BY_TYPE[data.type] || ACCOUNT_ROLE,
        status: ACCOUNT_STATUS,
        date: formatAccountDate(),
        createdAt: Date.now()
      }));
      return true;
    });

    if (created) return { userId };
  }
  throw accountError("ID_GENERATION_FAILED", "Could not create a unique User ID. Account not created.");
}

// Every account, oldest first. "User 1", "User 2"… are numbered in this order.
async function getAllAccounts() {
  const snap = await accountsRef.orderBy("createdAt").get();
  const accounts = [];
  for (let i = 0; i < snap.docs.length; i++) {
    const d = snap.docs[i];
    const data = d.data();
    if (!data.passkey) {                       // older account → create its passkey once
      data.passkey = generatePasskey();
      await d.ref.update({ passkey: data.passkey });
    }
    accounts.push(Object.assign({}, data, { name: "User " + (i + 1) }));
  }
  return accounts;
}

// Rows for the Users List.
async function getRegisteredUsers() {
  const all = await getAllAccounts();
  return all.map(a => ({
    name: a.idValue || a.name,      // LRN / Contact No instead of "User 1"
    userId: a.userId,
    photo: a.profilePhoto || "",    // profile picture set in the Handlers menu (empty = use the default avatar)
    position: a.type,
    role: a.role,
    date: a.date,
    status: ACCOUNT_STATUS
  }));
}

// Full details for the Handlers Section.
function getHandlerRequests() {
  return getAllAccounts();
}

// Live list of accounts (oldest first). Calls onData every time an account is added or changed,
// so a new "Create Account" request shows up in the Users List right away.
// Returns a function that stops listening.
function listenAccounts(onData, onError) {
  return accountsRef.orderBy("createdAt").onSnapshot(snap => {
    onData(snap.docs.map((d, i) => Object.assign({}, d.data(), { name: "User " + (i + 1) })));
  }, err => { if (onError) onError(err); });
}

// Older Developers / Handlers accounts were made before Developer ID / Handlers ID existed.
// Give each one its 12-digit ID once (never changes an ID that is already there).
async function backfillSystemIds() {
  const jobs = [["Developers", "developerId"], ["Handlers", "handlersId"]];
  for (const [type, field] of jobs) {
    const snap = await accountsRef.where("type", "==", type).get();
    for (const d of snap.docs) {
      if (d.data()[field]) continue;
      let id = null;
      for (let i = 0; i < 5 && !id; i++) {
        const candidate = randomString(DIGITS, 12);
        const taken = await accountsRef.where(field, "==", candidate).limit(1).get();
        if (taken.empty) id = candidate;
      }
      if (!id) continue;
      try { await d.ref.update({ [field]: id }); } catch (e) { /* another device filled it first */ }
    }
  }
}

// ---------- Handlers Section login + profile photo ----------

// The 12-digit PIN is the Password saved in Firebase on a Handlers or Developers account.
// Returns that account, or null if no Handlers / Developers account has this password.
// If two accounts share the same PIN it refuses (PIN_NOT_UNIQUE) instead of guessing.
async function loginWithPin(pin) {
  if (!/^[0-9]{12}$/.test(pin)) return null;
  const hits = [];
  for (const type of ["Handlers", "Developers"]) {
    const snap = await accountsRef
      .where("password", "==", pin)
      .where("type", "==", type)
      .limit(2)
      .get();
    snap.docs.forEach(d => hits.push(Object.assign({}, d.data(), { userId: d.id })));
  }
  if (hits.length > 1) {
    throw accountError("PIN_NOT_UNIQUE", "This PIN is used by more than one account.");
  }
  return hits[0] || null;
}

// Saves the profile picture (a small JPEG data URL) on the account.
// The Users List reads the same field (profilePhoto), so both pages show the same picture.
async function setProfilePhoto(userId, dataUrl) {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl) || dataUrl.length > 300000) {
    throw accountError("PHOTO_INVALID", "Photo is not valid or too large.");
  }
  await accountsRef.doc(userId).update({ profilePhoto: dataUrl, photoUpdatedAt: Date.now() });
}

// ---------- Online presence ----------
// Test1.html calls startPresence(): the account is saved as online in Firebase, a heartbeat refreshes
// lastSeen every 25 s, and the account is set offline when the page is closed or hidden.
// The Users List counts an account as online while online == true AND lastSeen is recent
// (so a closed browser / lost connection stops counting after about a minute).
const PRESENCE_BEAT_MS = 25000;
const PRESENCE_STALE_MS = 70000;

function setPresence(userId, online) {
  return accountsRef.doc(userId).update({
    online: !!online,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function isAccountOnline(a) {
  if (!a || a.online !== true) return false;
  if (!a.lastSeen) return true;                       // our own write not confirmed by the server yet
  const t = a.lastSeen.toMillis ? a.lastSeen.toMillis() : Number(a.lastSeen);
  return Date.now() - t < PRESENCE_STALE_MS;
}

// User ID of the signed-in account (saved in this tab by the login as sessionStorage "passkeyUser"; removed on logout).
function getSessionUserId() {
  try { return String((JSON.parse(sessionStorage.getItem("passkeyUser") || "null") || {}).userId || "").toUpperCase(); } catch (e) { return ""; }
}

// Online time: seconds the account has been active (saved as "onlineSeconds").
// It keeps counting across page refreshes and is set back to 0 only when the user logs out.
// It is a separate write from presence, so presence still works even if this one is refused.
function setOnlineTime(userId, seconds) {
  const s = Math.max(0, Math.min(31536000, Math.floor(Number(seconds) || 0)));
  return accountsRef.doc(userId).update({ onlineSeconds: s });
}

// Saved online time of an account (0 if none yet).
async function getOnlineSeconds(userId) {
  const snap = await accountsRef.doc(userId).get();
  const v = snap.exists ? Number(snap.data().onlineSeconds) : 0;
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

// Sets an account's online time back to 0 (what a logout does).
function resetOnlineTime(userId) {
  return accountsRef.doc(userId).update({ onlineSeconds: 0 });
}

// Firebase "online" is false = online time starts again from 0.
// If the account is NOT online in Firebase (online == false, or online == true but the heartbeat stopped
// so lastSeen is older than PRESENCE_STALE_MS), its saved online time is set back to 0.
// Returns true when it was reset.
async function resetTimeIfOffline(userId) {
  const snap = await accountsRef.doc(userId).get();
  if (!snap.exists) return false;
  const d = snap.data();
  if (!(Number(d.onlineSeconds) > 0)) return false;          // already 0
  let gone = d.online !== true;                              // online false (or never set)
  if (!gone && d.lastSeen) {
    const t = d.lastSeen.toMillis ? d.lastSeen.toMillis() : Number(d.lastSeen);
    gone = Date.now() - t >= PRESENCE_STALE_MS;              // marked online, but the heartbeat stopped
  }
  if (!gone) return false;
  await resetOnlineTime(userId);
  return true;
}

// Marks the account offline AND sets its online time to 0 (online false = time 0).
// Two separate writes, because the rules only allow online/lastSeen or onlineSeconds in one update.
function setOfflineAndReset(userId) {
  const offline = setPresence(userId, false).catch(() => {});
  const reset = resetOnlineTime(userId).catch(() => {});
  return Promise.all([offline, reset]);
}

// ---------- Logout = online time starts again from 0 ----------
// When the saved sign-in ("passkeyUser") is removed or replaced by another account on ANY page that loads
// this file, that account's online time is reset. The reset is remembered in this browser until Firebase
// confirms it, so it still happens if the page is closed or changed right after logging out.
const PENDING_RESET_KEY = "ria_pending_time_reset";

async function flushPendingTimeResets() {
  try {
    if (typeof firebase === "undefined") return;
    const ids = JSON.parse(localStorage.getItem(PENDING_RESET_KEY) || "[]");
    for (const id of ids) {
      try { await resetOnlineTime(id); } catch (e) {
        if (!e || e.code !== "not-found") continue;          // try again later
      }
      const left = JSON.parse(localStorage.getItem(PENDING_RESET_KEY) || "[]").filter(x => x !== id);
      localStorage.setItem(PENDING_RESET_KEY, JSON.stringify(left));
    }
  } catch (e) { /* storage not available */ }
}

(function watchLogout() {
  const KEY = "passkeyUser";
  const idOf = raw => { try { return (JSON.parse(raw || "null") || {}).userId || ""; } catch (e) { return ""; } };
  const isSession = st => { try { return st === window.sessionStorage; } catch (e) { return false; } };
  const queue = id => {
    if (!id) return;
    try {
      const list = JSON.parse(localStorage.getItem(PENDING_RESET_KEY) || "[]");
      if (list.indexOf(id) === -1) list.push(id);
      localStorage.setItem(PENDING_RESET_KEY, JSON.stringify(list));
    } catch (e) {}
    flushPendingTimeResets();
  };
  const proto = Storage.prototype;
  const origRemove = proto.removeItem, origClear = proto.clear, origSet = proto.setItem;
  proto.removeItem = function (k) {
    const id = (isSession(this) && k === KEY) ? idOf(this.getItem(KEY)) : "";
    origRemove.apply(this, arguments);
    queue(id);
  };
  proto.clear = function () {
    const id = isSession(this) ? idOf(this.getItem(KEY)) : "";
    origClear.apply(this, arguments);
    queue(id);
  };
  proto.setItem = function (k, v) {
    let id = "";
    if (isSession(this) && k === KEY) { const old = idOf(this.getItem(KEY)); if (old && old !== idOf(v)) id = old; }
    origSet.apply(this, arguments);
    queue(id);
  };
})();

let presenceTimer = null;
let presenceUserId = null;
// getSeconds (optional): a function that returns the page's online time in seconds.
function startPresence(userId, getSeconds) {
  if (!userId) userId = getSessionUserId();
  if (!userId || presenceTimer) return;
  presenceUserId = userId;
  const saveTime = () => {
    if (typeof getSeconds === "function") setOnlineTime(userId, getSeconds()).catch(e => console.warn("Online time:", e));
  };
  const beat = () => {
    if (!presenceTimer) return;                      // stopped (logout)
    setPresence(userId, true).catch(e => console.warn("Presence:", e));
    saveTime();
  };
  const off = () => {
    if (!presenceTimer) return;
    setOfflineAndReset(userId);                      // online false -> online time back to 0
  };
  presenceTimer = setInterval(beat, PRESENCE_BEAT_MS);
  beat();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") beat(); else off();
  });
  window.addEventListener("pagehide", off);
  window.addEventListener("online", beat);
}

// Call on logout: stops the heartbeat and marks the account offline. Always resolves, so logout is never blocked.
function stopPresence() {
  if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
  const id = presenceUserId;
  presenceUserId = null;
  return id ? setOfflineAndReset(id) : Promise.resolve();
}

// ---------- Developer Passkeys (lock in UserI.html) ----------
// The Passkey is the 8-character "passkey" saved on every account in Firebase.
// Only a Developers account's passkey opens the Developers lock.
// Returns that account (without the passkey) or null when no Developers account has this passkey.
async function verifyDeveloperPasskey(passkey) {
  const key = String(passkey || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(key)) return null;
  const snap = await accountsRef
    .where("passkey", "==", key)
    .where("type", "==", "Developers")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { userId: d.id, username: d.data().username || "" };
}

// ---------- Developer profile (for the Inbox) ----------
// Looks up ONE Developers account by its 12-digit Developer ID and returns its name and profile picture
// (the one set in the Handlers menu). Any other Developer is ignored.
// Returns { userId, username, photo } ("photo" is empty when no picture was set) or null if not found.
async function getDeveloperProfile(developerId) {
  const id = String(developerId || "").trim();
  if (!/^[0-9]{12}$/.test(id)) return null;
  const snap = await accountsRef.where("developerId", "==", id).limit(1).get();
  const d = snap.docs.find(x => x.data().type === "Developers");
  if (!d) return null;
  const data = d.data();
  return { userId: d.id, username: data.username || "", photo: data.profilePhoto || "" };
}