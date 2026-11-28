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
    status: ACCOUNT_STATUS,
    online: isAccountOnline(a)
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

// Saves the banner (a JPEG data URL, up to ~600 KB so a high-resolution banner fits) on the account as bannerPhoto.
// The Users List reads the same field, so the banner shows on the user's card too.
async function setBannerPhoto(userId, dataUrl) {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl) || dataUrl.length > 600000) {
    throw accountError("PHOTO_INVALID", "Banner is not valid or too large.");
  }
  await accountsRef.doc(userId).update({ bannerPhoto: dataUrl, bannerUpdatedAt: Date.now() });
}

/* =========================================================
   ONLINE STATUS (presence)
   Firestore has no "on disconnect" hook, so an online account sends a
   heartbeat every 30 s (online:true + lastSeen). If the heartbeat stops
   (tab closed, phone locked, no internet) the account counts as offline
   after 90 s, even if the "offline" write never got through.
   ========================================================= */
const PRESENCE_BEAT_MS  = 30 * 1000;
const PRESENCE_STALE_MS = 90 * 1000;
let presenceTimer = null;
let presenceUserId = null;

// Online time (onlineSeconds): counts up while the account is online, back to 0 when offline / logout.
// Your Firestore Rules allow it as a separate update (only onlineSeconds), so it is a second write.
let presenceSeconds = 0;
let presenceLastBeat = 0;

function writePresence(userId, online) {
  const ref = accountsRef.doc(String(userId).toUpperCase());
  const now = Date.now();
  if (online) {
    // add the time since the last beat (max 60 s, so a sleeping phone can't jump the counter)
    if (presenceLastBeat) presenceSeconds += Math.min(Math.round((now - presenceLastBeat) / 1000), 60);
    presenceLastBeat = now;
  } else {
    presenceSeconds = 0;
    presenceLastBeat = 0;
  }
  const seconds = presenceSeconds;
  return ref.update({
    online: online,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => ref.update({ onlineSeconds: seconds })).catch(e => {
    // Account deleted in Firebase → stop sending heartbeats (nothing to update).
    if (e && e.code === "not-found") {
      if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
      presenceUserId = null;
    }
    // "permission-denied" means the Firestore Rules block the online / lastSeen fields.
    console.error("Could not update the online status:", e && e.code ? e.code : e, e);
  });
}

let presenceListenersAdded = false;

// Call once after login. Marks the account online and keeps it online while the page is open.
function startPresence(userId) {
  if (!userId) return;
  userId = String(userId).toUpperCase();
  if (presenceTimer && presenceUserId === userId) return;
  if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
  presenceUserId = userId;
  writePresence(userId, true);
  presenceTimer = setInterval(() => {
    // Background tabs are throttled by the browser, so only beat while the page is visible.
    if (document.visibilityState === "visible") writePresence(userId, true);
  }, PRESENCE_BEAT_MS);

  if (presenceListenersAdded) return;      // add the page listeners only once
  presenceListenersAdded = true;

  // Tab hidden / phone locked → offline right away. Back to the tab → online right away.
  document.addEventListener("visibilitychange", () => {
    if (!presenceUserId) return;
    writePresence(presenceUserId, document.visibilityState === "visible");
  });
  window.addEventListener("pagehide", () => { if (presenceUserId) writePresence(presenceUserId, false); });
  window.addEventListener("pageshow", () => { if (presenceUserId) writePresence(presenceUserId, true); });
  window.addEventListener("online",   () => { if (presenceUserId) writePresence(presenceUserId, true); });
  window.addEventListener("offline",  () => { /* no connection: the 90 s timeout marks the account offline */ });
}

// Call on logout. Always resolves, so the logout is never blocked.
function stopPresence() {
  if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
  const id = presenceUserId;
  presenceUserId = null;               // set first so the page listeners stop writing
  return id ? writePresence(id, false) : Promise.resolve();
}

// Starts presence for the saved login (call on every page load). Resolves to the User ID or "".
async function connectPresence() {
  const session = await verifyLoginSession();      // confirms the account exists in Firebase
  if (!session) return "";
  startPresence(session.id);
  return session.id;
}

// True only if the account is flagged online AND its heartbeat is recent.
function isAccountOnline(account) {
  if (!account || account.online !== true) return false;
  const ls = account.lastSeen;
  if (!ls || typeof ls.toMillis !== "function") return true;   // write still pending
  return Date.now() - ls.toMillis() < PRESENCE_STALE_MS;
}

// Older name kept so existing calls still work.
function setPresence(userId, online) { return writePresence(userId, online); }

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

// ---------- Signed-in account (Quick Menu card) ----------
// Live profile of one account (username, type, profilePhoto, bannerPhoto only - never the password / passkey).
// onData gets null when the account does not exist. Returns a function that stops listening.
function listenAccountProfile(userId, onData, onError) {
  return accountsRef.doc(String(userId).toUpperCase()).onSnapshot(snap => {
    if (!snap.exists) { onData(null); return; }
    const d = snap.data();
    onData({
      userId: snap.id,
      username: d.username || d.idValue || "",
      type: d.type || "",
      photo: d.profilePhoto || "",
      banner: d.bannerPhoto || "",
      online: isAccountOnline(d)
    });
  }, err => { if (onError) onError(err); });
}

// ---------- Account search (Search page) ----------
// Public fields only - never the password / passkey. (pid = document id, used only to match live updates; never shown.)
// Any signed-in account can search ALL accounts (every type), live from Firebase.
function toSearchAccount(id, a) {
  return {
    pid: id,
    username: a.username || "",
    type: a.type || "",
    role: a.role || "",
    photo: a.profilePhoto || "",
    banner: a.bannerPhoto || "",
    presence: { online: a.online, lastSeen: a.lastSeen },   // raw Firebase presence: isAccountOnline() is checked when shown
    online: isAccountOnline(a)
  };
}

// Live list for the Search page. onData({ signedIn, viewerType, onlyType, accounts }) runs now and again whenever any
// account changes in Firebase - including its online / lastSeen heartbeat, so the green dot follows the real presence.
// Resolves to a function that stops listening. Not signed in = no accounts.
async function listenSearchAccounts(onData, onError) {
  const session = await verifyLoginSession();
  if (!session || !session.data) {
    onData({ signedIn: false, viewerType: "", onlyType: "", accounts: [] });
    return function () {};
  }
  const viewerType = String(session.data.type || "");
  return accountsRef.onSnapshot(snap => {
    const accounts = snap.docs.map(d => toSearchAccount(d.id, d.data()));
    onData({ signedIn: true, viewerType, onlyType: "", accounts });
  }, err => { if (onError) onError(err); });
}

// One-time version of the same list.
async function loadSearchAccounts() {
  const session = await verifyLoginSession();
  if (!session || !session.data) return { signedIn: false, viewerType: "", onlyType: "", accounts: [] };
  const viewerType = String(session.data.type || "");
  const snap = await accountsRef.get();
  const accounts = snap.docs.map(d => toSearchAccount(d.id, d.data()));
  return { signedIn: true, viewerType, onlyType: "", accounts };
}


// ---------- Viewed (who visited a profile card) ----------
// One document per viewed account in the "profileViews" collection (document id = the viewed User ID):
//   { visitors: [ { userId, at }, ... newest first ], updatedAt }
// Opening someone's profile card in Search saves the signed-in account as the newest visitor (never your own card).
// Only the 2 newest visitors are kept and shown. In Search every signed-in user sees the same 2 on a card;
// the Quick Menu shows only the signed-in user's OWN visitors (it reads the document of their own User ID).
const profileViewsRef = db.collection("profileViews");
const PROFILE_VIEWS_KEEP = 2;

async function recordProfileView(viewedUserId) {
  const viewer = getSessionUserId();
  const target = String(viewedUserId || "").toUpperCase();
  if (!viewer || !target || viewer === target) return;
  const ref = profileViewsRef.doc(target);
  try {
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const old = snap.exists && Array.isArray(snap.data().visitors) ? snap.data().visitors : [];
      const visitors = [{ userId: viewer, at: Date.now() }]
        .concat(old.filter(v => v && v.userId && v.userId !== viewer))     // a repeat visit just moves you to the front
        .slice(0, PROFILE_VIEWS_KEEP);
      tx.set(ref, { visitors: visitors, updatedAt: Date.now() });
    });
  } catch (e) {
    // "permission-denied" = add the profileViews rule in Firebase (see the note in the chat)
    console.warn("Could not save the profile view:", e && e.code ? e.code : e);
  }
}

