// accounts-db.js
// Firebase (Firestore) setup shared by UserI.html, the Handlers Section (H.html) and the Developer login (D.html).
// Load AFTER the two Firebase compat scripts and BEFORE H.js / script.js:
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
//   <script src="accounts-db.js"></script>
// Keep an identical copy in every folder that uses it.

const firebaseConfig = {
  apiKey: "AIzaSyDV0nUNfJrLFbflGWE7K2A_3MeMeUlUS1Y",
  authDomain: "ria-1-55840.firebaseapp.com",
  projectId: "ria-1-55840",
  storageBucket: "ria-1-55840.firebasestorage.app",
  messagingSenderId: "511303333974",
  appId: "1:511303333974:web:09b0fb3f0167db8c3de3f7",
  measurementId: "G-TZDYPSJMRS"
};

const ACCOUNTS_COLLECTION = "accounts";          // match /accounts/{userId}
const RESETS_COLLECTION = "passwordResets";      // match /passwordResets/{userId}

const ACCOUNT_ROLE = "Beta User";
const ACCOUNT_STATUS = "Not created yet";

// How long a password change waits before the new password replaces the old one.
const PASSWORD_RESET_DELAY_MS = 2 * 1000;   // 2 seconds

// ---------------------------------------------------------------------------
// Firebase init (lazy, with clear errors)
// ---------------------------------------------------------------------------
let _db = null;

function getDb() {
  if (_db) return _db;

  if (typeof firebase === "undefined" || !firebase.firestore) {
    throw new Error(
      "Firebase SDK not found. Make sure firebase-app-compat.js and firebase-firestore-compat.js load before accounts-db.js."
    );
  }
  if (!firebaseConfig.projectId || firebaseConfig.projectId.startsWith("YOUR_")) {
    throw new Error("Firebase is not configured. Paste your project's config into firebaseConfig in accounts-db.js.");
  }

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  _db = firebase.firestore();
  return _db;
}

const accountsRef = () => getDb().collection(ACCOUNTS_COLLECTION);
const resetsRef = () => getDb().collection(RESETS_COLLECTION);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatAccountDate(d = new Date()) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

