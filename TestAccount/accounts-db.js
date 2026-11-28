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
const ACCOUNT_STATUS = "Not created yet";

// Random 6-character User ID (A-Z + 0-9), always has at least one letter and one number.
function generateUserId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id;
  do {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    id = Array.from(bytes, b => chars[b % chars.length]).join("");
  } while (!/[A-Z]/.test(id) || !/[0-9]/.test(id));
  return id;
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

// Saves one account. The document ID is the User ID, so two accounts can never share one.
async function createAccountRequest(data) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const userId = generateUserId();
    const ref = accountsRef.doc(userId);

    const created = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists) return false;          // ID already used → try another one
      tx.set(ref, {
        type: data.type,
        idLabel: data.idLabel,
        idValue: data.idValue,
        password: data.password,
        school: data.school,
        userId: userId,
        passkey: generatePasskey(),
        role: ACCOUNT_ROLE,
        status: ACCOUNT_STATUS,
        date: formatAccountDate(),
        createdAt: Date.now()
      });
      return true;
    });

    if (created) return { userId };
  }
  throw new Error("Could not generate a unique User ID");
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
    accounts.push(Object.assign({}, data, {
      name: "User " + (i + 1),
      online: isAccountOnline(data)            // true only if it sent a heartbeat recently
    }));
  }
  return accounts;
}

// Rows for the Users List.
async function getRegisteredUsers() {
  const all = await getAllAccounts();
  return all.map(a => ({
    name: a.idValue || a.name,      // LRN / Contact No instead of "User 1"
    position: a.type,
    role: a.role,
    date: a.date,
    status: a.status,
    online: a.online
  }));
}

// Full details for the Handlers Section.
function getHandlerRequests() {
  return getAllAccounts();
}

// "User 1", "User 2"… — the account's User Name, numbered by creation order (same as getAllAccounts).
async function getAccountName(userId) {
  const snap = await accountsRef.orderBy("createdAt").get();
  const id = String(userId).toUpperCase();
  const i = snap.docs.findIndex(d => d.id === id);
  return i === -1 ? null : "User " + (i + 1);
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

function writePresence(userId, online) {
  return accountsRef.doc(String(userId).toUpperCase()).update({
    online: online,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(e => console.error("Could not update the online status:", e));
}

// Call once after login. Marks the account online and keeps it online while the page is open.
function startPresence(userId) {
  if (!userId || presenceTimer) return;
  presenceUserId = userId;
  writePresence(userId, true);
  presenceTimer = setInterval(() => writePresence(userId, true), PRESENCE_BEAT_MS);

  // Back to this tab → refresh right away. Leaving the page → mark offline (best effort).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && presenceTimer) writePresence(userId, true);
  });
  window.addEventListener("pagehide", () => { if (presenceTimer) writePresence(userId, false); });
  window.addEventListener("pageshow", () => { if (presenceTimer) writePresence(userId, true); });
}

// Call on logout. Always resolves, so the logout is never blocked.
function stopPresence() {
  if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
  const id = presenceUserId;
  presenceUserId = null;
  return id ? writePresence(id, false) : Promise.resolve();
}

// True only if the account is flagged online AND its heartbeat is recent.
function isAccountOnline(account) {
  if (!account || account.online !== true) return false;
  const ls = account.lastSeen;
  if (!ls || typeof ls.toMillis !== "function") return true;   // write still pending
  return Date.now() - ls.toMillis() < PRESENCE_STALE_MS;
}

/* =========================================================
   PROFILE EDITS (User Profile modal in the menu)
   Each one changes ONLY its own fields on accounts/<User ID>, which is
   exactly what the Firestore rules allow (usernameUpdate, passkeyChange,
   profilePhotoUpdate, bannerUpdate).
   ========================================================= */
const USERNAME_MAX = 24;

function isValidPasskey(key) {
  return typeof key === "string" && /^[A-Z0-9]{8}$/.test(key) && /[A-Z]/.test(key) && /[0-9]/.test(key);
}

// Change the User Name.
function updateAccountUsername(userId, name) {
  name = String(name || "").replace(/\s+/g, " ").trim();
  if (!name || name.length > USERNAME_MAX) return Promise.reject(new Error("Invalid name"));
  return accountsRef.doc(String(userId).toUpperCase()).update({ username: name });
}

// Change the Passkey (8 characters, A-Z + 0-9, at least one letter and one number).
function updateAccountPasskey(userId, key) {
  key = String(key || "").toUpperCase();
  if (!isValidPasskey(key)) return Promise.reject(new Error("Invalid passkey"));
  return accountsRef.doc(String(userId).toUpperCase()).update({ passkey: key });
}

// Change the profile photo (small image data URL made by the page).
function updateAccountPhoto(userId, dataUrl) {
  return accountsRef.doc(String(userId).toUpperCase()).update({
    profilePhoto: dataUrl,
    photoUpdatedAt: Date.now()
  });
}

// Change the banner (small image data URL made by the page).
function updateAccountBanner(userId, dataUrl) {
  return accountsRef.doc(String(userId).toUpperCase()).update({
    bannerPhoto: dataUrl,
    bannerUpdatedAt: Date.now()
  });
}

// Delete the profile photo: the fields are REMOVED from accounts/<User ID> in Firebase (not just emptied).
function deleteAccountPhoto(userId) {
  return accountsRef.doc(String(userId).toUpperCase()).update({
    profilePhoto: firebase.firestore.FieldValue.delete(),
    photoUpdatedAt: firebase.firestore.FieldValue.delete()
  });
}

// Delete the banner: the fields are REMOVED from accounts/<User ID> in Firebase (not just emptied).
function deleteAccountBanner(userId) {
  return accountsRef.doc(String(userId).toUpperCase()).update({
    bannerPhoto: firebase.firestore.FieldValue.delete(),
    bannerUpdatedAt: firebase.firestore.FieldValue.delete()
  });
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