// Live visitors of one account (User IDs, newest first). Returns a function that stops listening.
function listenProfileViews(userId, onData, onError) {
  return profileViewsRef.doc(String(userId).toUpperCase()).onSnapshot(snap => {
    const list = snap.exists && Array.isArray(snap.data().visitors) ? snap.data().visitors : [];
    onData(list.map(v => String(v.userId || "").toUpperCase()).filter(Boolean));
  }, err => { if (onError) onError(err); });
}

/* =========================================================
   LOGIN SESSION (saved in the browser, checked against Firebase)
   On login the page calls saveLoginSession(userId). It is kept in
   localStorage, so it survives closing Chrome / the tab / the phone.
   Only the User ID + login time are stored (never the password or passkey).
   Every page load calls verifyLoginSession(), which confirms the account
   still exists in Firebase. Logout calls clearLoginSession().
   ========================================================= */
const SESSION_KEY = "passkeyUser";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;   // stay logged in for 30 days

// Call right after a successful login.
function saveLoginSession(userId) {
  const data = JSON.stringify({ userId: String(userId).toUpperCase(), loginAt: Date.now() });
  try { localStorage.setItem(SESSION_KEY, data); } catch (e) { console.error("Could not save the login:", e); }
  try { sessionStorage.setItem(SESSION_KEY, data); } catch (e) {}   // keeps older pages working
}

// The saved login, or null (none, broken, or older than 30 days).
function getSavedSession() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) {}
  if (!saved || !saved.userId) {                       // older login saved only for this tab
    try { saved = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) {}
    if (saved && saved.userId) {
      saved.loginAt = saved.loginAt || Date.now();
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(saved)); } catch (e) {}
    }
  }
  if (!saved || !/^[A-Za-z0-9]{6,8}$/.test(String(saved.userId))) return null;
  if (Date.now() - (saved.loginAt || 0) > SESSION_MAX_AGE_MS) { clearLoginSession(); return null; }
  saved.userId = String(saved.userId).toUpperCase();
  return saved;
}

function getSessionUserId() {
  const s = getSavedSession();
  return s ? s.userId : "";
}

// Confirms the saved login in Firebase. Resolves to { id, data } or null if not logged in / account is gone.
// If Firebase can't be reached, the login is kept and data is null.
async function verifyLoginSession() {
  const s = getSavedSession();
  if (!s) return null;
  try {
    const snap = await accountsRef.doc(s.userId).get();
    if (!snap.exists) { clearLoginSession(); return null; }
    return { id: snap.id, data: snap.data() };
  } catch (e) {
    console.error("Could not confirm the login with Firebase:", e);
    return { id: s.userId, data: null };
  }
}

// Call on logout.
function clearLoginSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}