// Saves one account. The document ID is the User ID, so two accounts can never share one.
async function createAccountRequest(data) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const userId = generateUserId();
    const ref = accountsRef().doc(userId);

    const created = await getDb().runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists) return false;          // ID already used -> try another one
      tx.set(ref, {
        type: data.type,
        idLabel: data.idLabel,
        idValue: data.idValue,
        password: data.password,
        school: data.school,
        userId: userId,
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

// Optional helper that lets you pass your own userId (must be 6 chars A-Z / 0-9 per your rules).
async function addHandlerRequest(data) {
  const id = String(data.userId || "");
  await accountsRef().doc(id).set({
    role: ACCOUNT_ROLE,
    status: ACCOUNT_STATUS,
    ...data,
    createdAt: Date.now(),
  });
  return id;
}

// Every account, oldest first. "User 1", "User 2"... are numbered in this order.
async function getAllAccounts() {
  const snap = await accountsRef().orderBy("createdAt").get();
  return snap.docs.map((d, i) => Object.assign({}, d.data(), { id: d.id, name: "User " + (i + 1) }));
}

// Rows for the Users List.
async function getRegisteredUsers() {
  const all = await getAllAccounts();
  return all.map(a => ({
    name: a.name,
    position: a.type,
    role: a.role,
    date: a.date,
    status: a.status
  }));
}

// Full details for the Handlers Section (oldest first, with "User N" names).
function getHandlerRequests() {
  return getAllAccounts();
}

// Same data, newest first (no orderBy query, so it also works for docs missing createdAt).
async function getHandlerRequestsNewestFirst() {
  const snap = await accountsRef().get();
  const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const time = r => {
    if (typeof r.createdAt === "number") return r.createdAt;
    if (r.createdAt && typeof r.createdAt.toMillis === "function") return r.createdAt.toMillis();
    const t = Date.parse(r.date);
    return Number.isNaN(t) ? 0 : t;
  };
  return rows.sort((a, b) => time(b) - time(a));
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

// Checks the User ID + old password, then saves a PENDING reset request.
// The real account password is NOT changed until the delay passes (applyDuePasswordReset) or a handler approves it.
async function requestPasswordReset(userId, oldPassword, newPassword) {
  const id = userId.trim().toUpperCase();
  const snap = await accountsRef().doc(id).get();

  // One generic result for "no such ID" and "wrong password"
  if (!snap.exists || snap.data().password !== oldPassword) {
    return { ok: false, reason: "invalid" };
  }
  if (newPassword === oldPassword) {
    return { ok: false, reason: "same" };
  }

  await resetsRef().doc(id).set({
    userId: id,
    newPassword: newPassword,
    status: "Pending",
    date: formatAccountDate(),
    createdAt: Date.now(),
    applyAt: Date.now() + PASSWORD_RESET_DELAY_MS
  });
  return { ok: true };
}

// For the Handlers Section: pending requests, oldest first.
// (This query needs a composite index on status + createdAt; Firestore's error gives you a one-click link.)
async function getPasswordResets() {
  const snap = await resetsRef().where("status", "==", "Pending").orderBy("createdAt").get();
  return snap.docs.map(d => d.data());
}

async function approvePasswordReset(userId) {
  const resetRef = resetsRef().doc(userId);
  await getDb().runTransaction(async tx => {
    const r = await tx.get(resetRef);
    if (!r.exists) throw new Error("Request not found");
    tx.update(accountsRef().doc(userId), { password: r.data().newPassword });
    tx.update(resetRef, { status: "Approved" });
  });
}

// Replaces the OLD password with the NEW one once the delay (PASSWORD_RESET_DELAY_MS) is over.
// The old password is overwritten in the account (so it stops working) and the stored
// copy of the new password is removed from the request. Safe to call any time:
// it does nothing if there is no request, it is not due yet, or it was already applied.
// Call it from this page and from any login page before checking a password.
async function applyDuePasswordReset(userId) {
  const id = String(userId || "").trim().toUpperCase();
  if (!id) return { applied: false, reason: "none" };

  const resetRef = resetsRef().doc(id);
  const accountRef = accountsRef().doc(id);

  return getDb().runTransaction(async tx => {
    const r = await tx.get(resetRef);
    if (!r.exists) return { applied: false, reason: "none" };

    const req = r.data();
    if (req.status !== "Pending") return { applied: false, reason: "done" };

    const dueAt = req.applyAt || (req.createdAt + PASSWORD_RESET_DELAY_MS);
    if (Date.now() < dueAt) return { applied: false, reason: "waiting", dueAt: dueAt };

    const acc = await tx.get(accountRef);
    if (!acc.exists) return { applied: false, reason: "done" };

    tx.update(accountRef, { password: req.newPassword });          // old password gone
    tx.update(resetRef, {
      status: "Applied",
      appliedAt: Date.now(),
      newPassword: firebase.firestore.FieldValue.delete()          // don't keep a spare copy
    });
    return { applied: true };
  });
}

// ---------------------------------------------------------------------------
// Forgot 12 PIN (Handlers / Developers accounts)
// ---------------------------------------------------------------------------
// The 12-digit PIN is the account's saved password. The account is found by its
// Developer ID (developerId) or Handlers ID (handlersId), both 12 digits issued by the system.
// The request is saved in the same "passwordResets" collection (document ID = the account's User ID),
// so applyDuePasswordReset(userId) replaces the old PIN with the new one after the delay.
async function findPinAccount(systemId) {
  const jobs = [["developerId", "Developers"], ["handlersId", "Handlers"]];
  for (const [field, type] of jobs) {
    const snap = await accountsRef().where(field, "==", systemId).limit(1).get();
    const doc = snap.docs.find(d => d.data().type === type);
    if (doc) return doc;
  }
  return null;
}

// Returns { ok: true, userId } or { ok: false, reason: "format" | "invalid" | "same" | "taken" }.
async function requestPinReset(systemId, oldPin, newPin) {
  const id = String(systemId || "").trim();
  const oldP = String(oldPin || "").trim();
  const newP = String(newPin || "").trim();
  const twelve = /^[0-9]{12}$/;
  if (!twelve.test(id) || !twelve.test(oldP) || !twelve.test(newP)) return { ok: false, reason: "format" };

  const doc = await findPinAccount(id);
  // One generic result for "no such ID" and "wrong PIN"
  if (!doc || doc.data().password !== oldP) return { ok: false, reason: "invalid" };
  if (newP === oldP) return { ok: false, reason: "same" };

  // The PIN logs in Handlers / Developers accounts, so it must stay unique.
  for (const type of ["Handlers", "Developers"]) {
    const snap = await accountsRef().where("password", "==", newP).where("type", "==", type).limit(1).get();
    if (snap.docs.some(d => d.id !== doc.id)) return { ok: false, reason: "taken" };
  }

  await resetsRef().doc(doc.id).set({
    userId: doc.id,
    kind: "pin",
    newPassword: newP,
    status: "Pending",
    date: formatAccountDate(),
    createdAt: Date.now(),
    applyAt: Date.now() + PASSWORD_RESET_DELAY_MS
  });
  return { ok: true, userId: doc.id };
}