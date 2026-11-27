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
    accounts.push(Object.assign({}, data, { name: "User " + (i + 1) }));
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
    status: ACCOUNT_STATUS
  }));
}

// Full details for the Handlers Section.
function getHandlerRequests() {
  return getAllAccounts();
}